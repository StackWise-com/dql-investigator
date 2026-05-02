import * as THREE from 'three';
import { getCapsuleColor, getCapsuleSize } from './CapsuleTypes.js';

const POOL_SIZE = 500;

export class CapsuleManager {
  constructor(scene, riverCurve) {
    this.scene = scene;
    this.riverCurve = riverCurve;
    this.pool = [];
    this.active = [];
    this.landed = [];
    this.filterActive = false;
    this.filterLevel = null;
    this.queryMode = false;
    this.queryCapsules = [];

    // Pre-create capsule meshes
    for (let i = 0; i < POOL_SIZE; i++) {
      const capsule = this.createCapsuleMesh();
      capsule.visible = false;
      scene.add(capsule);
      this.pool.push(capsule);
    }
  }

  createCapsuleMesh() {
    const shapes = [
      new THREE.SphereGeometry(0.6, 12, 12),
      new THREE.BoxGeometry(1.0, 0.6, 0.6),
      new THREE.CylinderGeometry(0.35, 0.35, 1.0, 12),
    ];
    const geo = shapes[Math.floor(Math.random() * shapes.length)];
    const mat = new THREE.MeshStandardMaterial({
      color: 0x2196f3,
      emissive: 0x2196f3,
      emissiveIntensity: 1.0,
      transparent: true,
      opacity: 0.95,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData = {
      active: false,
      t: 0,
      speed: 0,
      level: 'INFO',
      phase: 0,
      dissolving: false,
    };
    return mesh;
  }

  spawn(level, startT = 0) {
    const capsule = this.pool.pop();
    if (!capsule) return null;

    const color = getCapsuleColor(level);
    const size = getCapsuleSize(level);

    capsule.material.color.setHex(color);
    capsule.material.emissive.setHex(color);
    capsule.material.opacity = 0.9;
    capsule.scale.setScalar(size);
    capsule.userData = {
      active: true,
      t: startT,
      speed: 0.12 + Math.random() * 0.12,
      level,
      phase: Math.random() * Math.PI * 2,
      dissolving: false,
      originalScale: size,
    };
    capsule.visible = true;
    this.active.push(capsule);
    return capsule;
  }

  recycle(capsule) {
    capsule.visible = false;
    capsule.userData.active = false;
    capsule.userData.dissolving = false;
    capsule.userData.landed = false;
    capsule.userData.landing = false;
    const idxActive = this.active.indexOf(capsule);
    if (idxActive > -1) this.active.splice(idxActive, 1);
    const idxLanded = this.landed.indexOf(capsule);
    if (idxLanded > -1) this.landed.splice(idxLanded, 1);
    this.pool.push(capsule);
  }

  update(delta, time) {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const c = this.active[i];

      if (c.userData.landing) {
        c.position.lerp(c.userData.trayTarget, delta * 6);
        const targetScale = c.userData.originalScale || 1;
        c.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 6);
        if (c.position.distanceTo(c.userData.trayTarget) < 0.15) {
          c.userData.landing = false;
          c.userData.landed = true;
        }
        continue;
      }

      if (c.userData.landed) continue;

      c.userData.t += c.userData.speed * delta;

      if (c.userData.t >= 1) {
        const trayX = 52 + Math.random() * 6;
        const trayY = 2.6 + Math.random() * 1.2;
        const trayZ = 6 + Math.random() * 4;
        c.userData.trayTarget = new THREE.Vector3(trayX, trayY, trayZ);
        c.userData.landing = true;
        this.active.splice(i, 1);
        this.landed.push(c);
        continue;
      }

      const pt = this.riverCurve.getPointAt(c.userData.t);
      c.position.set(
        pt.x + Math.sin(time * 0.5 + c.userData.phase) * 0.3,
        pt.y + 0.4 + Math.sin(time * 2 + c.userData.phase) * 0.15,
        pt.z + Math.cos(time * 0.3 + c.userData.phase) * 0.3
      );

      c.rotation.x += delta * 0.5;
      c.rotation.y += delta * 0.3;

      // Filter dissolve effect — filter station is at x ≈ -25  →  t ≈ 0.15
      if (this.filterActive && this.filterLevel &&
          c.userData.level !== this.filterLevel &&
          c.userData.t > 0.05 && c.userData.t < 0.25 &&
          !c.userData.dissolving) {
        c.userData.dissolving = true;
      }

      if (c.userData.dissolving) {
        c.material.opacity -= delta * 2.5;
        c.scale.multiplyScalar(1 - delta * 2);
        if (c.material.opacity <= 0) {
          this.recycle(c);
          continue;
        }
      }
    }
  }

  setFilter(level) {
    this.filterActive = !!level;
    this.filterLevel = level;
  }

  clearFilter() {
    this.filterActive = false;
    this.filterLevel = null;
  }

  // Query mode: spawn specific capsules from query results
  spawnFromResults(results) {
    // Clear existing flowing capsules
    while (this.active.length > 0) {
      this.recycle(this.active[0]);
    }
    // Clear landed capsules from previous query
    while (this.landed.length > 0) {
      this.recycle(this.landed[0]);
    }

    // Spawn up to 200 capsules representing the results
    const count = Math.min(results.length, 200);
    for (let i = 0; i < count; i++) {
      const log = results[i];
      const level = log.loglevel || 'INFO';
      const capsule = this.spawn(level, (i / count) * 0.08);
      if (capsule) {
        capsule.userData.log = log;
        capsule.userData.speed = 0.18 + Math.random() * 0.12;
      }
    }
  }

  freeze() {
    this.active.forEach((c) => {
      c.userData.speed = 0;
    });
  }

  resume() {
    this.active.forEach((c) => {
      if (c.userData.speed === 0) {
        c.userData.speed = 0.18 + Math.random() * 0.12;
      }
    });
  }
}
