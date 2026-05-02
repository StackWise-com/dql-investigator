import * as THREE from 'three';

export class River {
  constructor(scene) {
    this.scene = scene;

    // Thick pipeline from pool to output
    const start = new THREE.Vector3(-50, 1.5, 0);
    const p1 = new THREE.Vector3(-30, 2, 0);
    const p2 = new THREE.Vector3(-10, 2.5, 0);
    const p3 = new THREE.Vector3(10, 2.5, 0);
    const p4 = new THREE.Vector3(30, 2, 0);
    const end = new THREE.Vector3(55, 1.5, 0);

    this.curve = new THREE.CatmullRomCurve3([start, p1, p2, p3, p4, end]);

    // Main pipeline — thick transparent tube
    const tubeGeo = new THREE.TubeGeometry(this.curve, 80, 2.0, 20, false);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0xb3e5fc,
      transparent: true,
      opacity: 0.18,
      roughness: 0.05,
      metalness: 0.3,
      side: THREE.DoubleSide,
    });
    this.mesh = new THREE.Mesh(tubeGeo, tubeMat);
    scene.add(this.mesh);

    // Inner glow line (shows flow direction)
    const innerGeo = new THREE.TubeGeometry(this.curve, 80, 1.6, 16, false);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0xe1f5fe,
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide,
    });
    this.innerGlow = new THREE.Mesh(innerGeo, innerMat);
    scene.add(this.innerGlow);

    // Pipeline support legs (large industrial)
    const supportPositions = [-35, -20, -5, 10, 25, 40];
    for (const x of supportPositions) {
      const legGeo = new THREE.CylinderGeometry(0.4, 0.5, 3, 12);
      const legMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.4 });
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(x, 0.5, 0);
      leg.castShadow = true;
      scene.add(leg);

      // Joint ring
      const jointGeo = new THREE.TorusGeometry(2.2, 0.15, 8, 24);
      const jointMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.3 });
      const joint = new THREE.Mesh(jointGeo, jointMat);
      joint.rotation.x = Math.PI / 2;
      joint.position.set(x, 2.2, 0);
      scene.add(joint);
    }

    // Station platforms along pipeline
    this.createStationPlatform(-25, 'FILTER', 0xff9800);
    this.createStationPlatform(-5, 'SUMMARIZE', 0x69f0ae);
    this.createStationPlatform(15, 'SORT', 0x40c4ff);
    this.createStationPlatform(35, 'LIMIT', 0xe040fb);
  }

  createStationPlatform(x, label, color) {
    const group = new THREE.Group();

    // Large platform
    const platGeo = new THREE.CylinderGeometry(5, 5.5, 0.4, 16);
    const platMat = new THREE.MeshStandardMaterial({ color: 0xd7ccc8, roughness: 0.4 });
    const plat = new THREE.Mesh(platGeo, platMat);
    plat.position.y = 0.2;
    plat.receiveShadow = true;
    group.add(plat);

    // Colored ring around platform
    const ringGeo = new THREE.TorusGeometry(5.3, 0.2, 8, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.3,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.4;
    group.add(ring);

    // Large sign post
    const postGeo = new THREE.CylinderGeometry(0.15, 0.2, 8, 8);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63 });
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.set(0, 4, -4);
    group.add(post);

    // Sign board
    const boardGeo = new THREE.BoxGeometry(6, 1.5, 0.3);
    const boardMat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.25,
    });
    const board = new THREE.Mesh(boardGeo, boardMat);
    board.position.set(0, 8, -4);
    group.add(board);

    group.position.set(x, 0, 8);
    this.scene.add(group);
  }

  update(delta, time) {
    // Gentle pipeline pulse
    if (this.innerGlow && this.innerGlow.material) {
      this.innerGlow.material.opacity = 0.1 + Math.sin(time * 1.5) * 0.05;
    }
  }
}
