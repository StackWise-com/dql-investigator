import * as THREE from 'three';

export class Highlands {
  constructor() {
    this.buildings = [];
  }

  createBuilding(height, rand) {
    const group = new THREE.Group();

    // Hull colors from spec
    const hullColors = [0x2779a7, 0x49c5b6, 0xFF9398, 0x62864b, 0x69b2c7];
    const hullColor = hullColors[Math.floor(rand() * hullColors.length)];

    // Main tower
    const w = 3 + rand() * 3;
    const d = 3 + rand() * 3;
    const geo = new THREE.BoxGeometry(w, height, d);
    const mat = new THREE.MeshStandardMaterial({
      color: hullColor,
      roughness: 0.8,
    });
    const tower = new THREE.Mesh(geo, mat);
    tower.position.y = height / 2;
    tower.castShadow = true;
    group.add(tower);

    // Windows — emissive
    const winRows = Math.floor(height / 1.5);
    const winCols = Math.max(2, Math.floor(w / 1.2));
    const winGeo = new THREE.PlaneGeometry(0.4, 0.6);
    const windows = [];

    for (let r = 0; r < winRows; r++) {
      for (let c = 0; c < winCols; c++) {
        if (rand() > 0.35) continue; // not every window lit
        const winMat = new THREE.MeshBasicMaterial({
          color: 0xE1F5FE,
          transparent: true,
          opacity: 0.5 + rand() * 0.4,
        });
        const win = new THREE.Mesh(winGeo, winMat);
        const side = Math.floor(rand() * 4);
        const y = 1 + r * 1.5;
        const offset = (c - (winCols - 1) / 2) * 1.0;

        switch (side) {
          case 0:
            win.position.set(offset, y, d / 2 + 0.01);
            break;
          case 1:
            win.position.set(w / 2 + 0.01, y, offset);
            win.rotation.y = Math.PI / 2;
            break;
          case 2:
            win.position.set(offset, y, -d / 2 - 0.01);
            win.rotation.y = Math.PI;
            break;
          case 3:
            win.position.set(-w / 2 - 0.01, y, offset);
            win.rotation.y = -Math.PI / 2;
            break;
        }
        win.userData = { isWindow: true, baseOpacity: winMat.opacity, flickerPhase: rand() * Math.PI * 2 };
        group.add(win);
        windows.push(win);
      }
    }

    // OneAgent dish on roof
    const dishGroup = new THREE.Group();
    const dishBaseGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.3, 6);
    const dishBaseMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
    const dishBase = new THREE.Mesh(dishBaseGeo, dishBaseMat);
    dishBase.position.y = height + 0.15;
    dishGroup.add(dishBase);

    const dishGeo = new THREE.CylinderGeometry(0.6, 0.1, 0.15, 12);
    const dishMat = new THREE.MeshStandardMaterial({
      color: 0x666666,
      emissive: 0x00ff88,
      emissiveIntensity: 0.8,
    });
    const dish = new THREE.Mesh(dishGeo, dishMat);
    dish.position.y = height + 0.35;
    dish.rotation.x = rand() * 0.5;
    dishGroup.add(dish);

    // Blink light
    const lightGeo = new THREE.SphereGeometry(0.08, 6, 6);
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xff3333 });
    const light = new THREE.Mesh(lightGeo, lightMat);
    light.position.set(0.3, height + 0.5, 0.3);
    dishGroup.add(light);

    group.add(dishGroup);
    group.userData = {
      isBuilding: true,
      blinkPhase: rand() * Math.PI * 2,
      windows,
      dish,
      blinkLight: light,
      dishGroup,
    };

    this.buildings.push(group);
    return group;
  }

  update(delta, time) {
    for (const building of this.buildings) {
      const data = building.userData;
      if (!data) continue;

      // Blink light pulse (red)
      if (data.blinkLight) {
        const blinkSpeed = 2; // Hz
        const intensity = Math.sin(time * blinkSpeed + data.blinkPhase) > 0.5 ? 1 : 0.2;
        data.blinkLight.material.color.setHex(intensity > 0.5 ? 0xff3333 : 0x550000);
      }

      // Dish emissive pulse (green)
      if (data.dish) {
        data.dish.material.emissiveIntensity = 0.2 + Math.sin(time * 1.5 + data.blinkPhase) * 0.15;
        data.dish.rotation.y += delta * 0.3; // slowly rotate dish
      }

      // Window flicker
      for (const win of data.windows || []) {
        const flicker = Math.sin(time * 3 + win.userData.flickerPhase);
        if (flicker > 0.95) {
          // Brief flicker off
          win.material.opacity = win.userData.baseOpacity * 0.3;
        } else {
          win.material.opacity = win.userData.baseOpacity + Math.sin(time + win.userData.flickerPhase) * 0.1;
        }
      }
    }
  }
}
