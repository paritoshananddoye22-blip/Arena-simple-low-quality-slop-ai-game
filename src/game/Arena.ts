import * as THREE from 'three';
import { ARENA } from './constants';
import {
  createBarrelTexture,
  createConcreteFloorTexture,
  createCrateTexture,
  createHazardTexture,
  createWallTexture,
} from './textures';

export interface ColliderBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  height: number;
}

export class Arena {
  public group: THREE.Group;
  public colliders: ColliderBox[] = [];
  public shootableObstacles: THREE.Object3D[] = [];

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'Arena';

    this.buildFloor();
    this.buildWalls();
    this.buildCeilingTrusses();
    this.buildCoverBarriers();
    this.buildCrates();
    this.buildBarrels();
    this.buildLightingFixtures();
  }

  private buildFloor() {
    const floorGeo = new THREE.PlaneGeometry(ARENA.SIZE, ARENA.SIZE);
    const floorTex = createConcreteFloorTexture();
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.85,
      metalness: 0.15,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.name = 'Floor';
    this.group.add(floor);
    this.shootableObstacles.push(floor);
  }

  private buildWalls() {
    const wallTex = createWallTexture();
    const wallMat = new THREE.MeshStandardMaterial({
      map: wallTex,
      roughness: 0.75,
      metalness: 0.2,
    });
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0x111317,
      roughness: 0.5,
      metalness: 0.8,
    });

    const half = ARENA.HALF_SIZE;
    const h = ARENA.WALL_HEIGHT;
    const thickness = ARENA.WALL_THICKNESS;

    const wallConfigs = [
      // North
      { x: 0, z: -half - thickness / 2, sx: ARENA.SIZE + thickness * 2, sz: thickness },
      // South
      { x: 0, z: half + thickness / 2, sx: ARENA.SIZE + thickness * 2, sz: thickness },
      // West
      { x: -half - thickness / 2, z: 0, sx: thickness, sz: ARENA.SIZE },
      // East
      { x: half + thickness / 2, z: 0, sx: thickness, sz: ARENA.SIZE },
    ];

    wallConfigs.forEach((cfg) => {
      const geo = new THREE.BoxGeometry(cfg.sx, h, cfg.sz);
      const mesh = new THREE.Mesh(geo, wallMat);
      mesh.position.set(cfg.x, h / 2, cfg.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.group.add(mesh);
      this.shootableObstacles.push(mesh);

      // Top steel rail / trim
      const trimGeo = new THREE.BoxGeometry(cfg.sx + 0.1, 0.4, cfg.sz + 0.1);
      const trimMesh = new THREE.Mesh(trimGeo, trimMat);
      trimMesh.position.set(cfg.x, h + 0.2, cfg.z);
      this.group.add(trimMesh);

      // Middle support belt
      const beltGeo = new THREE.BoxGeometry(cfg.sx + 0.05, 0.3, cfg.sz + 0.05);
      const beltMesh = new THREE.Mesh(beltGeo, trimMat);
      beltMesh.position.set(cfg.x, h / 2, cfg.z);
      this.group.add(beltMesh);

      // Add to collision list
      this.colliders.push({
        minX: cfg.x - cfg.sx / 2,
        maxX: cfg.x + cfg.sx / 2,
        minZ: cfg.z - cfg.sz / 2,
        maxZ: cfg.z + cfg.sz / 2,
        height: h,
      });
    });
  }

  // Industrial ceiling support trusses spanning overhead
  private buildCeilingTrusses() {
    const trussMat = new THREE.MeshStandardMaterial({
      color: 0x181c22,
      metalness: 0.85,
      roughness: 0.35,
    });

    const half = ARENA.HALF_SIZE;
    const y = ARENA.WALL_HEIGHT - 0.5;

    // Cross beams across X and Z
    const beamPositions = [-12, -4, 4, 12];
    beamPositions.forEach((pos) => {
      // Beam along X
      const beamX = new THREE.Mesh(
        new THREE.BoxGeometry(ARENA.SIZE, 0.35, 0.35),
        trussMat
      );
      beamX.position.set(0, y, pos);
      this.group.add(beamX);

      // Beam along Z
      const beamZ = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.35, ARENA.SIZE),
        trussMat
      );
      beamZ.position.set(pos, y, 0);
      this.group.add(beamZ);

      // Suspended industrial high-bay lamp at intersections
      beamPositions.forEach((pos2) => {
        const lampGroup = new THREE.Group();
        lampGroup.position.set(pos, y, pos2);

        // Suspension cable
        const cable = new THREE.Mesh(
          new THREE.CylinderGeometry(0.02, 0.02, 1.2, 6),
          trussMat
        );
        cable.position.y = -0.6;
        lampGroup.add(cable);

        // Lamp hood
        const hood = new THREE.Mesh(
          new THREE.ConeGeometry(0.5, 0.35, 12, 1, true),
          trussMat
        );
        hood.position.y = -1.2;
        hood.rotation.x = Math.PI;
        lampGroup.add(hood);

        // Bulb emissive
        const bulb = new THREE.Mesh(
          new THREE.SphereGeometry(0.18, 10, 8),
          new THREE.MeshBasicMaterial({ color: 0xffeedd })
        );
        bulb.position.y = -1.25;
        lampGroup.add(bulb);

        // Downward area point light
        const downLight = new THREE.PointLight(0xfff0d8, 8, 16, 2);
        downLight.position.y = -1.4;
        lampGroup.add(downLight);

        this.group.add(lampGroup);
      });
    });
  }

  private buildCoverBarriers() {
    const barrierMat = new THREE.MeshStandardMaterial({
      color: 0x3a3f47,
      roughness: 0.8,
      metalness: 0.2,
    });
    const hazardTex = createHazardTexture();
    const topHazardMat = new THREE.MeshStandardMaterial({
      map: hazardTex,
      roughness: 0.6,
      metalness: 0.1,
    });

    // Major tactical cover barriers forming combat corridors
    const barrierPlacements = [
      { x: -8, z: -6, rotY: 0, length: 5 },
      { x: 8, z: -6, rotY: 0, length: 5 },
      { x: -8, z: 8, rotY: 0, length: 5 },
      { x: 8, z: 8, rotY: 0, length: 5 },
      { x: 0, z: -15, rotY: 0, length: 5 },
      { x: 0, z: 15, rotY: 0, length: 5 },
      { x: -12, z: 1, rotY: Math.PI / 4, length: 3.5 },
      { x: 12, z: 1, rotY: -Math.PI / 4, length: 3.5 },
    ];

    barrierPlacements.forEach((p) => {
      const bGroup = new THREE.Group();
      bGroup.position.set(p.x, 0, p.z);
      bGroup.rotation.y = p.rotY;

      const width = p.length;
      const height = 1.35;
      const depth = 0.55;

      // Concrete barrier body (flared base)
      const bodyGeo = new THREE.BoxGeometry(width, height, depth);
      const bodyMesh = new THREE.Mesh(bodyGeo, barrierMat);
      bodyMesh.position.y = height / 2;
      bodyMesh.castShadow = true;
      bodyMesh.receiveShadow = true;
      bGroup.add(bodyMesh);

      // Hazard top cap
      const capGeo = new THREE.BoxGeometry(width, 0.1, depth + 0.05);
      const capMesh = new THREE.Mesh(capGeo, topHazardMat);
      capMesh.position.y = height + 0.05;
      capMesh.castShadow = true;
      capMesh.receiveShadow = true;
      bGroup.add(capMesh);

      this.group.add(bGroup);
      this.shootableObstacles.push(bodyMesh);

      // AABB approximation for collision
      const halfW = (Math.abs(Math.cos(p.rotY)) * width + Math.abs(Math.sin(p.rotY)) * depth) / 2;
      const halfD = (Math.abs(Math.sin(p.rotY)) * width + Math.abs(Math.cos(p.rotY)) * depth) / 2;

      this.colliders.push({
        minX: p.x - halfW,
        maxX: p.x + halfW,
        minZ: p.z - halfD,
        maxZ: p.z + halfD,
        height: height,
      });
    });
  }

  private buildCrates() {
    const crateTex = createCrateTexture();
    const crateMat = new THREE.MeshStandardMaterial({
      map: crateTex,
      roughness: 0.7,
      metalness: 0.25,
    });

    const cratePlacements = [
      { x: -4.5, z: -3.5, size: 1.1, rotY: 0.15 },
      { x: -5.3, z: -3.0, size: 1.1, rotY: -0.2 },
      { x: -4.9, z: -3.2, y: 1.1, size: 0.9, rotY: 0.4 }, // Stacked
      { x: 5, z: 4, size: 1.2, rotY: 0.3 },
      { x: 4.2, z: 4.8, size: 1.0, rotY: -0.1 },
      { x: -13, z: 11, size: 1.3, rotY: 0.2 },
      { x: 13, z: -11, size: 1.3, rotY: -0.4 },
      { x: 12.2, z: -10.2, y: 1.3, size: 0.9, rotY: 0.1 }, // Stacked
    ];

    cratePlacements.forEach((c) => {
      const geo = new THREE.BoxGeometry(c.size, c.size, c.size);
      const mesh = new THREE.Mesh(geo, crateMat);
      mesh.position.set(c.x, (c.y || 0) + c.size / 2, c.z);
      mesh.rotation.y = c.rotY;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.group.add(mesh);
      this.shootableObstacles.push(mesh);

      // Only ground-level crates need 2D ground colliders
      if (!c.y) {
        const half = (c.size * 1.1) / 2;
        this.colliders.push({
          minX: c.x - half,
          maxX: c.x + half,
          minZ: c.z - half,
          maxZ: c.z + half,
          height: 2.2,
        });
      }
    });
  }

  private buildBarrels() {
    const barrelTex = createBarrelTexture();
    const barrelMat = new THREE.MeshStandardMaterial({
      map: barrelTex,
      roughness: 0.55,
      metalness: 0.45,
    });

    const barrelPlacements = [
      { x: -11, z: -10 },
      { x: -10.3, z: -10.6 },
      { x: 11, z: 10 },
      { x: 11.7, z: 9.3 },
      { x: -6, z: 11 },
      { x: 7, z: -11 },
    ];

    const geo = new THREE.CylinderGeometry(0.38, 0.38, 1.1, 14);

    barrelPlacements.forEach((b) => {
      const mesh = new THREE.Mesh(geo, barrelMat);
      mesh.position.set(b.x, 0.55, b.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.group.add(mesh);
      this.shootableObstacles.push(mesh);

      const r = 0.42;
      this.colliders.push({
        minX: b.x - r,
        maxX: b.x + r,
        minZ: b.z - r,
        maxZ: b.z + r,
        height: 1.1,
      });
    });
  }

  private buildLightingFixtures() {
    // 4 Corner floodlight posts
    const postMat = new THREE.MeshStandardMaterial({
      color: 0x1f232b,
      metalness: 0.85,
      roughness: 0.3,
    });
    const lampMat = new THREE.MeshBasicMaterial({ color: 0xffe8aa });

    const corners = [
      { x: -18, z: -18 },
      { x: 18, z: -18 },
      { x: -18, z: 18 },
      { x: 18, z: 18 },
    ];

    corners.forEach((c) => {
      const postGeo = new THREE.CylinderGeometry(0.15, 0.22, 10, 8);
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(c.x, 5, c.z);
      this.group.add(post);

      const headGeo = new THREE.BoxGeometry(0.8, 0.5, 0.7);
      const head = new THREE.Mesh(headGeo, postMat);
      head.position.set(c.x, 9.8, c.z);
      head.lookAt(0, 2, 0);
      this.group.add(head);

      const bulbGeo = new THREE.BoxGeometry(0.65, 0.35, 0.1);
      const bulb = new THREE.Mesh(bulbGeo, lampMat);
      bulb.position.set(0, 0, 0.36);
      head.add(bulb);

      // Floodlight point light
      const light = new THREE.PointLight(0xffe2a4, 18, 38, 1.6);
      light.position.set(c.x, 9.5, c.z);
      this.group.add(light);
    });
  }

  // Check collision for an entity with circle radius (player or enemy)
  public checkCircleCollision(
    x: number,
    z: number,
    radius: number
  ): { collided: boolean; pushX: number; pushZ: number } {
    let pushX = 0;
    let pushZ = 0;
    let collided = false;

    // Bounds check within arena interior
    const innerBound = ARENA.HALF_SIZE - radius;
    if (x < -innerBound) {
      pushX += -innerBound - x;
      collided = true;
    } else if (x > innerBound) {
      pushX += innerBound - x;
      collided = true;
    }

    if (z < -innerBound) {
      pushZ += -innerBound - z;
      collided = true;
    } else if (z > innerBound) {
      pushZ += innerBound - z;
      collided = true;
    }

    // Check obstacles
    for (const box of this.colliders) {
      const closestX = Math.max(box.minX, Math.min(x, box.maxX));
      const closestZ = Math.max(box.minZ, Math.min(z, box.maxZ));

      const dx = x - closestX;
      const dz = z - closestZ;
      const distSq = dx * dx + dz * dz;

      if (distSq < radius * radius) {
        collided = true;
        const dist = Math.sqrt(distSq);
        if (dist > 0.0001) {
          const overlap = radius - dist;
          pushX += (dx / dist) * overlap;
          pushZ += (dz / dist) * overlap;
        } else {
          const distToMinX = Math.abs(x - box.minX);
          const distToMaxX = Math.abs(x - box.maxX);
          const distToMinZ = Math.abs(z - box.minZ);
          const distToMaxZ = Math.abs(z - box.maxZ);
          const minDist = Math.min(distToMinX, distToMaxX, distToMinZ, distToMaxZ);

          if (minDist === distToMinX) pushX -= radius;
          else if (minDist === distToMaxX) pushX += radius;
          else if (minDist === distToMinZ) pushZ -= radius;
          else pushZ += radius;
        }
      }
    }

    return { collided, pushX, pushZ };
  }
}
