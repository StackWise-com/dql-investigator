// VortexScene.tsx — Complete Three.js Rendering Engine
//
// Everything rendered via WebGL:
//   • Particle vortex  (perspective scene + bloom)
//   • Golden Snitch    (perspective scene)
//   • ALL UI panels    (orthographic HUD scene, CanvasTexture planes)
//
// One HTML element: <input type="text"> for DQL query entry.
// All button clicks detected via raycasting into the HUD scene.
// Store state drives panel redraws via useScenarioStore.subscribe().

import { useEffect, useRef, useState, useCallback, type KeyboardEvent } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass }     from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass }     from "three/examples/jsm/postprocessing/OutputPass.js";
import { useScenarioStore } from "../../stores/scenarioStore";
import {
  DRAW_SCALE, P,
  drawTerminal,
  drawHeader,
  drawClueCard,
  drawSnitchHint,
  drawResultPanel,
  drawEvidenceBoard,
  drawHintModal,
  drawStoryCard,
  drawVictory,
  drawSelector,
} from "./hudPanels";
import type {
  BtnArea, TerminalState, ClueState, EvidStep,
  HintModalState, StoryState, VictoryState,
} from "./hudPanels";

// ── Log level buckets (particles) ─────────────────────────────────────────────

const LOG_LEVEL_BUCKETS = [
  { key:"EMERGENCY", color:new THREE.Color(0xff00ff), count:150 },
  { key:"ALERT",     color:new THREE.Color(0xcc0044), count:200 },
  { key:"CRITICAL",  color:new THREE.Color(0xff2200), count:350 },
  { key:"SEVERE",    color:new THREE.Color(0xff5500), count:400 },
  { key:"ERROR",     color:new THREE.Color(0xff8800), count:600 },
  { key:"WARN",      color:new THREE.Color(0xffcc00), count:750 },
  { key:"NOTICE",    color:new THREE.Color(0x00ccaa), count:500 },
  { key:"INFO",      color:new THREE.Color(0x3399ff), count:850 },
  { key:"DEBUG",     color:new THREE.Color(0x888888), count:200 },
] as const;

const TOTAL_PARTICLES = LOG_LEVEL_BUCKETS.reduce((s,b) => s + b.count, 0);

// ── Types ─────────────────────────────────────────────────────────────────────

interface ParticleState {
  targetX:number; targetY:number; targetZ:number;
  targetScale:number; color:THREE.Color; logLevel:string; active:boolean;
}

interface HUDPanel {
  canvas: HTMLCanvasElement;
  ctx:    CanvasRenderingContext2D;
  texture:THREE.CanvasTexture;
  mesh:   THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  w: number; h: number;   // logical CSS px
}

// ── Particle position helpers ─────────────────────────────────────────────────

function toroid(i:number, total:number):[number,number,number] {
  const θ = (i/total)*Math.PI*2 + Math.random()*0.4;
  const φ = Math.random()*Math.PI*2;
  const r = 35 + 18*Math.cos(φ) + (Math.random()-0.5)*10;
  return [r*Math.cos(θ)+(Math.random()-0.5)*8, 15*Math.sin(φ)+(Math.random()-0.5)*6, r*Math.sin(θ)+(Math.random()-0.5)*8];
}

function scatter():[number,number,number] {
  const a = Math.random()*Math.PI*2, d = 120+Math.random()*80;
  return [Math.cos(a)*d, (Math.random()-0.5)*100, Math.sin(a)*d];
}

function cluster(idx:number, total:number, spread=6):[number,number,number] {
  const a = (idx/total)*Math.PI*2, r=30;
  return [Math.cos(a)*r+(Math.random()-0.5)*spread, -20+idx*(40/total)+(Math.random()-0.5)*spread, Math.sin(a)*r+(Math.random()-0.5)*spread];
}

// ── HUD panel factory ─────────────────────────────────────────────────────────

function makePanel(w:number, h:number): HUDPanel {
  const canvas = document.createElement("canvas");
  canvas.width  = Math.round(w * DRAW_SCALE);
  canvas.height = Math.round(h * DRAW_SCALE);
  const ctx = canvas.getContext("2d")!;
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map:texture, transparent:true, depthTest:false, depthWrite:false })
  );
  mesh.visible = false;
  return { canvas, ctx, texture, mesh, w, h };
}

function freePanel(panel:HUDPanel) {
  panel.mesh.geometry.dispose();
  panel.mesh.material.dispose();
  panel.texture.dispose();
}

function dirty(p:HUDPanel) { p.texture.needsUpdate = true; }

// ── Component ─────────────────────────────────────────────────────────────────

interface Props { onBackToMenu: () => void }

export function VortexScene({ onBackToMenu }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);

  // Input state (also in a ref so Three.js closure can read it without re-render)
  const [inputValue, setInputValue]   = useState("");
  const inputRef2 = useRef("");

  // HTML input position (updated after each terminal redraw)
  const [inputRect, setInputRect] = useState({ x:36, y:0, w:500, h:28 });

  // Query history
  const histRef    = useRef<string[]>([]);
  const histIdxRef = useRef(-1);

  // Callbacks the Three.js setup stores for React to call
  const redrawTerminalCb = useRef<(() => void) | null>(null);

  // ── Input handlers ────────────────────────────────────────────────────────

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setInputValue(v);
    inputRef2.current = v;
    histIdxRef.current = -1;
    redrawTerminalCb.current?.();
    useScenarioStore.getState().hideResultPanel();
  }, []);

  const handleExecute = useCallback(() => {
    const q = inputRef2.current.trim();
    if (!q) return;
    histRef.current = [q, ...histRef.current.slice(0, 49)];
    histIdxRef.current = -1;
    useScenarioStore.getState().executeQuery(q);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); handleExecute(); return; }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.min(histIdxRef.current + 1, histRef.current.length - 1);
      histIdxRef.current = next;
      const v = histRef.current[next] ?? "";
      setInputValue(v); inputRef2.current = v;
      redrawTerminalCb.current?.();
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = Math.max(histIdxRef.current - 1, -1);
      histIdxRef.current = next;
      const v = next === -1 ? "" : histRef.current[next] ?? "";
      setInputValue(v); inputRef2.current = v;
      redrawTerminalCb.current?.();
    }
  }, [handleExecute]);

  // ── Main Three.js setup ───────────────────────────────────────────────────

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let w = container.clientWidth;
    let h = container.clientHeight;

    // ── 3D scene (particles + snitch) ─────────────────────────────────────

    const scene  = new THREE.Scene();
    scene.background = new THREE.Color(0x080812);
    scene.fog = new THREE.FogExp2(0x080812, 0.004);

    const camera = new THREE.PerspectiveCamera(55, w/h, 0.1, 800);
    camera.position.set(0, 40, 120);
    camera.lookAt(0,0,0);

    const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:false });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.NoToneMapping;
    container.appendChild(renderer.domElement);

    // Bloom
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(w,h), 0.7, 0.5, 0.6));
    composer.addPass(new OutputPass());

    // Lighting
    scene.add(new THREE.AmbientLight(0x334466, 1.2));
    const dl = new THREE.DirectionalLight(0x8899ff, 0.6);
    dl.position.set(60,100,60); scene.add(dl);
    const pl = new THREE.PointLight(0x4466ff, 1.5, 200);
    pl.position.set(0,20,0); scene.add(pl);

    // Particles
    const geo = new THREE.BoxGeometry(1.8, 1.0, 0.2);
    const meshMap = new Map<string, THREE.InstancedMesh>();
    const dummy = new THREE.Object3D();
    const particles: ParticleState[] = [];

    for (const b of LOG_LEVEL_BUCKETS) {
      const mat = new THREE.MeshStandardMaterial({ color:b.color, emissive:b.color, emissiveIntensity:0.4, metalness:0.1, roughness:0.6 });
      const im = new THREE.InstancedMesh(geo, mat, b.count);
      im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      scene.add(im); meshMap.set(b.key, im);
    }

    let gIdx = 0;
    for (const b of LOG_LEVEL_BUCKETS) {
      for (let i=0; i<b.count; i++) {
        const [x,y2,z] = toroid(gIdx, TOTAL_PARTICLES);
        particles.push({ targetX:x, targetY:y2, targetZ:z, targetScale:0.25, color:b.color, logLevel:b.key, active:true });
        dummy.position.set(x,y2,z); dummy.scale.setScalar(0.25); dummy.updateMatrix();
        meshMap.get(b.key)!.setMatrixAt(i, dummy.matrix);
        gIdx++;
      }
      meshMap.get(b.key)!.instanceMatrix.needsUpdate = true;
    }

    // Golden Snitch
    const snitchGroup = new THREE.Group();
    const snitchMesh  = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.5,0),
      new THREE.MeshStandardMaterial({ color:0xffd700, emissive:0xffaa00, emissiveIntensity:1.4, metalness:0.9, roughness:0.1 })
    );
    snitchGroup.add(snitchMesh);
    const wingGeo = new THREE.BoxGeometry(3.5, 0.06, 1.8);
    const wingMat = new THREE.MeshStandardMaterial({ color:0xffffaa, emissive:0xffdd00, emissiveIntensity:1.0, transparent:true, opacity:0.75 });
    const wL = new THREE.Mesh(wingGeo, wingMat); wL.position.set(-2.5,0,0);
    const wR = new THREE.Mesh(wingGeo, wingMat); wR.position.set( 2.5,0,0);
    snitchGroup.add(wL, wR);
    scene.add(snitchGroup);

    const snitchSolvedRef    = { current:false };
    const snitchHintRef      = { current:false };
    const snitchHintTimer    = { current:0 };
    const snitchTarget       = new THREE.Vector3(0,0,80);

    // ── HUD scene (orthographic) ───────────────────────────────────────────

    const hudScene  = new THREE.Scene();
    const hudCamera = new THREE.OrthographicCamera(-w/2, w/2, h/2, -h/2, -1, 1);

    // Backdrop (modal dimmer — full screen)
    const backdropMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color:0x000000, transparent:true, opacity:0.68, depthTest:false })
    );
    backdropMesh.visible = false;
    hudScene.add(backdropMesh);

    // Create all panels
    const termPanel    = makePanel(w, P.TERM_H);
    const headerPanel  = makePanel(P.HEADER_W, P.HEADER_H);
    const cluePanel    = makePanel(P.CLUE_W, P.CLUE_H);
    const snitchPanel  = makePanel(P.SNITCH_W, P.SNITCH_H);
    const resultPanel  = makePanel(P.RESULT_W, P.RESULT_H);
    const evidPanel    = makePanel(P.EVID_W, P.EVID_H);
    const hintPanel    = makePanel(P.HINT_W, P.HINT_H);
    const storyPanel   = makePanel(P.STORY_W, P.STORY_H);
    const victoryPanel = makePanel(P.VICTORY_W, P.VICTORY_H);
    const selectorPanel= makePanel(w, h);  // full screen

    const allPanels = [termPanel, headerPanel, cluePanel, snitchPanel, resultPanel,
                       evidPanel, hintPanel, storyPanel, victoryPanel, selectorPanel];
    for (const p of allPanels) hudScene.add(p.mesh);

    // Panel positions (in ortho space, Y-up, center = 0,0)
    function positionPanels() {
      // Terminal: bottom strip
      termPanel.mesh.position.set(0, -h/2 + P.TERM_H/2, 0);

      // Header: top center
      headerPanel.mesh.position.set(0, h/2 - P.HEADER_H/2 - 8, 0.1);

      // Clue: top right
      cluePanel.mesh.position.set(w/2 - P.CLUE_W/2 - 12, h/2 - P.CLUE_H/2 - 8, 0.2);

      // Snitch hint: top center below header
      snitchPanel.mesh.position.set(0, h/2 - P.HEADER_H - P.SNITCH_H/2 - 16, 0.15);

      // Result: bottom right (above terminal)
      resultPanel.mesh.position.set(w/2 - P.RESULT_W/2 - 12, -h/2 + P.TERM_H + P.RESULT_H/2 + 12, 0.2);

      // Evidence: top left
      evidPanel.mesh.position.set(-w/2 + P.EVID_W/2 + 12, h/2 - P.EVID_H/2 - 8, 0.2);

      // Modal panels: center
      for (const p of [hintPanel, storyPanel, victoryPanel]) {
        p.mesh.position.set(0, 0, 0.3);
      }

      // Selector: full screen (slightly in front of backdrop)
      selectorPanel.mesh.position.set(0, 0, 0.2);

      // Backdrop: behind modal panels
      backdropMesh.position.set(0, 0, 0.25);
    }
    positionPanels();

    // Button registry — rebuilt each time we redraw interactive panels
    type BtnEntry = BtnArea & { panel: HUDPanel; action: () => void };
    const buttonRegistry: BtnEntry[] = [];

    function registerButtons(panel: HUDPanel, areas: BtnArea[], actionMap: Record<string, (() => void) | undefined>) {
      // Remove old entries for this panel
      for (let i = buttonRegistry.length-1; i>=0; i--) {
        if (buttonRegistry[i].panel === panel) buttonRegistry.splice(i,1);
      }
      for (const a of areas) {
        const action = actionMap[a.id];
        if (action) buttonRegistry.push({ ...a, panel, action });
      }
    }

    // ── Draw all panels from store state ──────────────────────────────────

    function getStoreState() { return useScenarioStore.getState(); }

    function redrawAll() {
      const s = getStoreState();
      const scen = s.scenarios[s.currentScenarioIndex];
      const step = scen?.steps[s.currentStepIndex];
      const isSelecting = !s.activeVariant;
      const stepsSolved = s.stepsCompleted.filter(k => Math.floor(k/100) === s.currentScenarioIndex).length;

      // Selector
      selectorPanel.mesh.visible = isSelecting;
      if (isSelecting) {
        const areas = drawSelector(selectorPanel.ctx, w, h, { scenarios: s.scenarios, scenariosCompleted: s.scenariosCompleted, totalXP: s.totalXP });
        dirty(selectorPanel);
        registerButtons(selectorPanel, areas, Object.fromEntries(s.scenarios.map((_, i) => [`select-${i}`, () => s.selectScenario(i)])));
      }

      // Terminal (always visible when not selecting)
      termPanel.mesh.visible = !isSelecting;
      if (!isSelecting) {
        const tstate: TerminalState = {
          totalSteps: scen?.steps.length ?? 0,
          currentStepIndex: s.currentStepIndex,
          stepsSolved,
          totalXP: s.totalXP,
          scenarioTitle: scen?.title ?? '',
          scenarioStars: scen?.stars ?? '',
          narration: step?.narration ?? '',
          activeVariant: s.activeVariant,
          lastValidation: s.lastValidation,
          cluesUsedThisStep: s.cluesUsedThisStep,
          xpPerHint: step?.xpPerHint ?? 25,
          hasMockResult: !!s.mockResult,
        };
        const areas = drawTerminal(termPanel.ctx, w, tstate, inputRef2.current);
        dirty(termPanel);
        // Extract input area for HTML input positioning
        const inp = areas.find(a => a.id === '__input__');
        if (inp) {
          // Convert from logical canvas coords (within terminal panel which is at bottom)
          // Panel top-left in screen px: x=0, y = screenH - TERM_H
          const screenY = h - P.TERM_H + inp.y;
          setInputRect({ x: inp.x, y: screenY, w: inp.w, h: inp.h });
        }
        registerButtons(termPanel, areas, {
          execute: () => { handleExecute(); },
          clue:    () => { if (s.cluesUsedThisStep < 3) s.requestClue(); },
          clr:     () => { setInputValue(''); inputRef2.current = ''; redrawTerminalCb.current?.(); s.hideResultPanel(); },
        });
      }

      // Scenario header
      headerPanel.mesh.visible = !isSelecting && !!scen;
      if (!isSelecting && scen) {
        drawHeader(headerPanel.ctx, scen.title, s.activeVariant ? String(s.activeVariant.companyName) : '');
        dirty(headerPanel);
      }

      // Evidence board
      const completed = s.stepsCompleted.filter(k => Math.floor(k/100) === s.currentScenarioIndex);
      evidPanel.mesh.visible = !isSelecting && completed.length > 0;
      if (!isSelecting && completed.length > 0 && scen) {
        const steps: EvidStep[] = completed.map(key => {
          const si = key % 100;
          const st = scen.steps[si];
          return { idx:si, title:`Step ${si+1}`, expanded:false, preview: st ? st.storyExplanation.slice(0,100) : '' };
        });
        const areas = drawEvidenceBoard(evidPanel.ctx, steps);
        dirty(evidPanel);
        registerButtons(evidPanel, areas, {}); // toggle not implemented (visual only for now)
      }

      // Clue card
      cluePanel.mesh.visible = !isSelecting && s.showClue;
      if (!isSelecting && s.showClue && step) {
        const cs: ClueState = { clueLevel:s.activeClueLevel, cluesUsed:s.cluesUsedThisStep, step };
        const areas = drawClueCard(cluePanel.ctx, cs);
        dirty(cluePanel);
        registerButtons(cluePanel, areas, { 'dismiss-clue': () => s.dismissClue() });
      }

      // Snitch hint
      snitchPanel.mesh.visible = !isSelecting && s.showSnitchHint;
      if (!isSelecting && s.showSnitchHint) {
        const areas = drawSnitchHint(snitchPanel.ctx, s.snitchHintMessage, 1.0);
        dirty(snitchPanel);
        registerButtons(snitchPanel, areas, { 'dismiss-snitch': () => s.dismissSnitchHint() });
      }

      // Result panel
      resultPanel.mesh.visible = !isSelecting && s.showResultPanel && !!s.mockResult && !s.showStoryCard && !s.showScenarioVictory;
      if (!isSelecting && s.showResultPanel && s.mockResult && !s.showStoryCard && !s.showScenarioVictory) {
        const areas = drawResultPanel(resultPanel.ctx, s.mockResult);
        dirty(resultPanel);
        registerButtons(resultPanel, areas, { 'dismiss-result': () => s.hideResultPanel() });
      }

      // Backdrop (shown with modals)
      const hasModal = s.showHintModal || s.showStoryCard || s.showScenarioVictory;
      backdropMesh.visible = hasModal;
      // Resize backdrop if needed
      if (backdropMesh.geometry) {
        backdropMesh.geometry.dispose();
        (backdropMesh.geometry as THREE.PlaneGeometry) = new THREE.PlaneGeometry(w, h);
      }

      // Hint modal
      hintPanel.mesh.visible = !isSelecting && s.showHintModal;
      if (!isSelecting && s.showHintModal && step) {
        const hms: HintModalState = { xpPerHint: step.xpPerHint, baseXP: step.baseXP, cluesUsedThisStep: s.cluesUsedThisStep };
        const areas = drawHintModal(hintPanel.ctx, hms);
        dirty(hintPanel);
        registerButtons(hintPanel, areas, {
          'confirm-clue': () => s.confirmClue(),
          'dismiss-hint': () => useScenarioStore.setState({ showHintModal:false }),
        });
      }

      // Story card
      storyPanel.mesh.visible = !isSelecting && s.showStoryCard;
      if (!isSelecting && s.showStoryCard && step) {
        const stepsSolvedHere = s.stepsCompleted.filter(k => Math.floor(k/100) === s.currentScenarioIndex).length;
        const penaltyXP = s.cluesUsedThisStep > 0
          ? Math.round(step.baseXP) - Math.round(step.baseXP * [1.0,0.75,0.5,0.25][Math.min(s.cluesUsedThisStep,3)])
          : 0;
        const ss: StoryState = {
          stepIndex: s.currentStepIndex,
          scenarioTitle: scen?.title ?? '',
          storyExplanation: step.storyExplanation,
          dqlLesson: step.dqlLesson,
          commandsShown: step.commandsShown,
          xpEarned: s.floatingXPValue,
          penaltyXP,
          isLastStep: s.currentStepIndex === (scen?.steps.length ?? 1) - 1,
          activeVariant: s.activeVariant,
        };
        void stepsSolvedHere;
        const areas = drawStoryCard(storyPanel.ctx, ss);
        dirty(storyPanel);
        registerButtons(storyPanel, areas, { 'advance': () => s.advanceStep() });
      }

      // Scenario victory
      victoryPanel.mesh.visible = !isSelecting && s.showScenarioVictory;
      if (!isSelecting && s.showScenarioVictory && scen) {
        const vs: VictoryState = {
          scenarioTitle: scen.title,
          companyName: s.activeVariant ? String(s.activeVariant.companyName) : '',
          rootCause: scen.rootCause,
          totalXP: s.totalXP,
          stepsCount: scen.steps.length,
          stepsCompleted: s.stepsCompleted.filter(k => Math.floor(k/100) === s.currentScenarioIndex).length,
          commandsUnlocked: s.unlockedCommands,
          activeVariant: s.activeVariant,
        };
        const areas = drawVictory(victoryPanel.ctx, vs);
        dirty(victoryPanel);
        registerButtons(victoryPanel, areas, {
          'more-scenarios': () => { s.dismissScenarioVictory(); },
          'main-menu': () => { s.dismissScenarioVictory(); onBackToMenu(); },
        });
      }
    }

    // Store the redraw terminal callback so React input onChange can call it
    redrawTerminalCb.current = () => {
      const s = getStoreState();
      const scen = s.scenarios[s.currentScenarioIndex];
      const step = scen?.steps[s.currentStepIndex];
      const stepsSolved = s.stepsCompleted.filter(k => Math.floor(k/100) === s.currentScenarioIndex).length;
      const tstate: TerminalState = {
        totalSteps: scen?.steps.length ?? 0, currentStepIndex: s.currentStepIndex,
        stepsSolved, totalXP: s.totalXP,
        scenarioTitle: scen?.title ?? '', scenarioStars: scen?.stars ?? '',
        narration: step?.narration ?? '', activeVariant: s.activeVariant,
        lastValidation: s.lastValidation, cluesUsedThisStep: s.cluesUsedThisStep,
        xpPerHint: step?.xpPerHint ?? 25, hasMockResult: !!s.mockResult,
      };
      const areas = drawTerminal(termPanel.ctx, w, tstate, inputRef2.current);
      dirty(termPanel);
      const inp = areas.find(a => a.id === '__input__');
      if (inp) setInputRect({ x: inp.x, y: h - P.TERM_H + inp.y, w: inp.w, h: inp.h });
      registerButtons(termPanel, areas, {
        execute: () => { handleExecute(); },
        clue: () => { if (s.cluesUsedThisStep < 3) s.requestClue(); },
        clr: () => { setInputValue(''); inputRef2.current = ''; redrawTerminalCb.current?.(); s.hideResultPanel(); },
      });
    };

    // Initial draw
    redrawAll();

    // ── Command-driven particle animations ────────────────────────────────

    const animatingRef = { current: false };
    const recordCountRef = { current: TOTAL_PARTICLES };

    function applyCommand(cmd: string | null, level: string | null) {
      if (!cmd) return;
      animatingRef.current = true;
      const active = Math.min(recordCountRef.current, TOTAL_PARTICLES);

      if (cmd === "fetch") {
        particles.forEach((p,i) => {
          if (i < active) { const [x,y2,z]=toroid(i,active); p.targetX=x;p.targetY=y2;p.targetZ=z;p.targetScale=0.8+Math.random()*0.4;p.active=true; }
          else { p.targetScale=0.1; p.active=false; }
        });
      } else {
        if (level) {
          particles.forEach(p => {
            if (p.logLevel!==level && p.active) {
              const [x,y2,z]=scatter(); p.targetX=x;p.targetY=y2;p.targetZ=z;p.targetScale=0;p.active=false;
            }
          });
        }
        if (cmd==="filter") {
          if (level) {
            particles.forEach(p => {
              if (p.logLevel===level) { const [x,y2,z]=toroid(Math.floor(Math.random()*1000),1000); p.targetX=x*0.65;p.targetY=y2*0.65;p.targetZ=z*0.65;p.targetScale=1.1; }
            });
          } else {
            const keep=Math.floor(active*0.25);
            particles.forEach((p,i) => {
              if (i<keep) { const [x,y2,z]=toroid(i,keep); p.targetX=x*0.7;p.targetY=y2*0.7;p.targetZ=z*0.7;p.targetScale=1.0; }
              else if (p.active) { const [x,y2,z]=scatter(); p.targetX=x;p.targetY=y2;p.targetZ=z;p.targetScale=0;p.active=false; }
            });
          }
        } else if (cmd==="parse") {
          particles.forEach(p=>{ if(p.active){p.targetX*=1.15;p.targetY*=1.15;p.targetZ*=1.15;p.targetScale=0.7;setTimeout(()=>{p.targetX/=1.15;p.targetY/=1.15;p.targetZ/=1.15;p.targetScale=1.0;},400);} });
        } else if (cmd==="summarize") {
          let pc=0;particles.forEach(p=>{ if(!p.active)return;const c=pc%5;const [x,y2,z]=cluster(c,5,5);p.targetX=x;p.targetY=y2;p.targetZ=z;p.targetScale=1.2;pc++; });
        } else if (cmd==="makeTimeseries") {
          let li=0;particles.forEach(p=>{ if(!p.active)return;p.targetX=-60+(li/Math.max(active*0.25,1))*120;p.targetY=(Math.random()-0.5)*12;p.targetZ=(Math.random()-0.5)*8;p.targetScale=0.8;li++; });
        } else if (cmd==="sort") {
          const ap=particles.filter(p=>p.active);ap.sort(()=>Math.random()-0.5);ap.forEach((p,i)=>{p.targetY=-30+(i/ap.length)*60;p.targetX=(Math.random()-0.5)*20;p.targetZ=(Math.random()-0.5)*20;});
        } else if (cmd==="limit") {
          particles.filter(p=>p.active).slice(5).forEach(p=>{p.targetScale=0;p.active=false;});
        } else if (cmd==="expand") {
          particles.forEach(p=>{if(p.active){p.targetScale=1.5;p.targetX*=1.3;p.targetZ*=1.3;}});
        } else if (cmd==="fieldsAdd") {
          particles.forEach(p=>{if(p.active){p.targetScale=1.1;p.targetY+=(Math.random()-0.5)*4;}});
        } else if (cmd==="fieldsRemove") {
          particles.forEach(p=>{if(p.active)p.targetScale=0.7;});
        } else if (cmd==="join") {
          let side=0;particles.forEach(p=>{if(!p.active)return;const off=side%2===0?-35:35;p.targetX=off+(Math.random()-0.5)*15;p.targetY=(Math.random()-0.5)*40;p.targetZ=(Math.random()-0.5)*15;side++;});
        } else if (cmd==="reset") {
          particles.forEach((p,i)=>{const [x,y2,z]=toroid(i,TOTAL_PARTICLES);p.targetX=x;p.targetY=y2;p.targetZ=z;p.targetScale=p.active?0.8:0;});
        }
      }
    }

    // ── Store subscription ────────────────────────────────────────────────

    let prevCmd: string|null = null;
    let prevFilterLevel: string|null = null;
    let prevRecordCount = 0;

    const unsub = useScenarioStore.subscribe((state) => {
      const scen = state.scenarios[state.currentScenarioIndex];
      const step = scen?.steps[state.currentStepIndex];
      recordCountRef.current = step?.mockRecordCount ?? TOTAL_PARTICLES;

      // Trigger particle animation when command changes
      if (state.vortexCommand !== prevCmd || state.vortexFilterLevel !== prevFilterLevel) {
        prevCmd = state.vortexCommand;
        prevFilterLevel = state.vortexFilterLevel;
        if (state.vortexCommand) applyCommand(state.vortexCommand, state.vortexFilterLevel);
      }

      // Track solved state for snitch
      snitchSolvedRef.current = state.showStoryCard || state.pendingStoryCard;

      // Snitch hint pulse
      if (state.showSnitchHint && !snitchHintRef.current) {
        snitchHintRef.current = true;
        clearTimeout(snitchHintTimer.current);
        snitchHintTimer.current = window.setTimeout(() => { snitchHintRef.current = false; }, 3000);
      } else if (!state.showSnitchHint) {
        snitchHintRef.current = false;
      }

      // Update record count for particle density
      if ((step?.mockRecordCount ?? TOTAL_PARTICLES) !== prevRecordCount) {
        prevRecordCount = step?.mockRecordCount ?? TOTAL_PARTICLES;
      }

      // Redraw all HUD panels
      redrawAll();
    });

    // ── Raycasting / click interaction ────────────────────────────────────

    const raycaster = new THREE.Raycaster();

    function onPointerDown(e: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width)  *  2 - 1,
        ((e.clientY - rect.top)  / rect.height) * -2 + 1
      );
      raycaster.setFromCamera(ndc, hudCamera);

      const interactivePanels = allPanels.filter(p => p.mesh.visible);
      const hits = raycaster.intersectObjects(interactivePanels.map(p => p.mesh));
      if (!hits.length) return;

      const hit = hits[0];
      const panel = allPanels.find(p => p.mesh === hit.object);
      if (!panel || !hit.uv) return;

      // Convert UV [0,1] → logical canvas coords
      const cx2 = hit.uv.x * panel.w;
      const cy2 = (1 - hit.uv.y) * panel.h;

      for (const btn of buttonRegistry) {
        if (btn.panel !== panel) continue;
        if (btn.id === '__input__') continue; // handled by HTML input
        if (cx2 >= btn.x && cx2 <= btn.x + btn.w && cy2 >= btn.y && cy2 <= btn.y + btn.h) {
          btn.action();
          break;
        }
      }
    }

    renderer.domElement.addEventListener("pointerdown", onPointerDown);

    // ── Animation loop ────────────────────────────────────────────────────

    const clock = new THREE.Clock();
    let animId = 0;
    const dimmedRef = { current: false };

    function animate() {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Update store dimmed flag
      const s2 = getStoreState();
      dimmedRef.current = s2.showStoryCard || s2.showHintModal || s2.showScenarioVictory;

      // Particles
      const bkeys  = LOG_LEVEL_BUCKETS.map(b=>b.key);
      const bcounts = LOG_LEVEL_BUCKETS.map(b=>b.count);
      let pIdx = 0;
      let anyAnim = false;

      for (let bi=0; bi<bkeys.length; bi++) {
        const mesh = meshMap.get(bkeys[bi]);
        if (!mesh) { pIdx += bcounts[bi]; continue; }
        let changed = false;
        for (let i=0; i<bcounts[bi]; i++, pIdx++) {
          const p = particles[pIdx];
          if (!p) continue;
          mesh.getMatrixAt(i, dummy.matrix);
          dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
          const LERP=0.06;
          const dx=p.targetX-dummy.position.x, dy=p.targetY-dummy.position.y, dz=p.targetZ-dummy.position.z, ds=p.targetScale-dummy.scale.x;
          if (Math.abs(dx)>0.01||Math.abs(dy)>0.01||Math.abs(dz)>0.01||Math.abs(ds)>0.001) {
            dummy.position.x+=dx*LERP; dummy.position.y+=dy*LERP; dummy.position.z+=dz*LERP;
            dummy.scale.setScalar(dummy.scale.x+ds*LERP);
            anyAnim=true; changed=true;
          }
          if (p.active && p.targetScale>0.05) {
            const angle=Math.atan2(dummy.position.z,dummy.position.x)+0.002;
            const rad=Math.sqrt(dummy.position.x**2+dummy.position.z**2);
            dummy.position.x=Math.cos(angle)*rad; dummy.position.z=Math.sin(angle)*rad;
            dummy.position.y+=Math.sin(t*0.5+pIdx*0.1)*0.01;
            changed=true;
          }
          dummy.quaternion.copy(camera.quaternion);
          dummy.updateMatrix();
          if (changed) mesh.setMatrixAt(i, dummy.matrix);
        }
        if (changed) mesh.instanceMatrix.needsUpdate=true;
      }

      // Snitch
      if (snitchSolvedRef.current) {
        const camDir=new THREE.Vector3(); camera.getWorldDirection(camDir);
        snitchTarget.set(camera.position.x-camDir.x*30, camera.position.y-camDir.y*30, camera.position.z-camDir.z*30);
        snitchGroup.position.lerp(snitchTarget,0.05);
        snitchGroup.scale.lerp(new THREE.Vector3(2.5,2.5,2.5),0.03);
      } else if (snitchHintRef.current) {
        const sT=t*0.85, sR=55;
        snitchGroup.position.set(sR*Math.cos(sT),8*Math.sin(sT*1.3)+5,sR*Math.sin(sT));
        snitchGroup.scale.lerp(new THREE.Vector3(1.6,1.6,1.6),0.08);
      } else {
        const sT=t*0.85, sR=55;
        snitchGroup.position.set(sR*Math.cos(sT),8*Math.sin(sT*1.3)+5,sR*Math.sin(sT));
        snitchGroup.scale.lerp(new THREE.Vector3(1,1,1),0.05);
      }
      wL.rotation.z = 0.3+Math.sin(t*5)*0.25;
      wR.rotation.z =-0.3-Math.sin(t*5)*0.25;
      snitchGroup.quaternion.copy(camera.quaternion);

      if (animatingRef.current && !anyAnim) {
        animatingRef.current=false;
        useScenarioStore.getState().vortexAnimationComplete();
      }

      // Camera orbit
      camera.position.x=120*Math.sin(t*0.04);
      camera.position.z=120*Math.cos(t*0.04);
      camera.lookAt(0,0,0);

      scene.background = new THREE.Color(dimmedRef.current ? 0x040408 : 0x080812);

      // Render 3D scene + bloom
      composer.render();

      // Render HUD on top (no depth clear)
      renderer.autoClear = false;
      renderer.clearDepth();
      renderer.render(hudScene, hudCamera);
      renderer.autoClear = true;
    }
    animate();

    // ── Resize ────────────────────────────────────────────────────────────

    function onResize() {
      const c = containerRef.current; if (!c) return;
      w = c.clientWidth; h = c.clientHeight;
      camera.aspect = w/h; camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);

      // Ortho camera
      hudCamera.left=-w/2; hudCamera.right=w/2; hudCamera.top=h/2; hudCamera.bottom=-h/2;
      hudCamera.updateProjectionMatrix();

      // Rebuild full-width panels
      freePanel(termPanel);
      const newTermCanvas = document.createElement("canvas");
      newTermCanvas.width=Math.round(w*DRAW_SCALE); newTermCanvas.height=Math.round(P.TERM_H*DRAW_SCALE);
      termPanel.canvas = newTermCanvas;
      termPanel.ctx = newTermCanvas.getContext("2d")!;
      termPanel.texture = new THREE.CanvasTexture(newTermCanvas);
      termPanel.texture.minFilter=termPanel.texture.magFilter=THREE.LinearFilter;
      (termPanel.mesh.material as THREE.MeshBasicMaterial).map = termPanel.texture;
      termPanel.mesh.geometry.dispose();
      termPanel.mesh.geometry = new THREE.PlaneGeometry(w, P.TERM_H);
      termPanel.w=w;

      // Rebuild selector panel
      freePanel(selectorPanel);
      const newSelCanvas = document.createElement("canvas");
      newSelCanvas.width=Math.round(w*DRAW_SCALE); newSelCanvas.height=Math.round(h*DRAW_SCALE);
      selectorPanel.canvas = newSelCanvas;
      selectorPanel.ctx = newSelCanvas.getContext("2d")!;
      selectorPanel.texture = new THREE.CanvasTexture(newSelCanvas);
      selectorPanel.texture.minFilter=selectorPanel.texture.magFilter=THREE.LinearFilter;
      (selectorPanel.mesh.material as THREE.MeshBasicMaterial).map = selectorPanel.texture;
      selectorPanel.mesh.geometry.dispose();
      selectorPanel.mesh.geometry = new THREE.PlaneGeometry(w, h);
      selectorPanel.w=w; selectorPanel.h=h;

      // Rebuild backdrop
      backdropMesh.geometry.dispose();
      backdropMesh.geometry = new THREE.PlaneGeometry(w, h);

      positionPanels();
      redrawTerminalCb.current = () => {
        const s3 = getStoreState();
        const sc3 = s3.scenarios[s3.currentScenarioIndex];
        const st3 = sc3?.steps[s3.currentStepIndex];
        const ss3 = s3.stepsCompleted.filter(k=>Math.floor(k/100)===s3.currentScenarioIndex).length;
        const ts: TerminalState = {
          totalSteps:sc3?.steps.length??0, currentStepIndex:s3.currentStepIndex, stepsSolved:ss3,
          totalXP:s3.totalXP, scenarioTitle:sc3?.title??'', scenarioStars:sc3?.stars??'',
          narration:st3?.narration??'', activeVariant:s3.activeVariant, lastValidation:s3.lastValidation,
          cluesUsedThisStep:s3.cluesUsedThisStep, xpPerHint:st3?.xpPerHint??25, hasMockResult:!!s3.mockResult,
        };
        const areas = drawTerminal(termPanel.ctx, w, ts, inputRef2.current);
        dirty(termPanel);
        const inp2 = areas.find(a=>a.id==='__input__');
        if (inp2) setInputRect({x:inp2.x, y:h-P.TERM_H+inp2.y, w:inp2.w, h:inp2.h});
        registerButtons(termPanel, areas, {
          execute:()=>handleExecute(),
          clue:()=>{if(s3.cluesUsedThisStep<3)s3.requestClue();},
          clr:()=>{setInputValue('');inputRef2.current='';redrawTerminalCb.current?.();s3.hideResultPanel();},
        });
      };
      redrawAll();
    }
    window.addEventListener("resize", onResize);

    // ── Cleanup ───────────────────────────────────────────────────────────

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      unsub();
      clearTimeout(snitchHintTimer.current);
      renderer.dispose();
      composer.dispose();
      geo.dispose();
      for (const p of allPanels) freePanel(p);
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      redrawTerminalCb.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div ref={containerRef} style={{ width:"100%", height:"100%", position:"relative" }}>
      {/* Single HTML element: DQL query input */}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        style={{
          position:    "absolute",
          left:        inputRect.x,
          top:         inputRect.y,
          width:       inputRect.w,
          height:      inputRect.h,
          background:  "transparent",
          color:       "transparent",
          caretColor:  "white",
          fontFamily:  "monospace",
          fontSize:    "13px",
          outline:     "none",
          border:      "none",
          padding:     "0",
          zIndex:      10,
        }}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
      />
    </div>
  );
}
