import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ARENA, PLAYER, SCORES, WEAPON } from './constants';
import { Arena } from './Arena';
import { Weapon } from './Weapon';
import { Enemy } from './Enemy';
import { ParticleSystem } from './Particles';
import { PlayerController } from './PlayerController';
import { sounds } from '../audio/SoundEffects';

export type GameState = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';

export interface GameHUDData {
  gameState: GameState;
  health: number;
  maxHealth: number;
  magazineAmmo: number;
  reserveAmmo: number;
  isReloading: boolean;
  score: number;
  highScore: number;
  wave: number;
  enemiesRemaining: number;
  waveIntermission: number; // >0 if counting down to next wave
  hitmarker: { visible: boolean; isHeadshot: boolean };
  damageVignette: boolean;
  timeSurvived: number;
  totalKills: number;
}

export class GameManager {
  public canvas: HTMLCanvasElement;
  public renderer!: THREE.WebGLRenderer;
  public scene!: THREE.Scene;
  public camera!: THREE.PerspectiveCamera;

  public arena!: Arena;
  public weapon!: Weapon;
  public particles!: ParticleSystem;
  public player!: PlayerController;
  public enemies: Enemy[] = [];

  // Game state
  public gameState: GameState = 'MENU';
  public playerHealth: number = PLAYER.MAX_HEALTH;
  public score: number = 0;
  public highScore: number = 0;
  public currentWave: number = 1;
  public totalKills: number = 0;
  public timeSurvived: number = 0;

  // Wave manager
  private waveEnemiesToSpawn: number = 0;
  private waveSpawnInterval: number = 2.0;
  private waveSpawnTimer: number = 0;
  private waveIntermissionTimer: number = 0;
  private isWaveInProgress: boolean = false;

  // Visual UI feedback timers
  private hitmarkerTimer: number = 0;
  private hitmarkerIsHeadshot: boolean = false;
  private damageVignetteTimer: number = 0;

  // Shooting & raycasting
  private raycaster = new THREE.Raycaster();
  private shootOrigin = new THREE.Vector2(0, 0); // Center of screen
  private isMouseDown: boolean = false;

  // Render loop & timing
  private frameId: number = 0;
  private isSoftwareGl: boolean = false;

  // External HUD callback
  public onHUDUpdate?: (data: GameHUDData) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.highScore = parseInt(localStorage.getItem('fps_arena_highscore') || '0', 10);

    this.detectSoftwareGl();
    this.initThree();
    this.bindWindowEvents();
    this.startLoop();
  }

  private detectSoftwareGl() {
    try {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) {
        this.isSoftwareGl = true;
        return;
      }
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      this.isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    } catch {
      this.isSoftwareGl = true;
    }
  }

  private initThree() {
    // 1. Renderer setup with physical standards
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2)
    );
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // 2. Scene & Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x161a22);
    this.scene.fog = new THREE.FogExp2(0x161a22, 0.015);

    // 3. Studio Environment Map (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(
      new RoomEnvironment(),
      0.04
    ).texture;
    pmremGenerator.dispose();

    // 4. Perspective Camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      140
    );

    // 5. Lighting Rig (Warm Key + Cool Hemisphere + Perimeter Fill)
    const hemiLight = new THREE.HemisphereLight(0x7799bb, 0x222a36, 1.3);
    this.scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfffaed, 2.6);
    keyLight.position.set(15, 25, 12);
    if (!this.isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 60;
      const d = 24;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    this.scene.add(keyLight);

    // Secondary rim light
    const rimLight = new THREE.DirectionalLight(0x4488bb, 0.7);
    rimLight.position.set(-18, 12, -18);
    this.scene.add(rimLight);

    // 6. Build Arena
    this.arena = new Arena();
    this.scene.add(this.arena.group);

    // 7. Particle System
    this.particles = new ParticleSystem();
    this.scene.add(this.particles.group);

    // 8. Player Controller
    this.player = new PlayerController(this.camera);

    // 9. Weapon Viewmodel
    this.weapon = new Weapon();
    this.camera.add(this.weapon.group);
    this.scene.add(this.camera);
  }

  private bindWindowEvents() {
    window.addEventListener('resize', this.onResize);
    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('keydown', this.onKeyDown);

    document.addEventListener('pointerlockchange', () => {
      const isLocked = document.pointerLockElement === this.canvas;
      this.player.isPointerLocked = isLocked;
    });
  }

  private onResize = () => {
    if (!this.renderer || !this.camera) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  private onMouseDown = (e: MouseEvent) => {
    if (this.gameState !== 'PLAYING') return;

    if (!this.player.isPointerLocked) {
      this.player.requestPointerLock(this.canvas);
    }

    if (e.button === 0) {
      this.isMouseDown = true;
      this.tryShoot();
    }
  };

  private onMouseUp = (e: MouseEvent) => {
    if (e.button === 0) {
      this.isMouseDown = false;
    }
  };

  private onKeyDown = (e: KeyboardEvent) => {
    if (this.gameState === 'PLAYING') {
      if (e.code === 'KeyR') {
        if (this.weapon.reload()) {
          sounds.playReload();
        }
      } else if (e.code === 'Escape') {
        this.pauseGame();
      }
    } else if (this.gameState === 'PAUSED') {
      if (e.code === 'Escape') {
        this.resumeGame();
      }
    }
  };

  // Attempt to fire weapon
  private tryShoot() {
    if (this.gameState !== 'PLAYING') return;

    if (this.weapon.magazineAmmo <= 0) {
      if (this.weapon.fireCooldownTimer <= 0) {
        sounds.playEmpty();
        this.weapon.fireCooldownTimer = 0.25;
      }
      return;
    }

    if (this.weapon.fire()) {
      sounds.playShoot();
      this.player.addRecoil(0.025, 0.008);

      // Perform raycast from camera center
      this.performShootingRaycast();
    }
  }

  private performShootingRaycast() {
    this.raycaster.setFromCamera(this.shootOrigin, this.camera);

    // Gather candidate meshes (enemy body/head parts + arena obstacles)
    const targets: THREE.Object3D[] = [...this.arena.shootableObstacles];
    for (const enemy of this.enemies) {
      if (!enemy.isDead) {
        targets.push(enemy.headMesh, ...enemy.bodyMeshes);
      }
    }

    const intersects = this.raycaster.intersectObjects(targets, true);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const hitPoint = hit.point;

      // Add ballistic tracer line from weapon muzzle to hit position
      this.particles.addTracer(this.weapon.muzzlePoint, hitPoint);

      // Check if target is an enemy part
      let enemyRef: Enemy | null = null;
      let isHeadshot = false;

      let cur: THREE.Object3D | null = hit.object;
      while (cur && !enemyRef) {
        if (cur.userData && cur.userData.enemyRef) {
          enemyRef = cur.userData.enemyRef as Enemy;
          isHeadshot = !!cur.userData.isHead;
        }
        cur = cur.parent;
      }

      if (enemyRef && !enemyRef.isDead) {
        const damage = isHeadshot ? WEAPON.DAMAGE_HEAD : WEAPON.DAMAGE_BODY;
        const killed = enemyRef.takeDamage(damage);

        // Sound & visual feedback
        sounds.playHit(isHeadshot);
        this.particles.emitEnemyHit(hitPoint, isHeadshot);

        // Trigger HUD hitmarker
        this.hitmarkerTimer = 0.15;
        this.hitmarkerIsHeadshot = isHeadshot;

        if (killed) {
          this.totalKills++;
          const earned = SCORES.KILL + (isHeadshot ? SCORES.HEADSHOT_BONUS : 0);
          this.addScore(earned);
          sounds.playEnemyDeath();
          this.particles.emitEnemyDeath(enemyRef.group.position);
          this.checkWaveProgress();
        }
      } else {
        // Concrete / metal obstacle impact sparks
        const normal = hit.face ? hit.face.normal.clone() : new THREE.Vector3(0, 1, 0);
        normal.applyQuaternion(hit.object.quaternion);
        this.particles.emitImpactSparks(hitPoint, normal);
      }
    } else {
      // Empty shot into distance: tracer travels toward far point
      const farPoint = new THREE.Vector3();
      this.raycaster.ray.at(WEAPON.MAX_RANGE, farPoint);
      this.particles.addTracer(this.weapon.muzzlePoint, farPoint);
    }
  }

  // Damage applied to player from enemy attacks
  private damagePlayer(damage: number) {
    if (this.gameState !== 'PLAYING') return;

    this.playerHealth = Math.max(0, this.playerHealth - damage);
    sounds.playPlayerHurt();
    this.player.addDamageImpact(0.12);
    this.damageVignetteTimer = 0.45; // Flash red screen border

    if (this.playerHealth <= 0) {
      this.gameOver();
    }
  }

  private addScore(points: number) {
    this.score += points;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('fps_arena_highscore', this.highScore.toString());
    }
  }

  // Start new game session
  public startGame() {
    this.gameState = 'PLAYING';
    this.playerHealth = PLAYER.MAX_HEALTH;
    this.score = 0;
    this.totalKills = 0;
    this.timeSurvived = 0;
    this.currentWave = 1;

    // Reset player position
    this.player.reset(0, 0);
    this.weapon.reset();

    // Clear existing enemies
    this.clearAllEnemies();
    this.particles.clear();

    // Request pointer lock
    this.player.requestPointerLock(this.canvas);

    // Initialize first wave
    this.startWave(1);
    sounds.playWaveStart();
  }

  public pauseGame() {
    if (this.gameState !== 'PLAYING') return;
    this.gameState = 'PAUSED';
    this.isMouseDown = false;
    this.player.exitPointerLock();
  }

  public resumeGame() {
    if (this.gameState !== 'PAUSED') return;
    this.gameState = 'PLAYING';
    this.player.requestPointerLock(this.canvas);
  }

  public restartGame() {
    this.startGame();
  }

  public goToMainMenu() {
    this.gameState = 'MENU';
    this.isMouseDown = false;
    this.player.exitPointerLock();
    this.clearAllEnemies();
    this.particles.clear();
  }

  private gameOver() {
    this.gameState = 'GAMEOVER';
    this.isMouseDown = false;
    this.player.exitPointerLock();
  }

  // Wave system
  private startWave(waveNum: number) {
    this.currentWave = waveNum;
    this.isWaveInProgress = true;
    this.waveIntermissionTimer = 0;

    // Wave scaling formula:
    // Wave 1: 3 enemies (100 HP)
    // Wave 2: 5 enemies (100 HP)
    // Wave 3: 7 enemies (125 HP)
    // Wave 4+: +2 enemies per wave, HP scaling
    if (waveNum === 1) {
      this.waveEnemiesToSpawn = 3;
      this.waveSpawnInterval = 2.0;
    } else if (waveNum === 2) {
      this.waveEnemiesToSpawn = 5;
      this.waveSpawnInterval = 1.5;
    } else if (waveNum === 3) {
      this.waveEnemiesToSpawn = 7;
      this.waveSpawnInterval = 1.2;
    } else {
      this.waveEnemiesToSpawn = 7 + (waveNum - 3) * 2;
      this.waveSpawnInterval = Math.max(0.8, 1.2 - (waveNum - 3) * 0.1);
    }
    // Spawn initial enemy immediately at wave start
    this.spawnEnemy();
    this.waveSpawnTimer = this.waveSpawnInterval;
  }

  private spawnEnemy() {
    if (this.waveEnemiesToSpawn <= 0) return;

    // Spawn positions: in wave 1, engage player directly in open forward corridors
    let x: number;
    let z: number;
    if (this.currentWave === 1 && this.waveEnemiesToSpawn === 3) {
      x = 3.2;
      z = -7.5;
    } else if (this.currentWave === 1 && this.waveEnemiesToSpawn === 2) {
      x = -3.2;
      z = -8.0;
    } else if (this.currentWave === 1 && this.waveEnemiesToSpawn === 1) {
      x = 0;
      z = -9.0;
    } else {
      const angle = Math.random() * Math.PI * 2;
      const spawnDist = 12 + Math.random() * 3;
      x = Math.cos(angle) * spawnDist;
      z = Math.sin(angle) * spawnDist;
    }

    // Health & speed scaling with wave
    const waveHp = this.currentWave >= 3 ? 100 + (this.currentWave - 2) * 20 : 100;
    const waveSpeedMult = 1.0 + Math.min(0.5, (this.currentWave - 1) * 0.08);

    const enemy = new Enemy(x, z, waveHp, waveSpeedMult);
    this.enemies.push(enemy);
    this.scene.add(enemy.group);

    this.waveEnemiesToSpawn--;
  }

  private checkWaveProgress() {
    const aliveCount = this.enemies.filter((e) => !e.isDead).length;
    if (this.waveEnemiesToSpawn === 0 && aliveCount === 0 && this.isWaveInProgress) {
      // Wave complete!
      this.isWaveInProgress = false;
      this.addScore(SCORES.WAVE_BONUS);
      sounds.playWaveComplete();
      this.waveIntermissionTimer = 3.5; // 3.5s intermission before next wave
    }
  }

  private clearAllEnemies() {
    for (const enemy of this.enemies) {
      this.scene.remove(enemy.group);
      enemy.dispose();
    }
    this.enemies = [];
    this.waveEnemiesToSpawn = 0;
    this.isWaveInProgress = false;
  }

  // Continuous 60 FPS Game Loop
  private startLoop() {
    let lastTime = performance.now();
    const tick = () => {
      const now = performance.now();
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(Math.max(rawDt, 0.001), 0.05);

      this.update(dt);
      this.render();

      this.frameId = requestAnimationFrame(tick);
    };

    this.frameId = requestAnimationFrame(tick);
  }

  private update(dt: number) {
    // 1. Menu State: Dramatic live camera pan around arena
    if (this.gameState === 'MENU') {
      const time = performance.now() * 0.0003;
      const camR = 10;
      this.camera.position.set(
        Math.cos(time) * camR,
        2.5 + Math.sin(time * 0.4) * 0.6,
        Math.sin(time) * camR
      );
      this.camera.lookAt(0, 1.2, 0);
      this.weapon.group.visible = false;
      this.particles.update(dt);
      this.sendHUDUpdate();
      return;
    }

    this.weapon.group.visible = true;

    // 2. Paused / Game Over state
    if (this.gameState === 'PAUSED' || this.gameState === 'GAMEOVER') {
      this.sendHUDUpdate();
      return;
    }

    // 3. Gameplay Active
    this.timeSurvived += dt;

    // Automatic fire while holding mouse button
    if (this.isMouseDown && !this.weapon.isReloading) {
      this.tryShoot();
    }

    // Update Player & Camera
    this.player.update(dt, this.arena);

    // Update Weapon viewmodel
    this.weapon.update(dt, this.player.isMoving, this.player.isSprinting);

    // Wave Spawning
    if (this.isWaveInProgress && this.waveEnemiesToSpawn > 0) {
      this.waveSpawnTimer -= dt;
      if (this.waveSpawnTimer <= 0) {
        this.spawnEnemy();
        this.waveSpawnTimer = this.waveSpawnInterval;
      }
    }

    // Wave Intermission countdown
    if (!this.isWaveInProgress && this.waveIntermissionTimer > 0) {
      this.waveIntermissionTimer -= dt;
      if (this.waveIntermissionTimer <= 0) {
        this.startWave(this.currentWave + 1);
        sounds.playWaveStart();
      }
    }

    // Update Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update(
        dt,
        this.player.position,
        this.arena,
        this.camera,
        (damage) => this.damagePlayer(damage)
      );

      // Clean up dead enemy after death animation completes
      if (enemy.isDead && enemy.deathTimer > 1.2) {
        this.scene.remove(enemy.group);
        enemy.dispose();
        this.enemies.splice(i, 1);
        this.checkWaveProgress();
      }
    }

    // Update Particles
    this.particles.update(dt);

    // Update UI Timers
    if (this.hitmarkerTimer > 0) {
      this.hitmarkerTimer -= dt;
    }
    if (this.damageVignetteTimer > 0) {
      this.damageVignetteTimer -= dt;
    }

    // Push HUD updates
    this.sendHUDUpdate();
  }

  private render() {
    this.renderer.render(this.scene, this.camera);
  }

  private sendHUDUpdate() {
    if (!this.onHUDUpdate) return;

    const aliveEnemies = this.enemies.filter((e) => !e.isDead).length + this.waveEnemiesToSpawn;

    this.onHUDUpdate({
      gameState: this.gameState,
      health: this.playerHealth,
      maxHealth: PLAYER.MAX_HEALTH,
      magazineAmmo: this.weapon.magazineAmmo,
      reserveAmmo: this.weapon.reserveAmmo,
      isReloading: this.weapon.isReloading,
      score: this.score,
      highScore: this.highScore,
      wave: this.currentWave,
      enemiesRemaining: aliveEnemies,
      waveIntermission: Math.max(0, this.waveIntermissionTimer),
      hitmarker: {
        visible: this.hitmarkerTimer > 0,
        isHeadshot: this.hitmarkerIsHeadshot,
      },
      damageVignette: this.damageVignetteTimer > 0,
      timeSurvived: this.timeSurvived,
      totalKills: this.totalKills,
    });
  }

  public destroy() {
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('keydown', this.onKeyDown);
    this.player.unbindEvents();
    this.clearAllEnemies();
    this.renderer.dispose();
  }
}
