import * as THREE from 'three';

export class CameraController {
  constructor(camera, domElement, state) {
    this.camera = camera;
    this.domElement = domElement;
    this.state = state;

    this.isDragging = false;
    this.lastMouse = { x: 0, y: 0 };
    this.rotation = { x: 0.5, y: 0.6 };
    this.targetRotation = { x: 0.5, y: 0.6 };
    this.distance = 25;
    this.targetDistance = 45;
    this.minDistance = 10;
    this.maxDistance = 120;
    this.introActive = true;
    this.introElapsed = 0;
    this.introDuration = 3;

    this.bindEvents();
  }

  startIntro() {
    this.introActive = true;
    this.introElapsed = 0;
    this.distance = 40;
    this.targetDistance = 30;
    this.rotation.x = 0.45;
    this.targetRotation.x = 0.4;
    this.rotation.y = 0.2;
    this.targetRotation.y = 0.15;
  }

  bindEvents() {
    this.domElement.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.isDragging = true;
      this.lastMouse.x = e.clientX;
      this.lastMouse.y = e.clientY;
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.lastMouse.x;
      const dy = e.clientY - this.lastMouse.y;
      this.targetRotation.y -= dx * 0.005;
      this.targetRotation.x += dy * 0.005;
      this.targetRotation.x = Math.max(0.1, Math.min(Math.PI / 2 - 0.1, this.targetRotation.x));
      this.lastMouse.x = e.clientX;
      this.lastMouse.y = e.clientY;
    });

    this.domElement.addEventListener('wheel', (e) => {
      this.targetDistance += e.deltaY * 0.05;
      this.targetDistance = Math.max(this.minDistance, Math.min(this.maxDistance, this.targetDistance));
    }, { passive: true });

    // Touch support
    this.domElement.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.lastMouse.x = e.touches[0].clientX;
        this.lastMouse.y = e.touches[0].clientY;
      }
    }, { passive: true });

    this.domElement.addEventListener('touchmove', (e) => {
      if (!this.isDragging || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - this.lastMouse.x;
      const dy = e.touches[0].clientY - this.lastMouse.y;
      this.targetRotation.y -= dx * 0.008;
      this.targetRotation.x += dy * 0.008;
      this.targetRotation.x = Math.max(0.1, Math.min(Math.PI / 2 - 0.1, this.targetRotation.x));
      this.lastMouse.x = e.touches[0].clientX;
      this.lastMouse.y = e.touches[0].clientY;
    }, { passive: true });

    this.domElement.addEventListener('touchend', () => {
      this.isDragging = false;
    });
  }

  update(delta) {
    if (this.swoopActive) {
      this.updateSwoop(delta);
    } else if (this.introActive) {
      this.introElapsed += delta;
      const t = Math.min(this.introElapsed / this.introDuration, 1);
      const ease = 1 - Math.pow(1 - t, 3); // easeOutCubic
      this.distance = 25 + (this.targetDistance - 25) * ease;
      this.rotation.x = 0.35 + (0.5 - 0.35) * ease;
      this.rotation.y = 0.6 + (0.6 - 0.6) * ease;
      if (t >= 1) this.introActive = false;
    } else {
      // Smooth interpolation (inertia)
      this.rotation.x += (this.targetRotation.x - this.rotation.x) * 3 * delta;
      this.rotation.y += (this.targetRotation.y - this.rotation.y) * 3 * delta;
      this.distance += (this.targetDistance - this.distance) * 3 * delta;
    }

    // Convert spherical to cartesian
    const target = this.state.cameraTarget;
    const x = target.x + this.distance * Math.sin(this.rotation.x) * Math.sin(this.rotation.y);
    const y = target.y + this.distance * Math.cos(this.rotation.x);
    const z = target.z + this.distance * Math.sin(this.rotation.x) * Math.cos(this.rotation.y);

    this.camera.position.set(x, y, z);
    this.camera.lookAt(target);
  }

  moveToZone(zoneName) {
    switch (zoneName) {
      case 'smartscape':
        this.targetRotation.x = 0.05;
        this.targetRotation.y += Math.PI;
        this.targetDistance = 80;
        break;
      case 'grail':
        // Cinematic Grail zoom — look down into the reservoir
        this.targetRotation.x = 0.35;
        this.targetRotation.y = Math.PI / 4;
        this.targetDistance = 18;
        this.state.cameraTarget.set(0, -2, 0);
        break;
      case 'dpl':
        // DPL Lab close-up
        this.targetRotation.x = 0.4;
        this.targetRotation.y = -Math.PI / 6;
        this.targetDistance = 22;
        this.state.cameraTarget.set(45, 1, 8);
        break;
      default:
        // Basin overview
        this.targetRotation.x = 0.5;
        this.targetRotation.y += 0.2;
        this.targetDistance = 45;
        this.state.cameraTarget.set(0, 0, 0);
    }
  }

  swoopTo(x, y, z, zoneName) {
    // Temporarily override update for a cinematic swoop
    this.swoopActive = true;
    this.swoopElapsed = 0;
    this.swoopDuration = 1.5;
    this.swoopStartTarget = this.state.cameraTarget.clone();
    this.swoopEndTarget = new THREE.Vector3(x, y, z);
    this.swoopStartDistance = this.distance;
    this.swoopEndDistance = zoneName === 'basin' ? 25 : 20;
    this.swoopStartRotX = this.rotation.x;
    this.swoopStartRotY = this.rotation.y;
    this.swoopEndRotX = 0.4;
    this.swoopEndRotY = this.rotation.y + Math.PI * 0.3; // rotate around target
  }

  updateSwoop(delta) {
    this.swoopElapsed += delta;
    const t = Math.min(this.swoopElapsed / this.swoopDuration, 1);
    const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; // easeInOutCubic

    this.state.cameraTarget.lerpVectors(this.swoopStartTarget, this.swoopEndTarget, ease);
    this.distance = this.swoopStartDistance + (this.swoopEndDistance - this.swoopStartDistance) * ease;
    this.rotation.x = this.swoopStartRotX + (this.swoopEndRotX - this.swoopStartRotX) * ease;
    this.rotation.y = this.swoopStartRotY + (this.swoopEndRotY - this.swoopStartRotY) * ease;

    if (t >= 1) {
      this.swoopActive = false;
      this.targetRotation.x = this.rotation.x;
      this.targetRotation.y = this.rotation.y;
      this.targetDistance = this.distance;
    }
  }
}
