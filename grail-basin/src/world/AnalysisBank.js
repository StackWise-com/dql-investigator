import * as THREE from 'three';

export class AnalysisBank {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    // FILTER station — large rotating mesh drum
    this.createFilterStation(-25);

    // SUMMARIZE station — large color sorting bins
    this.createSummarizeStation(-5);

    // SORT station — conveyor belt with diverter arms
    this.createSortStation(15);

    // LIMIT station — mechanical gate with counter
    this.createLimitStation(35);

    // Output tray at end
    this.createOutputTray(55);

    scene.add(this.group);
  }

  createFilterStation(x) {
    const group = new THREE.Group();

    // Large drum frame
    const drumGeo = new THREE.CylinderGeometry(4, 4, 6, 24, 1, true);
    const drumMat = new THREE.MeshStandardMaterial({
      color: 0xff9800,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    });
    const drum = new THREE.Mesh(drumGeo, drumMat);
    drum.rotation.x = Math.PI / 2;
    drum.position.y = 5;
    drum.userData = { isDrum: true };
    group.add(drum);

    // Drum end caps
    const capGeo = new THREE.CylinderGeometry(4, 4, 0.5, 24);
    const capMat = new THREE.MeshStandardMaterial({ color: 0xe65100 });
    const leftCap = new THREE.Mesh(capGeo, capMat);
    leftCap.rotation.x = Math.PI / 2;
    leftCap.position.set(-3, 5, 0);
    group.add(leftCap);
    const rightCap = new THREE.Mesh(capGeo, capMat);
    rightCap.rotation.x = Math.PI / 2;
    rightCap.position.set(3, 5, 0);
    group.add(rightCap);

    // Support legs
    for (const sx of [-2.5, 2.5]) {
      const legGeo = new THREE.CylinderGeometry(0.3, 0.4, 4, 8);
      const legMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63 });
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(sx, 2, 0);
      leg.castShadow = true;
      group.add(leg);
    }

    // Rejection chute below
    const chuteGeo = new THREE.BoxGeometry(2.5, 2, 1.5);
    const chuteMat = new THREE.MeshStandardMaterial({ color: 0xbcaaa4 });
    const chute = new THREE.Mesh(chuteGeo, chuteMat);
    chute.position.set(0, 1, -4);
    group.add(chute);

    group.position.set(x, 0, 8);
    this.group.add(group);
  }

  createSummarizeStation(x) {
    const group = new THREE.Group();

    // Large sorting bins (color-coded)
    const colors = [0xff5252, 0x69f0ae, 0x40c4ff, 0xe040fb];
    const binPositions = [-4.5, -1.5, 1.5, 4.5];
    for (let i = 0; i < 4; i++) {
      const binGeo = new THREE.BoxGeometry(2.2, 3.5, 2.2);
      const binMat = new THREE.MeshStandardMaterial({ color: colors[i], roughness: 0.3 });
      const bin = new THREE.Mesh(binGeo, binMat);
      bin.position.set(binPositions[i], 1.75, 0);
      bin.userData = { isBin: true, binIndex: i };
      group.add(bin);

      // Bin rim
      const rimGeo = new THREE.BoxGeometry(2.4, 0.2, 2.4);
      const rimMat = new THREE.MeshStandardMaterial({ color: 0x5d4037 });
      const rim = new THREE.Mesh(rimGeo, rimMat);
      rim.position.set(binPositions[i], 3.6, 0);
      group.add(rim);
    }

    // Sorter arm above
    const armGeo = new THREE.BoxGeometry(12, 0.4, 0.4);
    const armMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63 });
    const arm = new THREE.Mesh(armGeo, armMat);
    arm.position.y = 5.5;
    group.add(arm);

    // Sorter arm supports
    for (const sx of [-5, 5]) {
      const supGeo = new THREE.CylinderGeometry(0.15, 0.15, 4, 8);
      const supMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63 });
      const sup = new THREE.Mesh(supGeo, supMat);
      sup.position.set(sx, 3.5, 0);
      group.add(sup);
    }

    group.position.set(x, 0, 8);
    this.group.add(group);
  }

  createSortStation(x) {
    const group = new THREE.Group();

    // Large conveyor belt base
    const beltGeo = new THREE.BoxGeometry(14, 0.4, 3);
    const beltMat = new THREE.MeshStandardMaterial({ color: 0x546e7a });
    const belt = new THREE.Mesh(beltGeo, beltMat);
    belt.position.y = 2;
    group.add(belt);

    // Large rollers
    for (let i = 0; i < 6; i++) {
      const rollerGeo = new THREE.CylinderGeometry(0.3, 0.3, 3.2, 12);
      const rollerMat = new THREE.MeshStandardMaterial({ color: 0x37474f });
      const roller = new THREE.Mesh(rollerGeo, rollerMat);
      roller.rotation.x = Math.PI / 2;
      roller.position.set(-5.5 + i * 2.2, 2.3, 0);
      roller.userData = { isRoller: true };
      group.add(roller);
    }

    // Diverter arms (pink)
    const diverGeo = new THREE.BoxGeometry(0.3, 2, 0.3);
    const diverMat = new THREE.MeshStandardMaterial({ color: 0xff4081, emissive: 0xff4081, emissiveIntensity: 0.2 });
    const diver1 = new THREE.Mesh(diverGeo, diverMat);
    diver1.position.set(-2, 3.5, 0);
    group.add(diver1);
    const diver2 = new THREE.Mesh(diverGeo, diverMat);
    diver2.position.set(2, 3.5, 0);
    group.add(diver2);

    // Belt supports
    for (const sx of [-6, 0, 6]) {
      const supGeo = new THREE.CylinderGeometry(0.2, 0.2, 2, 8);
      const supMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63 });
      const sup = new THREE.Mesh(supGeo, supMat);
      sup.position.set(sx, 1, 0);
      group.add(sup);
    }

    group.position.set(x, 0, 8);
    this.group.add(group);
  }

  createLimitStation(x) {
    const group = new THREE.Group();

    // Gate frame posts
    const postGeo = new THREE.CylinderGeometry(0.4, 0.5, 7, 8);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63 });
    const leftPost = new THREE.Mesh(postGeo, postMat);
    leftPost.position.set(-2.5, 3.5, 0);
    leftPost.castShadow = true;
    group.add(leftPost);
    const rightPost = new THREE.Mesh(postGeo, postMat);
    rightPost.position.set(2.5, 3.5, 0);
    rightPost.castShadow = true;
    group.add(rightPost);

    // Top beam
    const beamGeo = new THREE.BoxGeometry(6, 0.5, 0.5);
    const beamMat = new THREE.MeshStandardMaterial({ color: 0x5d4037 });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(0, 7, 0);
    group.add(beam);

    // The blade (purple)
    const bladeGeo = new THREE.BoxGeometry(5.5, 0.6, 0.4);
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0xe040fb,
      emissive: 0xe040fb,
      emissiveIntensity: 0.3,
    });
    this.blade = new THREE.Mesh(bladeGeo, bladeMat);
    this.blade.position.set(0, 6.5, 0);
    this.blade.userData = { isBlade: true };
    group.add(this.blade);

    // Counter display box
    const displayGeo = new THREE.BoxGeometry(3, 1.5, 0.3);
    const displayMat = new THREE.MeshStandardMaterial({ color: 0x212121 });
    const display = new THREE.Mesh(displayGeo, displayMat);
    display.position.set(0, 8.5, 0.5);
    group.add(display);

    // Counter frame
    const dFrameGeo = new THREE.BoxGeometry(3.3, 1.8, 0.1);
    const dFrameMat = new THREE.MeshStandardMaterial({ color: 0xe040fb, emissive: 0xe040fb, emissiveIntensity: 0.2 });
    const dFrame = new THREE.Mesh(dFrameGeo, dFrameMat);
    dFrame.position.set(0, 8.5, 0.6);
    group.add(dFrame);

    group.position.set(x, 0, 8);
    this.group.add(group);
  }

  createOutputTray(x) {
    const group = new THREE.Group();

    // Large collection tray
    const trayGeo = new THREE.BoxGeometry(10, 2.5, 6);
    const trayMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.3 });
    const tray = new THREE.Mesh(trayGeo, trayMat);
    tray.position.y = 1.25;
    group.add(tray);

    // Tray rim
    const rimGeo = new THREE.BoxGeometry(10.4, 0.3, 6.4);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x5d4037 });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.position.y = 2.6;
    group.add(rim);

    // Output ramp
    const rampGeo = new THREE.BoxGeometry(4, 0.3, 3);
    const rampMat = new THREE.MeshStandardMaterial({ color: 0xa1887f });
    const ramp = new THREE.Mesh(rampGeo, rampMat);
    ramp.position.set(0, 2.8, 4);
    ramp.rotation.x = -0.25;
    group.add(ramp);

    // "OUTPUT" sign
    const signGeo = new THREE.BoxGeometry(6, 1.2, 0.3);
    const signMat = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: 0x00e5ff,
      emissiveIntensity: 0.3,
    });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 5, -3.5);
    group.add(sign);

    group.position.set(x, 0, 8);
    this.group.add(group);
  }

  dropSieve() {
    this.group.children.forEach((child) => {
      child.traverse((c) => {
        if (c.userData && c.userData.isDrum && c.material) {
          c.material.emissive = new THREE.Color(0xff9800);
          c.material.emissiveIntensity = 0.5;
          setTimeout(() => {
            if (c.material) c.material.emissiveIntensity = 0;
          }, 400);
        }
      });
    });
  }

  dropBlade() {
    this.group.children.forEach((child) => {
      child.traverse((c) => {
        if (c.userData && c.userData.isBlade) {
          let y = c.position.y;
          const interval = setInterval(() => {
            y -= 0.2;
            c.position.y = y;
            if (y <= 3.5) {
              clearInterval(interval);
              setTimeout(() => {
                c.position.y = 6.5;
              }, 500);
            }
          }, 30);
        }
      });
    });
  }

  showColumns(columns) {
    // Visualize summarize by filling bins
    this.group.children.forEach((child) => {
      child.traverse((c) => {
        if (c.userData && c.userData.isFillBar) {
          c.parent.remove(c);
        }
      });
    });

    const maxCount = Math.max(...columns.map((c) => c.count), 1);
    columns.forEach((col, i) => {
      const h = Math.max(0.1, (col.count / maxCount) * 3);
      const barGeo = new THREE.BoxGeometry(1.8, h, 1.8);
      const barMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.4,
      });
      const bar = new THREE.Mesh(barGeo, barMat);
      bar.position.set((i - 1.5) * 3, 3.5 + h / 2, 0);
      bar.userData = { isFillBar: true };
      this.group.add(bar);
    });
  }

  update(delta, time) {
    // Rotate filter drum
    this.group.children.forEach((child) => {
      child.traverse((c) => {
        if (c.userData && c.userData.isDrum) {
          c.rotation.z += delta * 0.8;
        }
        if (c.userData && c.userData.isRoller) {
          c.rotation.x += delta * 3;
        }
      });
    });
  }
}
