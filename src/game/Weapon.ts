import * as THREE from 'three';
import { WEAPON } from './constants';
import { createGlowTexture } from './textures';

export class Weapon {
  public group: THREE.Group;
  public muzzlePoint: THREE.Vector3 = new THREE.Vector3();

  // Ammunition state
  public magazineAmmo: number = WEAPON.START_AMMO;
  public reserveAmmo: number = WEAPON.START_RESERVE;
  public isReloading: boolean = false;
  public reloadProgress: number = 0; // 0 to 1
  public fireCooldownTimer: number = 0;

  // Visual sub-parts
  private gunMeshGroup: THREE.Group;
  private muzzleFlashGroup: THREE.Group;
  private muzzleFlashLight: THREE.PointLight;
  private muzzleFlashTimer: number = 0;
  private magazinePart: THREE.Mesh;

  // Weapon offsets & animations
  private defaultPos = new THREE.Vector3(0.28, -0.25, -0.48);
  private defaultRot = new THREE.Euler(0.04, -0.05, 0);

  private currentRecoilZ: number = 0;
  private currentRecoilRotX: number = 0;
  private swayX: number = 0;
  private swayY: number = 0;
  private walkBobTime: number = 0;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'WeaponViewmodel';

    this.gunMeshGroup = new THREE.Group();
    this.group.add(this.gunMeshGroup);

    // Initial position in bottom-right corner of viewport
    this.gunMeshGroup.position.copy(this.defaultPos);
    this.gunMeshGroup.rotation.copy(this.defaultRot);

    // Build the assault rifle 3D model
    const { magPart } = this.buildAssaultRifle();
    this.magazinePart = magPart;

    // Build muzzle flash
    const { flashGroup, flashLight } = this.buildMuzzleFlash();
    this.muzzleFlashGroup = flashGroup;
    this.muzzleFlashLight = flashLight;
    this.gunMeshGroup.add(this.muzzleFlashGroup);
  }

  private buildAssaultRifle(): { magPart: THREE.Mesh } {
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x1b1e22,
      roughness: 0.35,
      metalness: 0.85,
    });
    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x111316,
      roughness: 0.65,
      metalness: 0.3,
    });
    const accentMat = new THREE.MeshStandardMaterial({
      color: 0x2d323a,
      roughness: 0.45,
      metalness: 0.6,
    });

    // 1. Receiver / Main Body
    const receiverGeo = new THREE.BoxGeometry(0.055, 0.085, 0.38);
    const receiver = new THREE.Mesh(receiverGeo, metalMat);
    receiver.position.set(0, 0, 0);
    this.gunMeshGroup.add(receiver);

    // 2. Handguard / Barrel Shroud
    const handguardGeo = new THREE.BoxGeometry(0.052, 0.065, 0.28);
    const handguard = new THREE.Mesh(handguardGeo, darkMat);
    handguard.position.set(0, 0.005, -0.3);
    this.gunMeshGroup.add(handguard);

    // 3. Barrel & Muzzle Brake
    const barrelGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.32, 10);
    const barrel = new THREE.Mesh(barrelGeo, metalMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.015, -0.5);
    this.gunMeshGroup.add(barrel);

    const muzzleBrakeGeo = new THREE.CylinderGeometry(0.019, 0.019, 0.06, 10);
    const muzzleBrake = new THREE.Mesh(muzzleBrakeGeo, accentMat);
    muzzleBrake.rotation.x = Math.PI / 2;
    muzzleBrake.position.set(0, 0.015, -0.68);
    this.gunMeshGroup.add(muzzleBrake);

    // 4. Magazine (curved tactical assault rifle mag)
    const magGeo = new THREE.BoxGeometry(0.04, 0.18, 0.08);
    const magMesh = new THREE.Mesh(magGeo, darkMat);
    magMesh.position.set(0, -0.11, -0.06);
    magMesh.rotation.x = 0.2;
    this.gunMeshGroup.add(magMesh);

    // 5. Pistol Grip
    const gripGeo = new THREE.BoxGeometry(0.042, 0.15, 0.065);
    const grip = new THREE.Mesh(gripGeo, darkMat);
    grip.position.set(0, -0.1, 0.12);
    grip.rotation.x = -0.4;
    this.gunMeshGroup.add(grip);

    // 6. Tactical Stock
    const stockStrutGeo = new THREE.BoxGeometry(0.035, 0.04, 0.22);
    const stockStrut = new THREE.Mesh(stockStrutGeo, accentMat);
    stockStrut.position.set(0, 0.01, 0.28);
    this.gunMeshGroup.add(stockStrut);

    const stockPadGeo = new THREE.BoxGeometry(0.045, 0.13, 0.035);
    const stockPad = new THREE.Mesh(stockPadGeo, darkMat);
    stockPad.position.set(0, -0.03, 0.39);
    this.gunMeshGroup.add(stockPad);

    // 7. Iron Sights
    // Front post
    const frontSightGeo = new THREE.BoxGeometry(0.008, 0.025, 0.015);
    const frontSight = new THREE.Mesh(frontSightGeo, metalMat);
    frontSight.position.set(0, 0.055, -0.42);
    this.gunMeshGroup.add(frontSight);

    // Rear sight notch
    const rearSightBaseGeo = new THREE.BoxGeometry(0.032, 0.02, 0.02);
    const rearSight = new THREE.Mesh(rearSightBaseGeo, metalMat);
    rearSight.position.set(0, 0.055, 0.08);
    this.gunMeshGroup.add(rearSight);

    // Top Picatinny Rail
    const railGeo = new THREE.BoxGeometry(0.03, 0.012, 0.34);
    const rail = new THREE.Mesh(railGeo, accentMat);
    rail.position.set(0, 0.048, -0.08);
    this.gunMeshGroup.add(rail);

    return { magPart: magMesh };
  }

  private buildMuzzleFlash(): { flashGroup: THREE.Group; flashLight: THREE.PointLight } {
    const flashGroup = new THREE.Group();
    flashGroup.position.set(0, 0.015, -0.74);

    const glowTex = createGlowTexture();
    const flashMat = new THREE.MeshBasicMaterial({
      map: glowTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    // Cross star planes for volumetric flash look
    const p1 = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.24), flashMat);
    const p2 = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.24), flashMat);
    p2.rotation.z = Math.PI / 4;
    const p3 = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.24), flashMat);
    p3.rotation.y = Math.PI / 2;

    flashGroup.add(p1, p2, p3);

    const flashLight = new THREE.PointLight(0xffaa44, 0, 8, 2);
    flashGroup.add(flashLight);

    flashGroup.visible = false;
    return { flashGroup, flashLight };
  }

  // Trigger fire effects and recoil
  public fire(): boolean {
    if (this.isReloading) return false;
    if (this.magazineAmmo <= 0) return false;
    if (this.fireCooldownTimer > 0) return false;

    // Deduct ammo
    this.magazineAmmo--;
    this.fireCooldownTimer = WEAPON.FIRE_INTERVAL;

    // Recoil impulse
    this.currentRecoilZ = WEAPON.RECOIL_KICK;
    this.currentRecoilRotX = 0.08;

    // Muzzle flash on
    this.muzzleFlashGroup.visible = true;
    this.muzzleFlashLight.intensity = 5;
    this.muzzleFlashTimer = 0.045; // brief flash

    return true;
  }

  // Start reload sequence
  public reload(): boolean {
    if (this.isReloading) return false;
    if (this.magazineAmmo >= WEAPON.MAGAZINE_SIZE) return false;
    if (this.reserveAmmo <= 0) return false;

    this.isReloading = true;
    this.reloadProgress = 0;
    return true;
  }

  // Apply mouse sway for tactile weapon responsiveness
  public applyMouseSway(mouseDeltaX: number, mouseDeltaY: number) {
    this.swayX = THREE.MathUtils.clamp(this.swayX - mouseDeltaX * 0.0006, -0.04, 0.04);
    this.swayY = THREE.MathUtils.clamp(this.swayY - mouseDeltaY * 0.0006, -0.04, 0.04);
  }

  // Update weapon timers, animations, reload, and bobbing
  public update(dt: number, isMoving: boolean, isSprinting: boolean) {
    // 1. Cooldown timers
    if (this.fireCooldownTimer > 0) {
      this.fireCooldownTimer -= dt;
    }

    // 2. Muzzle flash timer
    if (this.muzzleFlashTimer > 0) {
      this.muzzleFlashTimer -= dt;
      if (this.muzzleFlashTimer <= 0) {
        this.muzzleFlashGroup.visible = false;
        this.muzzleFlashLight.intensity = 0;
      }
    }

    // 3. Reload progression
    if (this.isReloading) {
      this.reloadProgress += dt / WEAPON.RELOAD_DURATION;

      // Animate magazine removal and insertion
      if (this.reloadProgress < 0.5) {
        // Magazine drops down
        const magDrop = Math.sin(this.reloadProgress * Math.PI * 2) * 0.12;
        this.magazinePart.position.y = -0.11 - magDrop;
      } else {
        // New magazine snaps in
        const magSnap = Math.sin((this.reloadProgress - 0.5) * Math.PI * 2) * 0.05;
        this.magazinePart.position.y = -0.11 - magSnap;
      }

      if (this.reloadProgress >= 1.0) {
        // Reload complete: transfer ammo
        const needed = WEAPON.MAGAZINE_SIZE - this.magazineAmmo;
        const transfer = Math.min(needed, this.reserveAmmo);
        this.magazineAmmo += transfer;
        this.reserveAmmo -= transfer;
        this.isReloading = false;
        this.reloadProgress = 0;
        this.magazinePart.position.y = -0.11;
      }
    }

    // 4. Spring recoil recovery
    this.currentRecoilZ = THREE.MathUtils.damp(this.currentRecoilZ, 0, WEAPON.RECOIL_RECOVERY, dt);
    this.currentRecoilRotX = THREE.MathUtils.damp(
      this.currentRecoilRotX,
      0,
      WEAPON.RECOIL_RECOVERY,
      dt
    );

    // 5. Mouse sway decay
    this.swayX = THREE.MathUtils.damp(this.swayX, 0, 10, dt);
    this.swayY = THREE.MathUtils.damp(this.swayY, 0, 10, dt);

    // 6. Walking bobbing
    if (isMoving) {
      const bobFreq = isSprinting ? 12 : 8;
      this.walkBobTime += dt * bobFreq;
    } else {
      this.walkBobTime = THREE.MathUtils.damp(this.walkBobTime, 0, 4, dt);
    }

    const bobX = Math.cos(this.walkBobTime) * 0.008;
    const bobY = Math.abs(Math.sin(this.walkBobTime)) * 0.008;

    // Reload tilt angle
    let reloadRotX = 0;
    let reloadRotZ = 0;
    let reloadPosY = 0;
    if (this.isReloading) {
      // Gun dips down and tilts to the left during reload
      const phase = Math.sin(this.reloadProgress * Math.PI);
      reloadRotX = -0.45 * phase;
      reloadRotZ = 0.3 * phase;
      reloadPosY = -0.12 * phase;
    }

    // Apply combined transform to gun group
    this.gunMeshGroup.position.x = this.defaultPos.x + this.swayX + bobX;
    this.gunMeshGroup.position.y =
      this.defaultPos.y + this.swayY - bobY + reloadPosY;
    this.gunMeshGroup.position.z = this.defaultPos.z + this.currentRecoilZ;

    this.gunMeshGroup.rotation.x =
      this.defaultRot.x + this.currentRecoilRotX + reloadRotX - this.swayY;
    this.gunMeshGroup.rotation.y = this.defaultRot.y + this.swayX;
    this.gunMeshGroup.rotation.z = this.defaultRot.z + reloadRotZ + bobX * 1.5;

    // Compute world muzzle point for tracer effects
    this.muzzleFlashGroup.getWorldPosition(this.muzzlePoint);
  }

  // Reset weapon state upon restart
  public reset() {
    this.magazineAmmo = WEAPON.START_AMMO;
    this.reserveAmmo = WEAPON.START_RESERVE;
    this.isReloading = false;
    this.reloadProgress = 0;
    this.fireCooldownTimer = 0;
    this.currentRecoilZ = 0;
    this.currentRecoilRotX = 0;
    this.swayX = 0;
    this.swayY = 0;
    this.walkBobTime = 0;
    this.muzzleFlashGroup.visible = false;
    this.muzzleFlashLight.intensity = 0;
    this.magazinePart.position.y = -0.11;
  }
}
