import * as THREE from 'three';
import { CameraController } from './camera/CameraController.js';
import { Atmosphere } from './world/Atmosphere.js';
import { WorldManager } from './world/WorldManager.js';
import { CapsuleManager } from './capsules/CapsuleManager.js';
import { QueryParser } from './query/QueryParser.js';
import { QueryExecutor } from './query/QueryExecutor.js';
import { QueryAnimator } from './query/QueryAnimator.js';
import { generateLogs } from './query/MockData.js';
import { ChallengeSystem } from './ui/ChallengeSystem.js';
import { HUD } from './ui/HUD.js';
import { QueryLab } from './ui/QueryLab.js';
import { ResultsPanel } from './ui/ResultsPanel.js';
import { PipelineVis } from './ui/PipelineVis.js';
import { Tooltip } from './ui/Tooltip.js';
import { Smartscape } from './world/Smartscape.js';
import { setupPostProcessing } from './post/PostProcessing.js';

// Global state
const state = {
  isPlaying: false,
  xp: 0,
  currentChallenge: 0,
  queryRunning: false,
  logs: generateLogs(2000),
  cameraTarget: new THREE.Vector3(0, 0, 0),
};

// Scene setup
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf5f5f5);

const camera = new THREE.PerspectiveCamera(
  40,
  window.innerWidth / window.innerHeight,
  0.1,
  500
);
camera.position.set(0, 12, 30);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance',
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

// Post-processing disabled for cleaner look
// const { composer } = setupPostProcessing(renderer, scene, camera);

// Lighting — bright factory
const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0xffffff, 0xe0e0e0, 0.8);
scene.add(hemiLight);

const sunLight = new THREE.DirectionalLight(0xfff0dd, 1.4);
sunLight.position.set(20, 50, 20);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
scene.add(sunLight);

// Fill light from front
const fillLight = new THREE.DirectionalLight(0xffffff, 0.6);
fillLight.position.set(-10, 30, 30);
scene.add(fillLight);

// World subsystems
const atmosphere = new Atmosphere(scene);
const worldManager = new WorldManager(scene);
const capsuleManager = new CapsuleManager(scene, worldManager.getRiverCurve());
const cameraController = new CameraController(camera, renderer.domElement, state);

// Query systems
const queryParser = new QueryParser();
const queryExecutor = new QueryExecutor(state.logs);
const queryAnimator = new QueryAnimator(scene, capsuleManager, worldManager, camera);

// UI systems
const hud = new HUD(state);
const queryLab = new QueryLab(state, runQuery);
const resultsPanel = new ResultsPanel();
const pipelineVis = new PipelineVis();
const challengeSystem = new ChallengeSystem(state, (solution) => {
  queryLab.setQuery(solution);
});
const tooltip = new Tooltip();
const smartscape = new Smartscape(scene);
smartscape.bindClick(renderer.domElement, camera);

// Smartscape node click → swoop to service building
window.addEventListener('smartscapeclick', (e) => {
  const pos = e.detail.position;
  cameraController.swoopTo(pos.x, 0, pos.z, 'basin');
  smartscape.hide();
  // Update active tab
  document.querySelectorAll('.zone-tab').forEach((t) => t.classList.remove('active'));
  document.querySelector('[data-zone="basin"]').classList.add('active');
});

// Zone change → camera move + smartscape toggle
window.addEventListener('zonechange', (e) => {
  const zone = e.detail.zone;
  cameraController.moveToZone(zone);
  if (zone === 'smartscape') {
    smartscape.show();
  } else {
    smartscape.hide();
  }
});

// Splash screen
const splash = document.getElementById('splash-screen');
const enterBtn = document.getElementById('enter-basin');

enterBtn.addEventListener('click', () => {
  splash.classList.add('fade-out');
  setTimeout(() => {
    splash.style.display = 'none';
    state.isPlaying = true;
    hud.show();
    queryLab.show();
    resultsPanel.show();
    pipelineVis.show();
    challengeSystem.show();
    document.getElementById('log-legend').classList.remove('hidden');

    // Start camera intro
    cameraController.startIntro();

    // Welcome notification
    challengeSystem.showNotification('Welcome. Type "fetch logs" to begin.');
  }, 800);
});

// Run query handler
async function runQuery(rawQuery) {
  if (state.queryRunning) return;
  state.queryRunning = true;

  try {
    const stages = queryParser.parse(rawQuery);
    pipelineVis.setStages(stages);

    // Execute and animate
    const results = await queryExecutor.execute(stages, (stage, index, stageResult, allResults) => {
      pipelineVis.updateCount(index, stageResult.length);
      queryAnimator.trigger(stage.op, stage, stageResult, allResults);
    });

    resultsPanel.showResults(results, stages);

    // Check challenge completion
    const completed = challengeSystem.checkSolution(rawQuery);
    if (completed) {
      hud.addXP(completed.xp);
    }
  } catch (err) {
    console.error('Query error:', err);
    resultsPanel.showError(err.message);
  } finally {
    state.queryRunning = false;
  }
}

// FPS counter
const fpsEl = document.createElement('div');
fpsEl.style.cssText = `
  position: fixed; top: 3rem; right: 1rem; z-index: 100;
  font-family: var(--font-mono); font-size: 0.7rem;
  color: var(--text-dim); pointer-events: none;
`;
document.body.appendChild(fpsEl);
let frameCount = 0;
let lastFpsTime = performance.now();

// Render loop
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const time = clock.getElapsedTime();

  // FPS
  frameCount++;
  const now = performance.now();
  if (now - lastFpsTime >= 1000) {
    fpsEl.textContent = `${frameCount} fps`;
    frameCount = 0;
    lastFpsTime = now;
  }

  if (state.isPlaying) {
    cameraController.update(delta);
    worldManager.update(camera.position, delta, time);
    capsuleManager.update(delta, time);
    atmosphere.update(delta, time);
    queryAnimator.update(delta, time);
    smartscape.update(delta, time);
    checkIntersections();
  }

  renderer.render(scene, camera);
}

animate();

// Raycaster for hover tooltips
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(-1, -1);

renderer.domElement.addEventListener('mousemove', (e) => {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
});

renderer.domElement.addEventListener('mouseleave', () => {
  mouse.set(-1, -1);
  tooltip.hide();
});

function checkIntersections() {
  if (!state.isPlaying) return;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);

  let found = false;
  for (const hit of intersects) {
    const obj = hit.object;
    // Convert 3D point to screen coordinates
    const vec = hit.point.clone();
    vec.project(camera);
    const x = (vec.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-(vec.y * 0.5) + 0.5) * window.innerHeight;

    if (obj.userData.isSmartscapeNode) {
      tooltip.show(`Service: ${obj.userData.service}`, x, y);
      found = true;
      break;
    }
    if (obj.parent && obj.parent.userData.isBuilding) {
      tooltip.show('Service Building — OneAgent active', x, y);
      found = true;
      break;
    }
  }
  if (!found) tooltip.hide();
}

// Resize handler
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  // composer.setSize(window.innerWidth, window.innerHeight);
});
