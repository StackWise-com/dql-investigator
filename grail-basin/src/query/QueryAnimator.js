import * as THREE from 'three';
import { FilterEffect } from '../capsules/FilterEffect.js';
import { getCapsuleColor } from '../capsules/CapsuleTypes.js';

export class QueryAnimator {
  constructor(scene, capsuleManager, worldManager, camera) {
    this.scene = scene;
    this.capsuleManager = capsuleManager;
    this.worldManager = worldManager;
    this.camera = camera;
    this.filterEffect = new FilterEffect(scene);
    this.animations = [];
    this.tempMeshes = [];
  }

  update(delta, time) {
    this.filterEffect.update(delta);

    for (let i = this.animations.length - 1; i >= 0; i--) {
      const anim = this.animations[i];
      anim.elapsed += delta;
      if (anim.elapsed >= anim.duration) {
        anim.complete();
        this.animations.splice(i, 1);
      } else {
        anim.update(delta, anim.elapsed / anim.duration);
      }
    }

    // Animate temp meshes (columns, waveforms, etc.)
    for (let i = this.tempMeshes.length - 1; i >= 0; i--) {
      const m = this.tempMeshes[i];
      if (m.userData.life !== undefined) {
        m.userData.life -= delta;
        if (m.userData.life <= 0) {
          this.scene.remove(m);
          if (m.geometry) m.geometry.dispose();
          if (m.material) m.material.dispose();
          this.tempMeshes.splice(i, 1);
          continue;
        }
      }
      if (m.userData.animate) {
        m.userData.animate(delta, time);
      }
    }
  }

  trigger(op, stage, results, allResults) {
    switch (op) {
      case 'fetch':
        this.animateFetch(stage, results);
        break;
      case 'filter':
        this.animateFilter(stage, results, allResults);
        break;
      case 'summarize':
        this.animateSummarize(stage, results, allResults);
        break;
      case 'sort':
        this.animateSort(stage, results);
        break;
      case 'limit':
        this.animateLimit(stage, results);
        break;
      case 'parse':
        this.animateParse(stage, results);
        break;
      case 'fieldsAdd':
        this.animateFieldsAdd(stage, results);
        break;
      case 'fieldsRemove':
        this.animateFieldsRemove(stage, results);
        break;
      case 'makeTimeseries':
        this.animateTimeseries(stage, results);
        break;
      case 'lookup':
        this.animateLookup(stage, results);
        break;
      case 'join':
        this.animateJoin(stage, results);
        break;
    }
  }

  // ─── FETCH: Gate opens, capsules pour out ───
  animateFetch(stage, results) {
    const grail = this.worldManager.grail;
    grail.openGate();

    // Spawn capsules representing the fetched data
    this.capsuleManager.spawnFromResults(results);

    // Edge flash
    this.flashScreenEdge(0x00ffcc, 0.6);

    // After a while, close gate
    setTimeout(() => grail.closeGate(), 3000);
  }

  // ─── FILTER: Sieve drops, wrong capsules dissolve ───
  animateFilter(stage, results, allResults) {
    const filterLevel = stage.parsed?.value;
    this.capsuleManager.setFilter(filterLevel);

    // Sieve drop visual
    this.worldManager.analysisBank.dropSieve();

    // Screen shake + particle bursts for dissolving capsules
    document.body.classList.add('shake');
    setTimeout(() => document.body.classList.remove('shake'), 150);

    // Create dissolve bursts for non-matching capsules
    this.capsuleManager.active.forEach((c) => {
      if (filterLevel && c.userData.level !== filterLevel && c.userData.t > 0.3 && c.userData.t < 0.7) {
        setTimeout(() => {
          this.filterEffect.burst(c.position.clone(), getCapsuleColor(c.userData.level));
        }, 100 + Math.random() * 600);
      }
    });

    setTimeout(() => this.capsuleManager.clearFilter(), 2500);
  }

  // ─── SUMMARIZE: Capsules freeze, group into bar columns ───
  animateSummarize(stage, results, allResults) {
    this.capsuleManager.freeze();

    // Build columns
    const columns = results.map((r) => ({
      label: r.service || r[stage.groupBy[0]] || 'unknown',
      count: r.count || r['count()'] || 1,
    }));

    const maxCount = Math.max(...columns.map((c) => c.count), 1);

    // Remove old temp columns
    this.clearTempMeshes();

    columns.forEach((col, i) => {
      const h = Math.max(0.5, (col.count / maxCount) * 6);
      const colGeo = new THREE.BoxGeometry(1.2, h, 1.2);
      const colMat = new THREE.MeshStandardMaterial({
        color: 0x00d4ff,
        emissive: 0x00d4ff,
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.9,
      });
      const mesh = new THREE.Mesh(colGeo, colMat);
      const targetX = 22 + i * 2.5;
      const targetY = 1 + h / 2;
      mesh.position.set(targetX, -2, 10);
      mesh.userData = {
        animate: (delta, time) => {
          mesh.position.y += (targetY - mesh.position.y) * 4 * delta;
        },
      };
      this.scene.add(mesh);
      this.tempMeshes.push(mesh);

      // Label
      const labelGeo = new THREE.BoxGeometry(2, 0.05, 0.4);
      const labelMat = new THREE.MeshBasicMaterial({ color: 0x88ccff, transparent: true, opacity: 0.7 });
      const label = new THREE.Mesh(labelGeo, labelMat);
      label.position.set(targetX, targetY + h / 2 + 0.5, 10);
      this.scene.add(label);
      this.tempMeshes.push(label);

      // Value label
      if (col.count > 0) {
        // Small glowing sphere at top
        const topGeo = new THREE.SphereGeometry(0.15, 6, 6);
        const topMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const top = new THREE.Mesh(topGeo, topMat);
        top.position.set(targetX, targetY + h / 2 + 0.2, 10);
        this.scene.add(top);
        this.tempMeshes.push(top);
      }
    });

    // White flash from each group
    this.flashScreenEdge(0xffffff, 0.3);
  }

  // ─── SORT: Columns slide into order ───
  animateSort(stage, results) {
    const columns = results.map((r) => ({
      label: r.service || r[stage.field] || 'unknown',
      count: r.count || r['count()'] || 1,
    }));

    // Re-use existing temp meshes — animate them sliding
    const meshes = this.tempMeshes.filter((m) => m.geometry.type === 'BoxGeometry' && m.geometry.parameters.height > 1);
    meshes.forEach((mesh, i) => {
      const targetX = 22 + i * 2.5;
      const startX = mesh.position.x;
      let elapsed = 0;
      this.animations.push({
        duration: 0.8,
        elapsed: 0,
        update: (delta, t) => {
          elapsed += delta;
          const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // easeInOutQuad with overshoot
          mesh.position.x = startX + (targetX - startX) * ease;
        },
        complete: () => {
          mesh.position.x = targetX;
        },
      });
    });
  }

  // ─── LIMIT: Guillotine drops, excess falls ───
  animateLimit(stage, results) {
    this.worldManager.analysisBank.dropBlade();

    // Red flash
    this.flashScreenEdge(0xff3333, 0.4);

    const limit = stage.n;
    const meshes = this.tempMeshes.filter((m) => m.geometry.type === 'BoxGeometry' && m.geometry.parameters.height > 1);
    meshes.forEach((mesh, i) => {
      if (i >= limit) {
        // Fall into void
        this.animations.push({
          duration: 0.6,
          elapsed: 0,
          update: (delta, t) => {
            mesh.position.y -= delta * 8;
            mesh.rotation.x += delta * 2;
            mesh.rotation.z += delta * 1;
            mesh.material.opacity = Math.max(0, 1 - t * 1.5);
          },
          complete: () => {
            this.scene.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
          },
        });
      }
    });
  }

  // ─── PARSE: Glass chamber crack ───
  animateParse(stage, results) {
    const labPos = new THREE.Vector3(45, 2, 8);

    // 1. Capsule floats into the chamber
    const capsuleGeo = new THREE.SphereGeometry(0.3, 8, 8);
    const capsuleMat = new THREE.MeshStandardMaterial({
      color: 0x2196f3,
      emissive: 0x2196f3,
      emissiveIntensity: 0.5,
    });
    const capsule = new THREE.Mesh(capsuleGeo, capsuleMat);
    capsule.position.set(45, 0.5, 12);
    this.scene.add(capsule);
    this.tempMeshes.push(capsule);

    // Float into chamber
    let floatElapsed = 0;
    this.animations.push({
      duration: 0.8,
      elapsed: 0,
      update: (delta, t) => {
        floatElapsed += delta;
        capsule.position.z = 12 + (8 - 12) * t;
        capsule.position.y = 0.5 + Math.sin(t * Math.PI) * 1.5;
        capsule.rotation.y += delta * 2;
      },
      complete: () => {
        // 2. Crack open — capsule splits into two halves
        this.scene.remove(capsule);
        const halfGeo = new THREE.SphereGeometry(0.3, 8, 8, 0, Math.PI);
        const half1 = new THREE.Mesh(halfGeo, capsuleMat.clone());
        const half2 = new THREE.Mesh(halfGeo, capsuleMat.clone());
        half1.position.copy(labPos);
        half2.position.copy(labPos);
        half2.rotation.y = Math.PI;
        this.scene.add(half1);
        this.scene.add(half2);
        this.tempMeshes.push(half1, half2);

        // Halves fly apart
        this.animations.push({
          duration: 0.4,
          elapsed: 0,
          update: (d, t2) => {
            half1.position.x -= d * 2;
            half2.position.x += d * 2;
            half1.material.opacity = 1 - t2;
            half2.material.opacity = 1 - t2;
            half1.material.transparent = true;
            half2.material.transparent = true;
          },
          complete: () => {
            this.scene.remove(half1);
            this.scene.remove(half2);
            half1.geometry.dispose();
            half2.geometry.dispose();
          },
        });

        // 3. Field fragments fly into labeled slots
        const fields = ['level', 'service', 'responseTime', 'traceId'];
        const fieldColors = [0xff9800, 0x00d4ff, 0x4caf50, 0xffeb3b];
        fields.forEach((field, i) => {
          const fragGeo = new THREE.BoxGeometry(0.15, 0.15, 0.15);
          const fragMat = new THREE.MeshBasicMaterial({ color: fieldColors[i] });
          const frag = new THREE.Mesh(fragGeo, fragMat);
          frag.position.copy(labPos);
          this.scene.add(frag);
          this.tempMeshes.push(frag);

          // Target slot position
          const slotX = 42 + i * 2;
          const slotY = 0.5;
          const slotZ = 8;

          this.animations.push({
            duration: 0.8 + i * 0.1,
            elapsed: 0,
            update: (d2, t3) => {
              frag.position.lerpVectors(labPos, new THREE.Vector3(slotX, slotY, slotZ), t3);
              frag.rotation.x += d2 * 4;
              frag.rotation.y += d2 * 3;
            },
            complete: () => {
              // Glow at slot
              const slotGlowGeo = new THREE.RingGeometry(0.2, 0.3, 8);
              const slotGlowMat = new THREE.MeshBasicMaterial({
                color: fieldColors[i],
                transparent: true,
                opacity: 0.8,
                side: THREE.DoubleSide,
              });
              const slotGlow = new THREE.Mesh(slotGlowGeo, slotGlowMat);
              slotGlow.position.set(slotX, slotY, slotZ + 0.1);
              this.scene.add(slotGlow);
              this.tempMeshes.push(slotGlow);

              // Fade slot glow
              setTimeout(() => {
                slotGlow.material.opacity = 0;
              }, 500);
            },
          });
        });
      },
    });

    // Spectrum burst
    this.flashScreenEdge(0xffeb3b, 0.6);
  }

  // ─── FIELDSADD: Stamp brands capsules ───
  animateFieldsAdd(stage, results) {
    this.capsuleManager.active.forEach((c) => {
      if (c.userData.log && c.userData.log.isCritical !== undefined) {
        const color = c.userData.log.isCritical ? 0xff6b35 : 0x4caf50;
        c.material.emissive.setHex(color);
        c.material.emissiveIntensity = 0.8;

        // Create stamp ring
        const ringGeo = new THREE.RingGeometry(0.3, 0.4, 12);
        const ringMat = new THREE.MeshBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.8,
          side: THREE.DoubleSide,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.copy(c.position);
        ring.lookAt(this.camera.position);
        this.scene.add(ring);
        this.tempMeshes.push(ring);

        // Animate ring expanding and fading
        let elapsed = 0;
        this.animations.push({
          duration: 0.5,
          elapsed: 0,
          update: (delta, t) => {
            elapsed += delta;
            ring.scale.setScalar(1 + t * 2);
            ring.material.opacity = Math.max(0, 0.8 - t);
          },
          complete: () => {
            this.scene.remove(ring);
            ring.geometry.dispose();
            ring.material.dispose();
          },
        });
      }
    });
  }

  // ─── MAKETIMESERIES: Waveform draws itself ───
  animateTimeseries(stage, results) {
    this.capsuleManager.resume();
    this.clearTempMeshes();

    if (!results.length) return;

    const maxCount = Math.max(...results.map((r) => r.count || 0), 1);

    // Draw waveform as a line of connected capsules
    const points = results.map((r, i) => {
      const x = 22 + (i / Math.max(results.length - 1, 1)) * 20;
      const y = 1 + (r.count / maxCount) * 4;
      return new THREE.Vector3(x, y, 10);
    });

    // Line
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x00ffcc, linewidth: 2 });
    const line = new THREE.Line(lineGeo, lineMat);
    this.scene.add(line);
    this.tempMeshes.push(line);

    // Data points (glowing spheres)
    points.forEach((pt, i) => {
      const sphereGeo = new THREE.SphereGeometry(0.15, 6, 6);
      const sphereMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      sphere.position.copy(pt);
      sphere.userData = {
        animate: (delta, time) => {
          sphere.material.opacity = 0.7 + Math.sin(time * 3 + i) * 0.3;
        },
      };
      this.scene.add(sphere);
      this.tempMeshes.push(sphere);
    });

    // ECG-style sweep animation
    let sweepProgress = 0;
    this.animations.push({
      duration: 1.5,
      elapsed: 0,
      update: (delta, t) => {
        sweepProgress = t;
        // Could reveal line progressively
      },
      complete: () => {},
    });
  }

  // ─── FIELDSREMOVE: Fields fade away ───
  animateFieldsRemove(stage, results) {
    const fieldsToRemove = stage.fields || [];
    // Create fading field labels above capsules
    this.capsuleManager.active.forEach((c) => {
      if (!c.userData.log) return;
      fieldsToRemove.forEach((field) => {
        if (c.userData.log[field] !== undefined) {
          // Spawn a fading text-like particle
          const fragGeo = new THREE.BoxGeometry(0.2, 0.05, 0.05);
          const fragMat = new THREE.MeshBasicMaterial({
            color: 0xff3333,
            transparent: true,
            opacity: 0.8,
          });
          const frag = new THREE.Mesh(fragGeo, fragMat);
          frag.position.copy(c.position);
          frag.position.y += 0.5;
          this.scene.add(frag);
          this.tempMeshes.push(frag);

          this.animations.push({
            duration: 0.6,
            elapsed: 0,
            update: (delta, t) => {
              frag.position.y += delta * 1.5;
              frag.material.opacity = Math.max(0, 0.8 - t * 1.5);
              frag.rotation.z += delta * 2;
            },
            complete: () => {
              this.scene.remove(frag);
              frag.geometry.dispose();
              frag.material.dispose();
            },
          });
        }
      });
    });
  }

  // ─── LOOKUP: Data merge visual ───
  animateLookup(stage, results) {
    // Create merging data streams
    const mergePos = new THREE.Vector3(20, 2, 0);
    for (let i = 0; i < 8; i++) {
      const streamGeo = new THREE.SphereGeometry(0.1, 6, 6);
      const streamMat = new THREE.MeshBasicMaterial({
        color: 0x9c27b0,
        transparent: true,
        opacity: 0.8,
      });
      const stream = new THREE.Mesh(streamGeo, streamMat);
      const startX = i < 4 ? 15 : 25;
      stream.position.set(startX, 2 + (i % 4) * 0.5, 0);
      this.scene.add(stream);
      this.tempMeshes.push(stream);

      this.animations.push({
        duration: 0.8,
        elapsed: 0,
        update: (delta, t) => {
          stream.position.lerpVectors(
            new THREE.Vector3(startX, 2 + (i % 4) * 0.5, 0),
            mergePos,
            t
          );
          stream.scale.setScalar(1 + t * 0.5);
        },
        complete: () => {
          stream.material.opacity = 0;
        },
      });
    }

    // Merge glow
    const glowGeo = new THREE.RingGeometry(0.3, 0.5, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x9c27b0,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.copy(mergePos);
    glow.lookAt(this.camera.position);
    this.scene.add(glow);
    this.tempMeshes.push(glow);

    this.animations.push({
      duration: 0.5,
      elapsed: 0,
      update: (delta, t) => {
        glow.scale.setScalar(1 + t * 2);
        glow.material.opacity = Math.max(0, 0.6 - t * 0.6);
      },
      complete: () => {},
    });
  }

  // ─── JOIN: Two rivers merge at confluence ───
  animateJoin(stage, results) {
    const confluencePos = new THREE.Vector3(0, 0.2, 0);

    // Two streams approaching
    for (let side = -1; side <= 1; side += 2) {
      for (let i = 0; i < 5; i++) {
        const dropGeo = new THREE.SphereGeometry(0.12, 6, 6);
        const dropMat = new THREE.MeshBasicMaterial({
          color: side === -1 ? 0x00d4ff : 0x00ffcc,
          transparent: true,
          opacity: 0.9,
        });
        const drop = new THREE.Mesh(dropGeo, dropMat);
        const startX = side * 10;
        drop.position.set(startX, 0.5, -5 + i * 2);
        this.scene.add(drop);
        this.tempMeshes.push(drop);

        this.animations.push({
          duration: 1.0,
          elapsed: 0,
          update: (delta, t) => {
            drop.position.lerpVectors(
              new THREE.Vector3(startX, 0.5, -5 + i * 2),
              confluencePos,
              t
            );
            drop.scale.setScalar(1 + Math.sin(t * Math.PI) * 0.5);
          },
          complete: () => {
            drop.material.opacity = 0;
          },
        });
      }
    }

    // Confluence splash
    const splashGeo = new THREE.RingGeometry(0.2, 0.6, 16);
    const splashMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
    const splash = new THREE.Mesh(splashGeo, splashMat);
    splash.position.copy(confluencePos);
    splash.rotation.x = -Math.PI / 2;
    this.scene.add(splash);
    this.tempMeshes.push(splash);

    this.animations.push({
      duration: 0.6,
      elapsed: 0,
      update: (delta, t) => {
        splash.scale.setScalar(1 + t * 4);
        splash.material.opacity = Math.max(0, 0.8 - t * 1.2);
      },
      complete: () => {},
    });
  }

  // ─── HELPERS ───
  flashScreenEdge(colorHex, duration) {
    const div = document.createElement('div');
    div.style.cssText = `
      position: fixed; inset: 0; pointer-events: none; z-index: 999;
      box-shadow: inset 0 0 80px ${new THREE.Color(colorHex).getStyle()};
      opacity: 0.6; transition: opacity ${duration}s ease;
    `;
    document.body.appendChild(div);
    requestAnimationFrame(() => {
      div.style.opacity = '0';
    });
    setTimeout(() => div.remove(), duration * 1000 + 100);
  }

  clearTempMeshes() {
    for (const m of this.tempMeshes) {
      this.scene.remove(m);
      if (m.geometry) m.geometry.dispose();
      if (m.material) m.material.dispose();
    }
    this.tempMeshes = [];
  }

  addAnimation(duration, updateFn, completeFn) {
    this.animations.push({ duration, elapsed: 0, update: updateFn, complete: completeFn });
  }
}
