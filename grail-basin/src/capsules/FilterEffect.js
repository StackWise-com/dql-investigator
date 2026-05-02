import * as THREE from 'three';

export class FilterEffect {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
  }

  // Create a dissolve burst at a capsule position
  burst(position, colorHex) {
    const count = 8;
    const geo = new THREE.SphereGeometry(0.05, 4, 4);
    const mat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 1,
    });

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(geo, mat.clone());
      mesh.position.copy(position);
      mesh.userData = {
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 3,
          Math.random() * 2,
          (Math.random() - 0.5) * 3
        ),
        life: 1.0,
      };
      this.scene.add(mesh);
      this.particles.push(mesh);
    }
  }

  update(delta) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.userData.life -= delta * 2;
      p.position.addScaledVector(p.userData.velocity, delta);
      p.userData.velocity.y -= delta * 2; // gravity
      p.material.opacity = Math.max(0, p.userData.life);
      p.scale.setScalar(p.userData.life);

      if (p.userData.life <= 0) {
        this.scene.remove(p);
        p.geometry.dispose();
        p.material.dispose();
        this.particles.splice(i, 1);
      }
    }
  }
}
