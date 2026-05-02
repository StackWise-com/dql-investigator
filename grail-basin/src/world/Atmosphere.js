import * as THREE from 'three';

export class Atmosphere {
  constructor(scene) {
    this.scene = scene;
    // Clean factory atmosphere — no fog, minimal particles
  }

  update(delta, time) {
    // Nothing to update in clean factory mode
  }
}
