import * as THREE from 'three';

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  size: number;
  life: number;
  maxLife: number;
}

interface Tracer {
  line: THREE.Line;
  life: number;
  maxLife: number;
}

export class ParticleSystem {
  public group: THREE.Group;
  private particles: Particle[] = [];
  private tracers: Tracer[] = [];

  // Instanced or points rendering
  private pointsMesh: THREE.Points;
  private pointsGeo: THREE.BufferGeometry;
  private maxParticles = 600;

  private positionsArray: Float32Array;
  private colorsArray: Float32Array;
  private sizesArray: Float32Array;

  private tracerMaterial: THREE.LineBasicMaterial;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'ParticleSystem';

    this.positionsArray = new Float32Array(this.maxParticles * 3);
    this.colorsArray = new Float32Array(this.maxParticles * 3);
    this.sizesArray = new Float32Array(this.maxParticles);

    this.pointsGeo = new THREE.BufferGeometry();
    this.pointsGeo.setAttribute(
      'position',
      new THREE.BufferAttribute(this.positionsArray, 3)
    );
    this.pointsGeo.setAttribute(
      'color',
      new THREE.BufferAttribute(this.colorsArray, 3)
    );
    this.pointsGeo.setAttribute(
      'size',
      new THREE.BufferAttribute(this.sizesArray, 1)
    );

    // Procedural soft round particle texture
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.7)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);

    const pointTexture = new THREE.CanvasTexture(canvas);

    const pointsMat = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      map: pointTexture,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.pointsMesh = new THREE.Points(this.pointsGeo, pointsMat);
    this.pointsMesh.frustumCulled = false;
    this.group.add(this.pointsMesh);

    this.tracerMaterial = new THREE.LineBasicMaterial({
      color: 0xffdd88,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
  }

  // Bullet hit on concrete/obstacle
  public emitImpactSparks(pos: THREE.Vector3, normal: THREE.Vector3) {
    const count = 12;
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;

      const spread = 0.8;
      const vel = new THREE.Vector3(
        normal.x + (Math.random() - 0.5) * spread,
        normal.y + Math.random() * spread + 0.2,
        normal.z + (Math.random() - 0.5) * spread
      )
        .normalize()
        .multiplyScalar(2.0 + Math.random() * 3.5);

      this.particles.push({
        position: pos.clone().addScaledVector(normal, 0.05),
        velocity: vel,
        color: new THREE.Color().setHSL(0.1 + Math.random() * 0.05, 0.9, 0.65),
        size: 0.12 + Math.random() * 0.1,
        life: 0,
        maxLife: 0.2 + Math.random() * 0.25,
      });
    }
  }

  // Bullet hit on enemy flesh/armor
  public emitEnemyHit(pos: THREE.Vector3, isHeadshot: boolean = false) {
    const count = isHeadshot ? 24 : 14;
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 2 + 0.5,
        (Math.random() - 0.5) * 2
      )
        .normalize()
        .multiplyScalar(isHeadshot ? 4.0 + Math.random() * 4 : 2.0 + Math.random() * 2.5);

      const color = isHeadshot
        ? new THREE.Color(1.0, 0.85, 0.2) // Golden critical spark
        : new THREE.Color(1.0, 0.15, 0.15); // Crimson flesh spark

      this.particles.push({
        position: pos.clone(),
        velocity: vel,
        color: color,
        size: (isHeadshot ? 0.18 : 0.12) + Math.random() * 0.08,
        life: 0,
        maxLife: (isHeadshot ? 0.4 : 0.25) + Math.random() * 0.2,
      });
    }
  }

  // Enemy death burst dissolution
  public emitEnemyDeath(pos: THREE.Vector3) {
    const count = 35;
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 2.5 + 0.3,
        (Math.random() - 0.5) * 2
      )
        .normalize()
        .multiplyScalar(2.5 + Math.random() * 4.0);

      this.particles.push({
        position: pos.clone().add(new THREE.Vector3(0, 0.8, 0)),
        velocity: vel,
        color: new THREE.Color(0.9, 0.2 + Math.random() * 0.3, 0.1),
        size: 0.16 + Math.random() * 0.14,
        life: 0,
        maxLife: 0.45 + Math.random() * 0.35,
      });
    }
  }

  // Bullet tracer line from muzzle to hit position
  public addTracer(startPos: THREE.Vector3, endPos: THREE.Vector3) {
    const geo = new THREE.BufferGeometry().setFromPoints([startPos, endPos]);
    const line = new THREE.Line(geo, this.tracerMaterial);
    this.group.add(line);
    this.tracers.push({
      line: line,
      life: 0,
      maxLife: 0.06, // Disappears fast like an authentic ballistic tracer
    });
  }

  public update(dt: number) {
    // 1. Update tracers
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const t = this.tracers[i];
      t.life += dt;
      if (t.life >= t.maxLife) {
        this.group.remove(t.line);
        t.line.geometry.dispose();
        this.tracers.splice(i, 1);
      }
    }

    // 2. Update particle positions and lifespans
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      // Physics
      p.position.addScaledVector(p.velocity, dt);
      p.velocity.y -= 9.8 * dt; // Gravity
      p.velocity.multiplyScalar(0.96); // Drag
    }

    // 3. Write particle buffers
    const count = this.particles.length;
    for (let i = 0; i < count; i++) {
      const p = this.particles[i];
      const i3 = i * 3;
      this.positionsArray[i3] = p.position.x;
      this.positionsArray[i3 + 1] = p.position.y;
      this.positionsArray[i3 + 2] = p.position.z;

      const alpha = 1.0 - p.life / p.maxLife;
      this.colorsArray[i3] = p.color.r * alpha;
      this.colorsArray[i3 + 1] = p.color.g * alpha;
      this.colorsArray[i3 + 2] = p.color.b * alpha;

      this.sizesArray[i] = p.size * alpha;
    }

    // Clear remainder
    for (let i = count; i < this.maxParticles; i++) {
      const i3 = i * 3;
      this.positionsArray[i3] = 0;
      this.positionsArray[i3 + 1] = -9999;
      this.positionsArray[i3 + 2] = 0;
      this.sizesArray[i] = 0;
    }

    this.pointsGeo.attributes.position.needsUpdate = true;
    this.pointsGeo.attributes.color.needsUpdate = true;
    this.pointsGeo.attributes.size.needsUpdate = true;
  }

  public clear() {
    this.particles = [];
    for (const t of this.tracers) {
      this.group.remove(t.line);
      t.line.geometry.dispose();
    }
    this.tracers = [];
  }
}
