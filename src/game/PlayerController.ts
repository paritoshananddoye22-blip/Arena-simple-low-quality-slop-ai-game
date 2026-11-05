import * as THREE from 'three';
import { PLAYER } from './constants';
import { Arena } from './Arena';

export class PlayerController {
  public camera: THREE.PerspectiveCamera;
  public position: THREE.Vector3 = new THREE.Vector3(0, PLAYER.EYE_HEIGHT, 0);
  public velocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

  // Rotation angles
  public yaw: number = 0;
  public pitch: number = 0;

  // Mouse look settings
  public mouseSensitivity: number = 0.0022;

  // State flags
  public isGrounded: boolean = true;
  public isMoving: boolean = false;
  public isSprinting: boolean = false;

  // Camera effects
  private headBobTime: number = 0;
  private cameraRecoilPitch: number = 0;
  private cameraRecoilYaw: number = 0;
  private damageShakeTime: number = 0;
  private damageShakeIntensity: number = 0;

  // Input states
  private keys: { [key: string]: boolean } = {};
  public isPointerLocked: boolean = false;

  // Reusable vectors to avoid GC in animation loop
  private moveDir = new THREE.Vector3();
  private forward = new THREE.Vector3();
  private right = new THREE.Vector3();

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.camera.rotation.order = 'YXZ';

    this.bindEvents();
    this.reset(0, 0);
  }

  private bindEvents() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('blur', this.onBlur);
  }

  public unbindEvents() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('blur', this.onBlur);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    this.keys[e.code] = true;
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
  };

  private onMouseMove = (e: MouseEvent) => {
    if (!this.isPointerLocked) return;

    // Guard against pointer lock initial transition spikes
    const deltaX = Math.max(-50, Math.min(50, e.movementX));
    const deltaY = Math.max(-50, Math.min(50, e.movementY));

    this.yaw -= deltaX * this.mouseSensitivity;
    this.pitch -= deltaY * this.mouseSensitivity;

    // Clamp pitch to prevent unnatural flipping (-82 deg to +82 deg)
    const maxPitch = 1.42;
    this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
  };

  private onBlur = () => {
    // Clear held keys on blur to prevent sticking keys
    this.keys = {};
  };

  public requestPointerLock(domElement: HTMLElement) {
    if (document.pointerLockElement !== domElement) {
      domElement.requestPointerLock().catch(() => {});
    }
  }

  public exitPointerLock() {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  // Camera recoil impulse when firing
  public addRecoil(pitchAmount: number = 0.018, yawAmount: number = 0.005) {
    this.cameraRecoilPitch = Math.min(0.06, this.cameraRecoilPitch + pitchAmount);
    this.cameraRecoilYaw += (Math.random() - 0.5) * yawAmount * 2;
  }

  // Camera shake when player receives damage
  public addDamageImpact(intensity: number = 0.08) {
    this.damageShakeIntensity = intensity;
    this.damageShakeTime = 0.3; // 300ms decaying shake
  }

  // Check if a key was just pressed
  public isKeyPressed(code: string): boolean {
    return !!this.keys[code];
  }

  public update(dt: number, arena: Arena) {
    // 1. Determine movement input
    let moveForward = 0;
    let moveRight = 0;

    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveForward += 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveForward -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveRight += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveRight -= 1;

    this.isSprinting = !!(this.keys['ShiftLeft'] || this.keys['ShiftRight']) && moveForward > 0;
    const currentSpeed = this.isSprinting ? PLAYER.SPRINT_SPEED : PLAYER.WALK_SPEED;

    this.isMoving = moveForward !== 0 || moveRight !== 0;

    // 2. Compute movement vector relative to yaw
    this.moveDir.set(0, 0, 0);

    if (this.isMoving) {
      this.forward.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
      this.right.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

      this.moveDir
        .addScaledVector(this.forward, moveForward)
        .addScaledVector(this.right, moveRight)
        .normalize()
        .multiplyScalar(currentSpeed);
    }

    // 3. Smooth horizontal velocity acceleration/deceleration
    const accelRate = this.isGrounded ? 18.0 : 6.0;
    this.velocity.x = THREE.MathUtils.damp(this.velocity.x, this.moveDir.x, accelRate, dt);
    this.velocity.z = THREE.MathUtils.damp(this.velocity.z, this.moveDir.z, accelRate, dt);

    // 4. Jumping & Gravity
    if (this.isGrounded) {
      if (this.keys['Space']) {
        this.velocity.y = PLAYER.JUMP_FORCE;
        this.isGrounded = false;
      }
    } else {
      this.velocity.y -= PLAYER.GRAVITY * dt;
    }

    // 5. Integrate positions
    let nextX = this.position.x + this.velocity.x * dt;
    let nextY = this.position.y + this.velocity.y * dt;
    let nextZ = this.position.z + this.velocity.z * dt;

    // Ground collision
    if (nextY <= PLAYER.EYE_HEIGHT) {
      nextY = PLAYER.EYE_HEIGHT;
      this.velocity.y = 0;
      this.isGrounded = true;
    }

    // Arena walls and obstacles collision
    const col = arena.checkCircleCollision(nextX, nextZ, PLAYER.RADIUS);
    if (col.collided) {
      nextX += col.pushX;
      nextZ += col.pushZ;
    }

    this.position.set(nextX, nextY, nextZ);

    // 6. Camera bobbing
    if (this.isMoving && this.isGrounded) {
      const bobFreq = this.isSprinting ? 14 : 9;
      this.headBobTime += dt * bobFreq;
    } else {
      this.headBobTime = THREE.MathUtils.damp(this.headBobTime, 0, 4, dt);
    }
    const bobOffset = Math.sin(this.headBobTime) * 0.045;
    const swayOffset = Math.cos(this.headBobTime * 0.5) * 0.025;

    // 7. Recoil and damage shake decay
    this.cameraRecoilPitch = THREE.MathUtils.damp(this.cameraRecoilPitch, 0, 18, dt);
    this.cameraRecoilYaw = THREE.MathUtils.damp(this.cameraRecoilYaw, 0, 18, dt);

    let shakeX = 0;
    let shakeY = 0;
    if (this.damageShakeTime > 0) {
      this.damageShakeTime -= dt;
      const progress = this.damageShakeTime / 0.3;
      shakeX = (Math.random() - 0.5) * this.damageShakeIntensity * progress;
      shakeY = (Math.random() - 0.5) * this.damageShakeIntensity * progress;
    }

    // 8. Apply final camera transformation
    this.camera.position.set(
      this.position.x + swayOffset,
      this.position.y + bobOffset,
      this.position.z
    );

    this.camera.rotation.set(
      this.pitch + this.cameraRecoilPitch + shakeY,
      this.yaw + this.cameraRecoilYaw + shakeX,
      0
    );
  }

  public reset(x: number = 0, z: number = 0) {
    this.position.set(x, PLAYER.EYE_HEIGHT, z);
    this.velocity.set(0, 0, 0);
    this.yaw = 0;
    this.pitch = 0;
    this.isGrounded = true;
    this.isMoving = false;
    this.isSprinting = false;
    this.headBobTime = 0;
    this.cameraRecoilPitch = 0;
    this.cameraRecoilYaw = 0;
    this.damageShakeTime = 0;
    this.damageShakeIntensity = 0;
    this.keys = {};
  }
}
