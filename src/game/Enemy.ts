import * as THREE from 'three';
import { ENEMY } from './constants';
import { Arena } from './Arena';

export class Enemy {
  public group: THREE.Group;
  public headMesh!: THREE.Mesh;
  public bodyMeshes: THREE.Mesh[] = [];

  public health: number;
  public maxHealth: number;
  public speed: number;
  public isDead: boolean = false;
  public deathTimer: number = 0;
  public attackCooldown: number = 0;

  // Animation nodes
  private leftArmPivot!: THREE.Group;
  private rightArmPivot!: THREE.Group;
  private leftLegPivot!: THREE.Group;
  private rightLegPivot!: THREE.Group;
  private torsoMesh!: THREE.Mesh;
  private visorMesh!: THREE.Mesh;

  // Flash on hit
  private hitFlashTimer: number = 0;
  private materialsList: THREE.MeshStandardMaterial[] = [];

  // Health bar billboard
  private healthBarMesh!: THREE.Mesh;
  private healthBarMat!: THREE.MeshBasicMaterial;

  // Animation states
  private walkCycle: number = Math.random() * Math.PI * 2;
  private attackAnimProgress: number = 0;

  constructor(x: number, z: number, maxHealth: number = ENEMY.BASE_HP, speedMultiplier: number = 1.0) {
    this.maxHealth = maxHealth;
    this.health = maxHealth;
    this.speed = ENEMY.SPEED * speedMultiplier;

    this.group = new THREE.Group();
    this.group.position.set(x, 0, z);
    this.group.name = 'Enemy';

    this.buildHumanoidModel();
    this.buildHealthBar();
  }

  private buildHumanoidModel() {
    const armorMat = new THREE.MeshStandardMaterial({
      color: 0x22262e,
      roughness: 0.65,
      metalness: 0.35,
    });
    this.materialsList.push(armorMat);

    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x14171c,
      roughness: 0.8,
      metalness: 0.1,
    });
    this.materialsList.push(darkMat);

    const redAccentMat = new THREE.MeshStandardMaterial({
      color: 0xcc2222,
      emissive: 0x880000,
      emissiveIntensity: 0.6,
      roughness: 0.4,
      metalness: 0.5,
    });
    this.materialsList.push(redAccentMat);

    // 1. Torso
    const torsoGeo = new THREE.BoxGeometry(0.5, 0.65, 0.3);
    this.torsoMesh = new THREE.Mesh(torsoGeo, armorMat);
    this.torsoMesh.position.y = 1.15;
    this.torsoMesh.castShadow = true;
    this.group.add(this.torsoMesh);
    this.bodyMeshes.push(this.torsoMesh);

    // Chest armor plate with red stripe
    const plateGeo = new THREE.BoxGeometry(0.42, 0.45, 0.08);
    const plate = new THREE.Mesh(plateGeo, redAccentMat);
    plate.position.set(0, 0.05, 0.16);
    this.torsoMesh.add(plate);
    this.bodyMeshes.push(plate);

    // 2. Head (Separate mesh and distinct tag for headshot detection)
    const headGeo = new THREE.BoxGeometry(0.32, 0.34, 0.32);
    this.headMesh = new THREE.Mesh(headGeo, armorMat);
    this.headMesh.position.set(0, 1.68, 0);
    this.headMesh.castShadow = true;
    this.headMesh.userData = { isHead: true, enemyRef: this };
    this.group.add(this.headMesh);

    // Glowing red combat visor
    const visorGeo = new THREE.BoxGeometry(0.26, 0.08, 0.06);
    this.visorMesh = new THREE.Mesh(visorGeo, redAccentMat);
    this.visorMesh.position.set(0, 0.04, 0.16);
    this.headMesh.add(this.visorMesh);

    // 3. Left Arm
    this.leftArmPivot = new THREE.Group();
    this.leftArmPivot.position.set(-0.35, 1.4, 0);
    const leftArmGeo = new THREE.BoxGeometry(0.16, 0.6, 0.16);
    const leftArm = new THREE.Mesh(leftArmGeo, darkMat);
    leftArm.position.y = -0.28;
    leftArm.castShadow = true;
    this.leftArmPivot.add(leftArm);
    this.group.add(this.leftArmPivot);
    this.bodyMeshes.push(leftArm);

    // 4. Right Arm
    this.rightArmPivot = new THREE.Group();
    this.rightArmPivot.position.set(0.35, 1.4, 0);
    const rightArmGeo = new THREE.BoxGeometry(0.16, 0.6, 0.16);
    const rightArm = new THREE.Mesh(rightArmGeo, darkMat);
    rightArm.position.y = -0.28;
    rightArm.castShadow = true;
    this.rightArmPivot.add(rightArm);
    this.group.add(this.rightArmPivot);
    this.bodyMeshes.push(rightArm);

    // 5. Left Leg
    this.leftLegPivot = new THREE.Group();
    this.leftLegPivot.position.set(-0.16, 0.8, 0);
    const leftLegGeo = new THREE.BoxGeometry(0.18, 0.8, 0.2);
    const leftLeg = new THREE.Mesh(leftLegGeo, darkMat);
    leftLeg.position.y = -0.4;
    leftLeg.castShadow = true;
    this.leftLegPivot.add(leftLeg);
    this.group.add(this.leftLegPivot);
    this.bodyMeshes.push(leftLeg);

    // 6. Right Leg
    this.rightLegPivot = new THREE.Group();
    this.rightLegPivot.position.set(0.16, 0.8, 0);
    const rightLegGeo = new THREE.BoxGeometry(0.18, 0.8, 0.2);
    const rightLeg = new THREE.Mesh(rightLegGeo, darkMat);
    rightLeg.position.y = -0.4;
    rightLeg.castShadow = true;
    this.rightLegPivot.add(rightLeg);
    this.group.add(this.rightLegPivot);
    this.bodyMeshes.push(rightLeg);

    // Tag body meshes with reference for raycasting
    this.bodyMeshes.forEach((mesh) => {
      mesh.userData = { isBody: true, enemyRef: this };
    });
  }

  private buildHealthBar() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 8;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ff2222';
    ctx.fillRect(0, 0, 64, 8);

    const texture = new THREE.CanvasTexture(canvas);
    this.healthBarMat = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
      depthTest: false,
    });

    const geo = new THREE.PlaneGeometry(0.7, 0.08);
    this.healthBarMesh = new THREE.Mesh(geo, this.healthBarMat);
    this.healthBarMesh.position.set(0, 2.05, 0);
    this.group.add(this.healthBarMesh);
  }

  public updateHealthBar() {
    const ratio = Math.max(0, this.health / this.maxHealth);
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 8;
    const ctx = canvas.getContext('2d')!;

    // Background dark red
    ctx.fillStyle = '#440000';
    ctx.fillRect(0, 0, 64, 8);

    // Foreground health color
    ctx.fillStyle = ratio > 0.5 ? '#22cc44' : ratio > 0.25 ? '#eebb22' : '#ee2222';
    ctx.fillRect(0, 0, Math.floor(64 * ratio), 8);

    if (this.healthBarMat.map) {
      this.healthBarMat.map.dispose();
    }
    this.healthBarMat.map = new THREE.CanvasTexture(canvas);
    this.healthBarMat.map.needsUpdate = true;
  }

  // Receive damage: returns true if killed
  public takeDamage(amount: number): boolean {
    if (this.isDead) return false;

    this.health -= amount;
    this.hitFlashTimer = 0.12; // Flash red/white
    this.updateHealthBar();

    if (this.health <= 0) {
      this.health = 0;
      this.isDead = true;
      this.deathTimer = 0;
      this.healthBarMesh.visible = false;
      return true;
    }
    return false;
  }

  // Update AI movement, attacks, animations, and collisions
  public update(
    dt: number,
    playerPos: THREE.Vector3,
    arena: Arena,
    camera: THREE.Camera,
    onPlayerAttacked: (damage: number) => void
  ) {
    // Face healthbar toward camera
    if (this.healthBarMesh.visible) {
      this.healthBarMesh.quaternion.copy(camera.quaternion);
    }

    // Flash decay
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
      const flashColor = this.hitFlashTimer > 0 ? 0xff4444 : 0x22262e;
      (this.torsoMesh.material as THREE.MeshStandardMaterial).color.setHex(flashColor);
    }

    // Dead animation
    if (this.isDead) {
      this.deathTimer += dt;
      // Fall backward and sink slightly
      if (this.group.rotation.x > -Math.PI / 2) {
        this.group.rotation.x = Math.max(-Math.PI / 2, this.group.rotation.x - dt * 4.5);
        this.group.position.y = Math.max(0.1, this.group.position.y - dt * 0.8);
      }
      return;
    }

    // Attack cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt;
    }

    // Vector to player
    const dx = playerPos.x - this.group.position.x;
    const dz = playerPos.z - this.group.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    // Rotate to face player smoothly
    const targetAngle = Math.atan2(dx, dz);
    this.group.rotation.y = THREE.MathUtils.damp(
      this.group.rotation.y,
      targetAngle,
      8,
      dt
    );

    // AI Decision: Move or Attack
    if (dist > ENEMY.ATTACK_RANGE) {
      // Approach player
      const dirX = dx / dist;
      const dirZ = dz / dist;

      let nextX = this.group.position.x + dirX * this.speed * dt;
      let nextZ = this.group.position.z + dirZ * this.speed * dt;

      // Arena & obstacle collision
      const col = arena.checkCircleCollision(nextX, nextZ, ENEMY.BODY_RADIUS);
      if (col.collided) {
        nextX += col.pushX;
        nextZ += col.pushZ;
      }

      this.group.position.x = nextX;
      this.group.position.z = nextZ;

      // Animate walking limbs
      this.walkCycle += dt * (this.speed * 2.5);
      const legSwing = Math.sin(this.walkCycle) * 0.6;
      const armSwing = Math.sin(this.walkCycle) * 0.5;

      this.leftLegPivot.rotation.x = legSwing;
      this.rightLegPivot.rotation.x = -legSwing;
      this.leftArmPivot.rotation.x = -armSwing;
      this.rightArmPivot.rotation.x = armSwing;
      this.torsoMesh.position.y = 1.15 + Math.abs(Math.sin(this.walkCycle * 2)) * 0.04;
    } else {
      // In attack range: perform attack
      if (this.attackCooldown <= 0) {
        this.attackCooldown = ENEMY.ATTACK_COOLDOWN;
        this.attackAnimProgress = 1.0;
        onPlayerAttacked(ENEMY.CONTACT_DAMAGE);
      }
    }

    // Attack swing animation
    if (this.attackAnimProgress > 0) {
      this.attackAnimProgress -= dt * 3.5;
      const swing = Math.sin(this.attackAnimProgress * Math.PI) * 1.2;
      this.rightArmPivot.rotation.x = -swing;
      this.leftArmPivot.rotation.x = -swing * 0.8;
    }
  }

  public dispose() {
    this.materialsList.forEach((m) => m.dispose());
    if (this.healthBarMat.map) this.healthBarMat.map.dispose();
    this.healthBarMat.dispose();
  }
}
