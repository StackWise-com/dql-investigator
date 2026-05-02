import * as THREE from 'three';

const CANDY_COLORS = [
  0xff5252, 0xff9800, 0xffeb3b, 0x69f0ae,
  0x40c4ff, 0xe040fb, 0xff4081, 0x18ffff,
];

export class GrailReservoir {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.poolObjects = [];

    // Main pool — large wide display jar
    const jarGeo = new THREE.CylinderGeometry(9, 7, 6, 32, 1, true);
    const jarMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.12,
      roughness: 0.05,
      metalness: 0.05,
      transmission: 0.7,
      thickness: 1,
      side: THREE.DoubleSide,
    });
    const jar = new THREE.Mesh(jarGeo, jarMat);
    jar.position.y = 3.5;
    jar.castShadow = false;
    this.group.add(jar);

    // Jar base (solid wood/metal)
    const baseGeo = new THREE.CylinderGeometry(9.5, 10, 1, 32);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.4 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.5;
    base.receiveShadow = true;
    this.group.add(base);

    // Jar top rim
    const rimGeo = new THREE.TorusGeometry(9, 0.4, 12, 48);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.3, metalness: 0.4 });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 6.5;
    this.group.add(rim);

    // Fill the jar with large colorful objects
    const shapes = [
      () => new THREE.SphereGeometry(0.6, 16, 16),
      () => new THREE.BoxGeometry(0.8, 0.8, 0.8),
      () => new THREE.ConeGeometry(0.45, 0.9, 16),
      () => new THREE.CylinderGeometry(0.35, 0.35, 0.8, 12),
      () => new THREE.DodecahedronGeometry(0.5, 0),
      () => new THREE.OctahedronGeometry(0.55, 0),
    ];

    for (let i = 0; i < 200; i++) {
      const shapeFn = shapes[Math.floor(Math.random() * shapes.length)];
      const geo = shapeFn();
      const color = CANDY_COLORS[Math.floor(Math.random() * CANDY_COLORS.length)];
      const mat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.2,
        metalness: 0.1,
      });
      const mesh = new THREE.Mesh(geo, mat);

      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * 6;
      mesh.position.set(
        Math.cos(angle) * r,
        1.5 + Math.random() * 4.5,
        Math.sin(angle) * r
      );
      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      mesh.userData = {
        basePos: mesh.position.clone(),
        phase: Math.random() * Math.PI * 2,
        speed: 0.2 + Math.random() * 0.4,
        rotSpeed: {
          x: (Math.random() - 0.5) * 0.4,
          y: (Math.random() - 0.5) * 0.4,
          z: (Math.random() - 0.5) * 0.4,
        },
      };

      this.group.add(mesh);
      this.poolObjects.push(mesh);
    }

    // Fetch gate — large sliding door at bottom of jar
    const gateFrameGeo = new THREE.BoxGeometry(5, 0.4, 0.4);
    const gateFrameMat = new THREE.MeshStandardMaterial({ color: 0x5d4037 });
    const gateFrameTop = new THREE.Mesh(gateFrameGeo, gateFrameMat);
    gateFrameTop.position.set(0, 2.2, 9);
    this.group.add(gateFrameTop);

    const gateFrameBot = new THREE.Mesh(gateFrameGeo, gateFrameMat);
    gateFrameBot.position.set(0, 0.8, 9);
    this.group.add(gateFrameBot);

    const gateGeo = new THREE.BoxGeometry(4.5, 1.2, 0.2);
    const gateMat = new THREE.MeshStandardMaterial({
      color: 0xff9800,
      emissive: 0xff9800,
      emissiveIntensity: 0.2,
    });
    this.gate = new THREE.Mesh(gateGeo, gateMat);
    this.gate.position.set(0, 1.5, 9);
    this.group.add(this.gate);

    // "FETCH GATE" sign above
    const signGeo = new THREE.BoxGeometry(6, 1, 0.2);
    const signMat = new THREE.MeshStandardMaterial({
      color: 0xff9800,
      emissive: 0xff9800,
      emissiveIntensity: 0.3,
    });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 8.5, 9);
    this.group.add(sign);

    this.group.position.set(-50, 0, 0);
    scene.add(this.group);
  }

  update(delta, time) {
    for (const obj of this.poolObjects) {
      const d = obj.userData;
      obj.position.y = d.basePos.y + Math.sin(time * d.speed + d.phase) * 0.2;
      obj.rotation.x += d.rotSpeed.x * delta;
      obj.rotation.y += d.rotSpeed.y * delta;
      obj.rotation.z += d.rotSpeed.z * delta;
    }
  }

  openGate() {
    this.gate.position.y = 2.5;
  }

  closeGate() {
    this.gate.position.y = 1.5;
  }
}
