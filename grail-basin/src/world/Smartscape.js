import * as THREE from 'three';

export class Smartscape {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.visible = false;

    // Create a grid plane
    const gridGeo = new THREE.PlaneGeometry(120, 120, 24, 24);
    const gridMat = new THREE.MeshBasicMaterial({
      color: 0x00d4ff,
      wireframe: true,
      transparent: true,
      opacity: 0.1,
    });
    const grid = new THREE.Mesh(gridGeo, gridMat);
    grid.rotation.x = -Math.PI / 2;
    grid.position.y = 30;
    this.group.add(grid);

    // Service nodes
    const nodePositions = [];
    const services = [
      'checkout-service', 'auth-api', 'payment-gateway', 'user-store',
      'inventory-service', 'recommendation-engine', 'notification-service',
      'api-gateway', 'session-manager', 'cache-layer', 'order-processor',
    ];

    services.forEach((service, i) => {
      const angle = (i / services.length) * Math.PI * 2;
      const r = 15 + Math.random() * 10;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      nodePositions.push({ x, z, service });

      // Node circle
      const circleGeo = new THREE.CircleGeometry(1.5, 16);
      const circleMat = new THREE.MeshBasicMaterial({
        color: 0x00d4ff,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
      });
      const circle = new THREE.Mesh(circleGeo, circleMat);
      circle.position.set(x, 30.1, z);
      circle.rotation.x = -Math.PI / 2;
      circle.userData = { isSmartscapeNode: true, service };
      this.group.add(circle);

      // Inner glow
      const glowGeo = new THREE.CircleGeometry(0.8, 12);
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0x00ffcc,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.position.set(x, 30.15, z);
      glow.rotation.x = -Math.PI / 2;
      this.group.add(glow);

      // Label (simplified as small box)
      const labelGeo = new THREE.BoxGeometry(3, 0.1, 0.6);
      const labelMat = new THREE.MeshBasicMaterial({ color: 0x88ccff, transparent: true, opacity: 0.6 });
      const label = new THREE.Mesh(labelGeo, labelMat);
      label.position.set(x, 30.2, z + 2.5);
      this.group.add(label);
    });

    // Dependency lines
    for (let i = 0; i < nodePositions.length; i++) {
      const a = nodePositions[i];
      const b = nodePositions[(i + 1) % nodePositions.length];
      const points = [new THREE.Vector3(a.x, 30.1, a.z), new THREE.Vector3(b.x, 30.1, b.z)];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x00d4ff,
        transparent: true,
        opacity: 0.25,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      this.group.add(line);
    }

    this.group.visible = false;
    scene.add(this.group);

    // Raycaster for node clicks
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
  }

  bindClick(domElement, camera) {
    domElement.addEventListener('click', (e) => {
      if (!this.visible) return;
      const rect = domElement.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, camera);
      const hits = this.raycaster.intersectObjects(this.group.children, true);
      for (const hit of hits) {
        if (hit.object.userData.isSmartscapeNode) {
          window.dispatchEvent(new CustomEvent('smartscapeclick', {
            detail: { service: hit.object.userData.service, position: hit.object.position.clone() }
          }));
          break;
        }
      }
    });
  }

  show() {
    this.visible = true;
    this.group.visible = true;
  }

  hide() {
    this.visible = false;
    this.group.visible = false;
  }

  toggle() {
    this.visible ? this.hide() : this.show();
  }

  update(delta, time) {
    if (!this.visible) return;

    // Subtle pulse on nodes
    this.group.children.forEach((child) => {
      if (child.geometry && child.geometry.type === 'CircleGeometry' && child.geometry.parameters.radius === 0.8) {
        child.material.opacity = 0.5 + Math.sin(time * 2 + child.position.x) * 0.2;
      }
    });
  }
}
