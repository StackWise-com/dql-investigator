import * as THREE from 'three';
import { GrailReservoir } from './GrailReservoir.js';
import { AnalysisBank } from './AnalysisBank.js';
import { River } from './River.js';

export class WorldManager {
  constructor(scene) {
    this.scene = scene;
    this.grail = new GrailReservoir(scene);
    this.analysisBank = new AnalysisBank(scene);
    this.river = new River(scene);

    this.createFactoryFloor();
  }

  createFactoryFloor() {
    // Clean factory floor — warm cream color, no grid
    const floorGeo = new THREE.PlaneGeometry(160, 80);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xfaf6f1,
      roughness: 0.6,
      metalness: 0.05,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.5;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Subtle pipeline shadow path
    const pathGeo = new THREE.PlaneGeometry(100, 5);
    const pathMat = new THREE.MeshStandardMaterial({
      color: 0xf0eae3,
      roughness: 0.6,
      transparent: true,
      opacity: 0.4,
    });
    const path = new THREE.Mesh(pathGeo, pathMat);
    path.rotation.x = -Math.PI / 2;
    path.position.set(10, -0.48, 0);
    this.scene.add(path);
  }

  getRiverCurve() {
    return this.river.curve;
  }

  update(cameraPosition, delta, time) {
    this.river.update(delta, time);
  }
}
