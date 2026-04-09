// hudPanels.ts — Canvas-2D draw functions for every UI panel.
// All panels render at DRAW_SCALE (2×) for retina sharpness.
// Each draw fn takes a CanvasRenderingContext2D, logical pixel dims, state,
// and returns an array of BtnArea click targets.

import type { MockData } from "../../types/detective";
import type { ScenarioVariant, ScenarioV2 } from "../../types/scenario";
import { getRank, getClueText } from "../../stores/scenarioStore";

export const DRAW_SCALE = 2;

// ── Panel logical sizes (CSS px) ──────────────────────────────────────────────
export const P = {
  TERM_H:     130,
  HEADER_W:   340,  HEADER_H:   44,
  CLUE_W:     340,  CLUE_H:    178,
  SNITCH_W:   420,  SNITCH_H:   80,
  RESULT_W:   460,  RESULT_H:  232,
  EVID_W:     224,  EVID_H:    240,
  HINT_W:     400,  HINT_H:    262,
  STORY_W:    560,  STORY_H:   448,
  VICTORY_W:  620,  VICTORY_H: 530,
} as const;

// ── Colors ────────────────────────────────────────────────────────────────────
const BG  = 'rgba(5,5,14,0.97)';
const SEP = 'rgba(30,42,90,0.55)';

const BD = {
  def:   'rgba(40,52,100,0.7)',
  cyan:  'rgba(34,211,238,0.22)',
  amber: 'rgba(251,191,36,0.38)',
  gold:  'rgba(250,204,21,0.55)',
  green: 'rgba(74,222,128,0.30)',
  red:   'rgba(248,113,113,0.35)',
} as const;

const T = {
  white:  '#e2e8f0',
  muted:  '#64748b',
  dim:    '#2d3748',
  cyan:   '#22d3ee',
  amber:  '#fbbf24',
  gold:   '#fde047',
  green:  '#4ade80',
  red:    '#f87171',
  orange: '#fb923c',
  blue:   '#93c5fd',
  yellow: '#facc15',
} as const;

// ── Public type ───────────────────────────────────────────────────────────────
export interface BtnArea {
  id: string;
  x: number; y: number; w: number; h: number;
}

// ── Low-level helpers ─────────────────────────────────────────────────────────

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  if (r <= 0) { ctx.beginPath(); ctx.rect(x, y, w, h); return; }
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function panelBg(ctx: CanvasRenderingContext2D, w: number, h: number, border: string, r = 14) {
  ctx.fillStyle = BG;
  rr(ctx, 0, 0, w, h, r);
  ctx.fill();
  ctx.strokeStyle = border;
  ctx.lineWidth = 1;
  rr(ctx, 0.5, 0.5, w - 1, h - 1, r);
  ctx.stroke();
}

function drawBtn(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  label: string, bg: string, fg: string,
  disabled = false
): BtnArea {
  ctx.globalAlpha = disabled ? 0.38 : 1.0;
  ctx.fillStyle = bg;
  rr(ctx, x, y, w, h, 6); ctx.fill();
  ctx.globalAlpha = 1.0;
  ctx.fillStyle = fg;
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2 + 0.5);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  return { id: '', x, y, w, h };
}

function hline(ctx: CanvasRenderingContext2D, x1: number, x2: number, y: number) {
  ctx.strokeStyle = SEP;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x1, y + 0.5); ctx.lineTo(x2, y + 0.5); ctx.stroke();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string, x: number, y: number,
  maxW: number, lineH: number,
  maxLines = 99
): number {
  const words = text.split(' ');
  let line = '';
  let cy = y;
  let lines = 0;
  for (const word of words) {
    const test = line + word + ' ';
    if (ctx.measureText(test).width > maxW && line !== '') {
      if (lines < maxLines) ctx.fillText(line.trimEnd(), x, cy);
      line = word + ' ';
      cy += lineH; lines++;
    } else { line = test; }
  }
  if (line.trim() && lines < maxLines) ctx.fillText(line.trimEnd(), x, cy);
  return cy + lineH;
}

function subst(tmpl: string, v: ScenarioVariant | null): string {
  if (!v) return tmpl.replace(/\{\{(\w+)\}\}/g, '…');
  return tmpl.replace(/\{\{(\w+)\}\}/g, (_, k) => String((v as Record<string,unknown>)[k] ?? '…'));
}

// ── DQL Tokenizer (for syntax highlight in terminal) ──────────────────────────

const KWDS = new Set(['fetch','filter','filterout','parse','summarize','sort','limit','fields',
  'fieldsadd','fieldsremove','fieldsrename','expand','dedup','lookup','join',
  'maketimeseries','timeseries','append']);
const DPLS = new Set(['ld','data','int','long','double','word','string','ipaddr','ipv4',
  'httpdate','timestamp','json','kvp','structure','space','eol','eos']);
const FLDS = new Set(['timestamp','content','loglevel','log.source','status',
  'dt.entity.process_group','dt.entity.host','dt.process.name','k8s.namespace.name',
  'k8s.container.name','k8s.pod.name','k8s.cluster.name','event.type','event.name',
  'event.description','event.status','event.kind','app_name','src_ip','dst_ip',
  'http_code','http_host','http_uri']);

type TokType = 'keyword'|'string'|'dpl'|'field'|'pipe'|'plain';
const TOK_COL: Record<TokType, string> = {
  keyword:'#22d3ee', string:'#fde047', dpl:'#fb923c',
  field:'#93c5fd', pipe:'#6b7280', plain:'#cbd5e1',
};

function tokenize(q: string): { text: string; type: TokType }[] {
  const out: { text: string; type: TokType }[] = [];
  let i = 0;
  while (i < q.length) {
    if (q[i] === '"' || q[i] === "'") {
      const qt = q[i]; let j = i + 1;
      while (j < q.length && q[j] !== qt) j++;
      out.push({ text: q.slice(i, j + 1), type: 'string' }); i = j + 1; continue;
    }
    if (q[i] === '|') { out.push({ text:'|', type:'pipe' }); i++; continue; }
    if (/[a-zA-Z_]/.test(q[i])) {
      let j = i;
      while (j < q.length && /[a-zA-Z0-9_.[\]():]/.test(q[j])) j++;
      const word = q.slice(i, j);
      const lw = word.toLowerCase().replace(/[():].*/, '');
      const type: TokType = KWDS.has(lw) ? 'keyword' : DPLS.has(lw) ? 'dpl' : FLDS.has(lw) ? 'field' : 'plain';
      out.push({ text: word, type }); i = j; continue;
    }
    out.push({ text: q[i], type: 'plain' }); i++;
  }
  return out;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PANEL DRAW FUNCTIONS
// Each: ctx.setTransform(DRAW_SCALE,0,0,DRAW_SCALE,0,0) at start,
//       ctx.setTransform(1,0,0,1,0,0) at end.
//       Works entirely in logical pixel coordinates.
// ═══════════════════════════════════════════════════════════════════════════════

// ── Terminal strip ────────────────────────────────────────────────────────────

export interface TerminalState {
  totalSteps: number;
  currentStepIndex: number;
  stepsSolved: number;
  totalXP: number;
  scenarioTitle: string;
  scenarioStars: string;
  narration: string;
  activeVariant: ScenarioVariant | null;
  lastValidation: { valid: boolean; partial: boolean; feedback: string } | null;
  cluesUsedThisStep: number;
  xpPerHint: number;
  hasMockResult: boolean;
}

export function drawTerminal(
  ctx: CanvasRenderingContext2D,
  w: number,
  state: TerminalState,
  inputVal: string
): BtnArea[] {
  const h = P.TERM_H;
  ctx.setTransform(DRAW_SCALE, 0, 0, DRAW_SCALE, 0, 0);
  ctx.clearRect(0, 0, w, h);

  ctx.fillStyle = 'rgba(4,4,12,1)';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(30,42,90,0.9)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, 0.5); ctx.lineTo(w, 0.5); ctx.stroke();

  const PAD = 16;
  const btns: BtnArea[] = [];
  let y = 10;

  // Row 1: progress dots + step + scenario + xp
  let dotX = PAD;
  for (let i = 0; i < state.totalSteps; i++) {
    const done = i < state.stepsSolved;
    const cur  = i === state.currentStepIndex;
    ctx.beginPath();
    ctx.arc(dotX + 5, y + 6, 5, 0, Math.PI * 2);
    ctx.fillStyle = done ? '#22c55e' : cur ? '#60a5fa' : '#374151';
    ctx.fill();
    if (cur) {
      ctx.beginPath(); ctx.arc(dotX + 5, y + 6, 7, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(96,165,250,0.25)'; ctx.lineWidth = 2; ctx.stroke();
    }
    dotX += 16;
  }
  ctx.fillStyle = T.muted; ctx.font = '11px monospace'; ctx.textBaseline = 'middle';
  ctx.fillText(`Step ${state.currentStepIndex + 1}/${state.totalSteps}`, dotX + 6, y + 6);

  if (state.scenarioTitle) {
    ctx.fillStyle = T.dim; ctx.textAlign = 'center';
    ctx.fillText(`${state.scenarioStars} ${state.scenarioTitle}`, w / 2, y + 6);
    ctx.textAlign = 'left';
  }
  ctx.fillStyle = T.amber; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'right';
  ctx.fillText(`${state.totalXP.toLocaleString()} XP`, w - PAD, y + 6);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  y += 20;

  hline(ctx, PAD, w - PAD, y); y += 8;

  // Row 2: Objective
  if (state.narration) {
    const narr = subst(state.narration, state.activeVariant);
    ctx.fillStyle = T.muted; ctx.font = 'bold 10px monospace';
    ctx.fillText('OBJECTIVE', PAD, y + 10);
    ctx.fillStyle = 'rgba(148,163,184,0.75)'; ctx.font = 'italic 11px monospace';
    const maxNW = w - PAD * 2 - 195;
    let s = narr;
    while (s.length > 20 && ctx.measureText(s + '…').width > maxNW) s = s.slice(0, -1);
    if (s !== narr) s += '…';
    ctx.fillText(s, PAD + 82, y + 10);
    y += 22;
  }

  hline(ctx, PAD, w - PAD, y); y += 6;

  // Row 3: Feedback (conditional)
  if (state.lastValidation) {
    const v = state.lastValidation;
    const solved = v.valid && state.hasMockResult;
    const icon   = solved ? '✓' : v.partial ? '◐' : '✗';
    const fg     = solved ? T.green : v.partial ? T.amber : T.red;
    const bg2    = solved ? 'rgba(21,128,61,0.1)' : v.partial ? 'rgba(120,53,15,0.1)' : 'rgba(127,29,29,0.1)';
    ctx.fillStyle = bg2; ctx.fillRect(0, y, w, 20);
    ctx.fillStyle = fg; ctx.font = '11px monospace'; ctx.textBaseline = 'middle';
    const fbMaxW = w - PAD * 2 - 195;
    let fb = v.feedback;
    while (fb.length > 5 && ctx.measureText(`${icon}  ${fb}…`).width > fbMaxW) fb = fb.slice(0, -1);
    if (fb !== v.feedback) fb += '…';
    ctx.fillText(`${icon}  ${fb}`, PAD, y + 10);
    ctx.textBaseline = 'alphabetic'; y += 22;
    hline(ctx, PAD, w - PAD, y); y += 4;
  }

  // Row 4: Input row
  const rowY = y;
  const rowH = h - rowY - 4;

  ctx.fillStyle = T.cyan; ctx.font = '14px monospace'; ctx.textBaseline = 'middle';
  ctx.fillText('›', PAD, rowY + rowH / 2);

  const toks = tokenize(inputVal);
  let tx = PAD + 22;
  ctx.font = '13px monospace';
  for (const tok of toks) {
    ctx.fillStyle = TOK_COL[tok.type];
    ctx.fillText(tok.text, tx, rowY + rowH / 2);
    tx += ctx.measureText(tok.text).width;
  }
  if (!inputVal) {
    ctx.fillStyle = 'rgba(71,85,105,0.45)'; ctx.font = '12px monospace';
    ctx.fillText('fetch logs | filter loglevel == "ERROR" | …', PAD + 22, rowY + rowH / 2);
  }
  ctx.textBaseline = 'alphabetic';

  // Buttons
  const btnH = 26;
  const btnY2 = rowY + (rowH - btnH) / 2;

  const clrW = 36, clrX = w - PAD - clrW;
  btns.push({ ...drawBtn(ctx, clrX, btnY2, clrW, btnH, 'CLR', 'rgba(55,65,81,0.7)', T.muted), id:'clr' });

  const clueUsed = state.cluesUsedThisStep >= 3;
  const clueW = 88, clueX = clrX - clueW - 8;
  const clueLabel = clueUsed ? 'CLUE ✗' : `CLUE -${state.xpPerHint}`;
  btns.push({ ...drawBtn(ctx, clueX, btnY2, clueW, btnH, clueLabel,
    clueUsed ? 'rgba(55,65,81,0.35)' : 'rgba(120,53,15,0.6)',
    clueUsed ? T.muted : T.amber, clueUsed), id:'clue' });

  const execW = 80, execX = clueX - execW - 8;
  btns.push({ ...drawBtn(ctx, execX, btnY2, execW, btnH, 'EXECUTE', 'rgba(29,78,216,0.85)', T.white), id:'execute' });

  // Expose input area dimensions for HTML input positioning
  btns.push({ id:'__input__', x: PAD + 22, y: rowY, w: execX - PAD - 22 - 8, h: rowH });

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return btns;
}

// ── Scenario Header ───────────────────────────────────────────────────────────

export function drawHeader(
  ctx: CanvasRenderingContext2D,
  title: string, company: string
): void {
  const w = P.HEADER_W, h = P.HEADER_H;
  ctx.setTransform(DRAW_SCALE, 0, 0, DRAW_SCALE, 0, 0);
  ctx.clearRect(0, 0, w, h);
  panelBg(ctx, w, h, BD.def, h / 2);
  ctx.fillStyle = T.white; ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(title, w / 2, h / 2 - 6);
  ctx.fillStyle = T.muted; ctx.font = '10px monospace';
  ctx.fillText(company, w / 2, h / 2 + 8);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

// ── Clue Card ─────────────────────────────────────────────────────────────────

export interface ClueState {
  clueLevel: 1|2|3;
  cluesUsed: number;
  step: { clue: string; secondClue: string; finalClue: string } | null;
}

export function drawClueCard(ctx: CanvasRenderingContext2D, state: ClueState): BtnArea[] {
  const w = P.CLUE_W, h = P.CLUE_H;
  ctx.setTransform(DRAW_SCALE, 0, 0, DRAW_SCALE, 0, 0);
  ctx.clearRect(0, 0, w, h);
  panelBg(ctx, w, h, BD.amber);
  const PAD = 14;
  const btns: BtnArea[] = [];

  // Header
  ctx.fillStyle = T.amber; ctx.font = 'bold 11px monospace';
  ctx.textBaseline = 'middle';
  ctx.fillText(`CLUE ${state.clueLevel} / 3`, PAD, 20);
  btns.push({ ...drawBtn(ctx, w - PAD - 20, 8, 20, 20, '✕', 'transparent', T.muted), id:'dismiss-clue' });
  hline(ctx, PAD, w - PAD, 34);

  // Clue text
  const clueText = state.step ? getClueText(state.clueLevel, state.step) : '';
  ctx.fillStyle = T.white; ctx.font = 'italic 12px monospace';
  ctx.textBaseline = 'alphabetic';
  wrapText(ctx, `"${clueText}"`, PAD, 52, w - PAD * 2, 18, 5);

  // Progress bars
  const barY = h - 18;
  for (let i = 0; i < 3; i++) {
    const bx = PAD + i * ((w - PAD * 2) / 3 + 2);
    const bw = (w - PAD * 2) / 3 - 4;
    ctx.fillStyle = i < state.cluesUsed ? T.amber : T.dim;
    rr(ctx, bx, barY, bw, 4, 2); ctx.fill();
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return btns;
}

// ── Snitch Hint ───────────────────────────────────────────────────────────────

export function drawSnitchHint(
  ctx: CanvasRenderingContext2D,
  message: string,
  progress: number  // 0→1, used for progress bar drain animation
): BtnArea[] {
  const w = P.SNITCH_W, h = P.SNITCH_H;
  ctx.setTransform(DRAW_SCALE, 0, 0, DRAW_SCALE, 0, 0);
  ctx.clearRect(0, 0, w, h);
  panelBg(ctx, w, h, BD.gold);
  const btns: BtnArea[] = [];

  ctx.fillStyle = T.gold; ctx.font = '18px monospace';
  ctx.textBaseline = 'middle';
  ctx.fillText('✦', 14, h / 2 - 6);

  ctx.fillStyle = '#fef9c3'; ctx.font = '12px monospace';
  ctx.textBaseline = 'alphabetic';
  wrapText(ctx, message, 40, 18, w - 70, 16, 3);

  btns.push({ ...drawBtn(ctx, w - 28, 8, 20, 20, '✕', 'transparent', T.muted), id:'dismiss-snitch' });

  // Progress bar
  ctx.fillStyle = `rgba(250,204,21,${0.5 * progress})`;
  ctx.fillRect(0, h - 3, w * progress, 3);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return btns;
}

// ── Result Panel ──────────────────────────────────────────────────────────────

export function drawResultPanel(ctx: CanvasRenderingContext2D, data: MockData): BtnArea[] {
  const w = P.RESULT_W, h = P.RESULT_H;
  ctx.setTransform(DRAW_SCALE, 0, 0, DRAW_SCALE, 0, 0);
  ctx.clearRect(0, 0, w, h);
  panelBg(ctx, w, h, BD.cyan);
  const btns: BtnArea[] = [];
  const PAD = 12;

  // Header bar
  ctx.fillStyle = 'rgba(8,40,60,0.7)'; ctx.fillRect(0, 0, w, 30);
  ctx.fillStyle = 'rgba(34,211,238,0.9)'; ctx.font = 'bold 10px monospace';
  ctx.textBaseline = 'middle';
  ctx.fillText('◉  QUERY RESULT', PAD, 15);
  ctx.fillStyle = T.muted; ctx.font = '10px monospace';
  ctx.fillText(`${data.rows.length} record${data.rows.length !== 1 ? 's' : ''}`, w - 80, 15);
  btns.push({ ...drawBtn(ctx, w - PAD - 20, 5, 20, 20, '✕', 'transparent', T.muted), id:'dismiss-result' });
  ctx.textBaseline = 'alphabetic';

  // Header row
  const colW = (w - PAD * 2) / Math.max(data.headers.length, 1);
  const hdrY = 38;
  ctx.fillStyle = 'rgba(20,30,55,0.5)'; ctx.fillRect(PAD, hdrY - 4, w - PAD * 2, 18);
  ctx.fillStyle = T.cyan; ctx.font = 'bold 9px monospace';
  data.headers.forEach((h2, i) => {
    ctx.fillText(h2.toUpperCase(), PAD + i * colW, hdrY + 9);
  });
  hline(ctx, PAD, w - PAD, hdrY + 16);

  // Rows (max 7)
  const maxRows = 7;
  ctx.font = '10px monospace'; ctx.textBaseline = 'middle';
  data.rows.slice(0, maxRows).forEach((row, ri) => {
    const ry = hdrY + 22 + ri * 22;
    if (ri % 2 === 0) { ctx.fillStyle = 'rgba(255,255,255,0.02)'; ctx.fillRect(PAD, ry - 8, w - PAD * 2, 20); }
    row.forEach((cell, ci) => {
      ctx.fillStyle = cell.style === 'error' ? T.orange
        : cell.style === 'warn' ? T.amber
        : cell.style === 'highlight' ? T.cyan : T.muted;
      const maxCellW = colW - 4;
      let val = cell.value;
      while (val.length > 3 && ctx.measureText(val + '…').width > maxCellW) val = val.slice(0, -1);
      if (val !== cell.value) val += '…';
      ctx.fillText(val, PAD + ci * colW, ry + 2);
    });
  });
  if (data.rows.length > maxRows) {
    ctx.fillStyle = T.muted; ctx.font = '10px monospace'; ctx.textAlign = 'center';
    ctx.fillText(`+${data.rows.length - maxRows} more rows`, w / 2, h - 10);
    ctx.textAlign = 'left';
  }

  ctx.textBaseline = 'alphabetic';
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return btns;
}

// ── Evidence Board ────────────────────────────────────────────────────────────

export interface EvidStep { idx: number; title: string; expanded: boolean; preview: string; }

export function drawEvidenceBoard(ctx: CanvasRenderingContext2D, steps: EvidStep[]): BtnArea[] {
  const w = P.EVID_W;
  const rowH = 28;
  const h = Math.min(P.EVID_H, 16 + steps.reduce((acc, s) => acc + rowH + (s.expanded ? 60 : 0), 0));
  ctx.setTransform(DRAW_SCALE, 0, 0, DRAW_SCALE, 0, 0);
  ctx.clearRect(0, 0, w, P.EVID_H);
  const btns: BtnArea[] = [];
  const PAD = 10;
  let y = 8;

  for (const s of steps) {
    // Step row
    ctx.fillStyle = 'rgba(10,30,20,0.85)';
    rr(ctx, 0, y, w, rowH, 8); ctx.fill();
    ctx.strokeStyle = BD.green; ctx.lineWidth = 1;
    rr(ctx, 0.5, y + 0.5, w - 1, rowH - 1, 8); ctx.stroke();

    ctx.fillStyle = T.green; ctx.font = 'bold 10px monospace'; ctx.textBaseline = 'middle';
    ctx.fillText('✓', PAD, y + rowH / 2);
    ctx.fillStyle = T.white; ctx.font = 'bold 11px monospace';
    ctx.fillText(`Step ${s.idx + 1}`, PAD + 16, y + rowH / 2);
    ctx.fillStyle = T.muted; ctx.font = '10px monospace'; ctx.textAlign = 'right';
    ctx.fillText(s.expanded ? '▲' : '▼', w - PAD, y + rowH / 2);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    btns.push({ id: `evid-${s.idx}`, x: 0, y, w, h: rowH });
    y += rowH + 2;

    if (s.expanded) {
      ctx.fillStyle = T.muted; ctx.font = '10px monospace'; ctx.textBaseline = 'alphabetic';
      wrapText(ctx, s.preview, PAD, y + 4, w - PAD * 2, 14, 3);
      y += 62;
    }
  }

  void h; // suppress unused warning
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return btns;
}

// ── Hint Modal ────────────────────────────────────────────────────────────────

export interface HintModalState {
  xpPerHint: number;
  baseXP: number;
  cluesUsedThisStep: number;
}

export function drawHintModal(ctx: CanvasRenderingContext2D, state: HintModalState): BtnArea[] {
  const w = P.HINT_W, h = P.HINT_H;
  ctx.setTransform(DRAW_SCALE, 0, 0, DRAW_SCALE, 0, 0);
  ctx.clearRect(0, 0, w, h);
  panelBg(ctx, w, h, BD.amber);
  const PAD = 20;
  const btns: BtnArea[] = [];

  ctx.fillStyle = T.amber; ctx.font = 'bold 15px monospace'; ctx.textBaseline = 'alphabetic';
  ctx.fillText('USE A CLUE?', PAD, 36);

  ctx.fillStyle = T.muted; ctx.font = '12px monospace';
  ctx.fillText(`This clue costs you `, PAD, 62);
  ctx.fillStyle = T.amber;
  ctx.fillText(`${Math.round(state.xpPerHint * 100)}%`, PAD + ctx.measureText('This clue costs you ').width, 62);
  ctx.fillStyle = T.muted;
  ctx.fillText(' of this step\'s XP.', PAD + ctx.measureText(`This clue costs you ${Math.round(state.xpPerHint * 100)}%`).width, 62);

  // XP box
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  rr(ctx, PAD, 76, w - PAD * 2, 60, 10); ctx.fill();
  ctx.fillStyle = T.white; ctx.font = '12px monospace';
  ctx.fillText('XP at stake', PAD + 12, 102);
  const multNow = [1.0, 0.75, 0.5, 0.25][Math.min(state.cluesUsedThisStep, 3)];
  const multAfter = [0.75, 0.5, 0.25, 0.25][Math.min(state.cluesUsedThisStep, 3)];
  ctx.fillStyle = T.white; ctx.textAlign = 'right'; ctx.font = 'bold 12px monospace';
  ctx.fillText(`${Math.round(state.baseXP * multNow)} XP`, w - PAD - 12, 102);
  ctx.fillStyle = T.muted; ctx.font = '12px monospace'; ctx.textAlign = 'left';
  ctx.fillText('After clue', PAD + 12, 122);
  ctx.fillStyle = T.amber; ctx.textAlign = 'right'; ctx.font = 'bold 12px monospace';
  ctx.fillText(`${Math.round(state.baseXP * multAfter)} XP`, w - PAD - 12, 122);
  ctx.textAlign = 'left';

  hline(ctx, PAD, w - PAD, 150);

  btns.push({ ...drawBtn(ctx, PAD, 162, (w - PAD * 2 - 10) / 2, 34, 'Reveal Clue', 'rgba(146,64,14,0.8)', T.white), id:'confirm-clue' });
  btns.push({ ...drawBtn(ctx, PAD + (w - PAD * 2 - 10) / 2 + 10, 162, (w - PAD * 2 - 10) / 2, 34, 'Keep Trying', 'rgba(55,65,81,0.7)', T.muted), id:'dismiss-hint' });

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return btns;
}

// ── Story Card ────────────────────────────────────────────────────────────────

export interface StoryState {
  stepIndex: number;
  scenarioTitle: string;
  storyExplanation: string;
  dqlLesson: string;
  commandsShown: string[];
  xpEarned: number;
  penaltyXP: number;
  isLastStep: boolean;
  activeVariant: ScenarioVariant | null;
}

export function drawStoryCard(ctx: CanvasRenderingContext2D, state: StoryState): BtnArea[] {
  const w = P.STORY_W, h = P.STORY_H;
  ctx.setTransform(DRAW_SCALE, 0, 0, DRAW_SCALE, 0, 0);
  ctx.clearRect(0, 0, w, h);
  panelBg(ctx, w, h, BD.green);
  const PAD = 20;
  const btns: BtnArea[] = [];

  // Header
  ctx.fillStyle = T.green; ctx.font = 'bold 14px monospace';
  ctx.fillText(`STEP ${state.stepIndex + 1} SOLVED`, PAD, 32);
  ctx.fillStyle = T.muted; ctx.font = '10px monospace';
  ctx.fillText(state.scenarioTitle, PAD, 48);

  ctx.fillStyle = T.green; ctx.font = 'bold 18px monospace'; ctx.textAlign = 'right';
  ctx.fillText(`+${state.xpEarned} XP`, w - PAD, 36);
  if (state.penaltyXP > 0) {
    ctx.fillStyle = T.amber; ctx.font = '10px monospace';
    ctx.fillText(`−${state.penaltyXP} XP hint`, w - PAD, 52);
  }
  ctx.textAlign = 'left';
  hline(ctx, PAD, w - PAD, 58);

  // Narrative
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  rr(ctx, PAD, 66, w - PAD * 2, 80, 8); ctx.fill();
  ctx.fillStyle = 'rgba(148,163,184,0.8)'; ctx.font = 'italic 11px monospace';
  wrapText(ctx, subst(state.storyExplanation, state.activeVariant), PAD + 10, 80, w - PAD * 2 - 20, 16, 4);

  // DQL Lesson
  const lessonY = 158;
  ctx.fillStyle = 'rgba(8,40,55,0.6)'; rr(ctx, PAD, lessonY, w - PAD * 2, 178, 8); ctx.fill();
  ctx.strokeStyle = BD.cyan; ctx.lineWidth = 1; rr(ctx, PAD + 0.5, lessonY + 0.5, w - PAD * 2 - 1, 178 - 1, 8); ctx.stroke();
  ctx.fillStyle = 'rgba(8,45,65,0.8)'; ctx.fillRect(PAD, lessonY, w - PAD * 2, 26);
  ctx.fillStyle = T.cyan; ctx.font = 'bold 10px monospace';
  ctx.fillText('WHAT YOU LEARNED', PAD + 10, lessonY + 16);
  ctx.fillStyle = '#a5f3fc'; ctx.font = '11px monospace';
  wrapText(ctx, state.dqlLesson, PAD + 10, lessonY + 34, w - PAD * 2 - 20, 15, 8);

  // Commands unlocked
  if (state.commandsShown.length > 0) {
    const tagY = lessonY + 186;
    ctx.fillStyle = T.muted; ctx.font = '10px monospace';
    ctx.fillText('Unlocked:', PAD, tagY + 10);
    let tagX = PAD + 62;
    for (const cmd of state.commandsShown.slice(0, 5)) {
      const tw2 = ctx.measureText(cmd).width + 12;
      ctx.fillStyle = 'rgba(8,40,55,0.7)'; rr(ctx, tagX, tagY, tw2, 16, 4); ctx.fill();
      ctx.fillStyle = T.cyan; ctx.font = '10px monospace'; ctx.textBaseline = 'middle';
      ctx.fillText(cmd, tagX + 6, tagY + 8); ctx.textBaseline = 'alphabetic';
      tagX += tw2 + 6;
    }
  }

  // Continue button
  const contLabel = state.isLastStep ? 'FINISH CASE →' : 'CONTINUE →';
  btns.push({ ...drawBtn(ctx, w - PAD - 140, h - PAD - 34, 140, 34, contLabel, 'rgba(21,128,61,0.8)', T.white), id:'advance' });

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return btns;
}

// ── Scenario Victory ──────────────────────────────────────────────────────────

export interface VictoryState {
  scenarioTitle: string;
  companyName: string;
  rootCause: string;
  totalXP: number;
  stepsCount: number;
  stepsCompleted: number;
  commandsUnlocked: string[];
  activeVariant: ScenarioVariant | null;
}

export function drawVictory(ctx: CanvasRenderingContext2D, state: VictoryState): BtnArea[] {
  const w = P.VICTORY_W, h = P.VICTORY_H;
  ctx.setTransform(DRAW_SCALE, 0, 0, DRAW_SCALE, 0, 0);
  ctx.clearRect(0, 0, w, h);
  panelBg(ctx, w, h, BD.gold);
  const PAD = 24;
  const btns: BtnArea[] = [];
  const rank = getRank(state.totalXP);

  ctx.font = '36px monospace'; ctx.textAlign = 'center';
  ctx.fillText(rank.badge, w / 2, 52);
  ctx.fillStyle = T.gold; ctx.font = 'bold 20px monospace';
  ctx.fillText('CASE CLOSED', w / 2, 82);
  ctx.fillStyle = T.muted; ctx.font = '11px monospace';
  ctx.fillText(`${state.scenarioTitle} — ${state.companyName}`, w / 2, 100);
  ctx.textAlign = 'left';
  hline(ctx, PAD, w - PAD, 114);

  // Root cause
  ctx.fillStyle = 'rgba(255,255,255,0.03)'; rr(ctx, PAD, 122, w - PAD * 2, 72, 8); ctx.fill();
  ctx.fillStyle = T.muted; ctx.font = 'bold 9px monospace';
  ctx.fillText('ROOT CAUSE', PAD + 10, 138);
  ctx.fillStyle = T.white; ctx.font = '11px monospace';
  wrapText(ctx, subst(state.rootCause, state.activeVariant), PAD + 10, 150, w - PAD * 2 - 20, 15, 3);

  // Stats grid
  const sY = 206;
  const cellW = (w - PAD * 2 - 16) / 3;
  const stats = [
    { label: 'Total XP',     value: state.totalXP.toLocaleString(), color: T.yellow },
    { label: 'Steps',        value: `${state.stepsCompleted}/${state.stepsCount}`, color: T.green },
    { label: 'Codex Unlocks',value: String(state.commandsUnlocked.length), color: T.cyan },
  ];
  stats.forEach(({ label, value, color }, i) => {
    const cx = PAD + i * (cellW + 8);
    ctx.fillStyle = 'rgba(255,255,255,0.04)'; rr(ctx, cx, sY, cellW, 54, 8); ctx.fill();
    ctx.fillStyle = color; ctx.font = 'bold 18px monospace'; ctx.textAlign = 'center';
    ctx.fillText(value, cx + cellW / 2, sY + 30);
    ctx.fillStyle = T.muted; ctx.font = '9px monospace';
    ctx.fillText(label, cx + cellW / 2, sY + 46);
  });
  ctx.textAlign = 'left';

  // Rank
  const rkY = 274;
  ctx.fillStyle = 'rgba(255,200,50,0.06)'; rr(ctx, PAD, rkY, w - PAD * 2, 38, 8); ctx.fill();
  ctx.strokeStyle = 'rgba(250,204,21,0.2)'; ctx.lineWidth = 1;
  rr(ctx, PAD + 0.5, rkY + 0.5, w - PAD * 2 - 1, 37, 8); ctx.stroke();
  ctx.fillStyle = T.muted; ctx.font = '9px monospace'; ctx.textAlign = 'center';
  ctx.fillText('CURRENT RANK', w / 2, rkY + 12);
  ctx.fillStyle = '#fef08a'; ctx.font = 'bold 14px monospace';
  ctx.fillText(rank.title, w / 2, rkY + 30);
  ctx.textAlign = 'left';

  // Commands
  let tagX = PAD; let tagY2 = 326;
  ctx.fillStyle = T.muted; ctx.font = '9px monospace';
  ctx.fillText('Commands learned:', PAD, tagY2 - 2);
  tagY2 += 10;
  for (const cmd of state.commandsUnlocked.slice(0, 12)) {
    ctx.font = '10px monospace';
    const tw3 = ctx.measureText(cmd).width + 12;
    if (tagX + tw3 > w - PAD) { tagX = PAD; tagY2 += 20; }
    ctx.fillStyle = 'rgba(8,40,55,0.7)'; rr(ctx, tagX, tagY2, tw3, 16, 4); ctx.fill();
    ctx.fillStyle = T.cyan; ctx.textBaseline = 'middle';
    ctx.fillText(cmd, tagX + 6, tagY2 + 8); ctx.textBaseline = 'alphabetic';
    tagX += tw3 + 6;
  }

  // Buttons
  const bW = (w - PAD * 2 - 12) / 2;
  btns.push({ ...drawBtn(ctx, PAD, h - PAD - 36, bW, 36, 'More Scenarios', 'rgba(29,78,216,0.8)', T.white), id:'more-scenarios' });
  btns.push({ ...drawBtn(ctx, PAD + bW + 12, h - PAD - 36, bW, 36, 'Main Menu', 'rgba(55,65,81,0.7)', T.muted), id:'main-menu' });

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return btns;
}

// ── Scenario Selector ─────────────────────────────────────────────────────────

export interface SelectorState {
  scenarios: ScenarioV2[];
  scenariosCompleted: number[];
  totalXP: number;
}

export function drawSelector(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  state: SelectorState
): BtnArea[] {
  ctx.setTransform(DRAW_SCALE, 0, 0, DRAW_SCALE, 0, 0);
  ctx.clearRect(0, 0, w, h);

  // Full-screen dark bg
  ctx.fillStyle = 'rgba(3,3,10,0.98)'; ctx.fillRect(0, 0, w, h);

  const PAD = 24;
  const btns: BtnArea[] = [];

  // Header
  ctx.fillStyle = T.cyan; ctx.font = 'bold 20px monospace'; ctx.textAlign = 'center';
  ctx.fillText('CHOOSE YOUR CASE', w / 2, 36);
  ctx.fillStyle = T.muted; ctx.font = '11px monospace';
  ctx.fillText(`${state.totalXP.toLocaleString()} XP earned across all cases`, w / 2, 54);
  ctx.textAlign = 'left';
  hline(ctx, PAD, w - PAD, 64);

  // Cards (2 columns)
  const cols = 2;
  const gap = 14;
  const cardW = Math.floor((w - PAD * 2 - gap) / cols);
  const cardH = 110;
  const startY = 78;

  const diffColors = ['', '#4ade80', '#60a5fa', '#facc15', '#fb923c', '#f87171'];

  state.scenarios.forEach((sc, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = PAD + col * (cardW + gap);
    const cy = startY + row * (cardH + gap);

    if (cy + cardH > h - PAD) return; // off screen

    const solved = state.scenariosCompleted.includes(i);
    ctx.fillStyle = solved ? 'rgba(20,40,25,0.85)' : 'rgba(14,14,30,0.85)';
    rr(ctx, cx, cy, cardW, cardH, 10); ctx.fill();
    ctx.strokeStyle = solved ? BD.green : BD.def; ctx.lineWidth = 1;
    rr(ctx, cx + 0.5, cy + 0.5, cardW - 1, cardH - 1, 10); ctx.stroke();

    // Difficulty stars
    ctx.fillStyle = diffColors[sc.difficulty] ?? T.muted;
    ctx.font = 'bold 11px monospace'; ctx.textBaseline = 'top';
    ctx.fillText(sc.stars, cx + 10, cy + 10);

    // Solved badge
    if (solved) {
      ctx.fillStyle = T.green; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'right';
      ctx.fillText('✓ SOLVED', cx + cardW - 10, cy + 10);
      ctx.textAlign = 'left';
    } else {
      ctx.fillStyle = T.dim; ctx.font = '10px monospace'; ctx.textAlign = 'right';
      ctx.fillText(`#${i + 1}`, cx + cardW - 10, cy + 10);
      ctx.textAlign = 'left';
    }

    // Title
    ctx.fillStyle = T.white; ctx.font = 'bold 13px monospace';
    ctx.fillText(sc.title, cx + 10, cy + 30);

    // Briefing truncated
    ctx.fillStyle = 'rgba(148,163,184,0.65)'; ctx.font = '10px monospace';
    let brief = sc.briefing.replace(/\{\{(\w+)\}\}/g, '…');
    while (brief.length > 10 && ctx.measureText(brief + '…').width > cardW - 20) brief = brief.slice(0, -1);
    if (brief !== sc.briefing.replace(/\{\{(\w+)\}\}/g, '…')) brief += '…';
    ctx.fillText(brief, cx + 10, cy + 50);

    // Tags
    let tagX2 = cx + 10; const tagY3 = cy + cardH - 24;
    for (const cmd of sc.commandsUnlocked.slice(0, 3)) {
      ctx.font = '9px monospace';
      const tw = ctx.measureText(cmd).width + 10;
      if (tagX2 + tw > cx + cardW - 10) break;
      ctx.fillStyle = 'rgba(30,50,80,0.7)'; rr(ctx, tagX2, tagY3, tw, 14, 3); ctx.fill();
      ctx.fillStyle = T.blue; ctx.textBaseline = 'middle';
      ctx.fillText(cmd, tagX2 + 5, tagY3 + 7); ctx.textBaseline = 'top';
      tagX2 += tw + 5;
    }
    if (sc.commandsUnlocked.length > 3) {
      ctx.fillStyle = T.dim; ctx.font = '9px monospace'; ctx.textBaseline = 'middle';
      ctx.fillText(`+${sc.commandsUnlocked.length - 3}`, tagX2 + 2, tagY3 + 7);
      ctx.textBaseline = 'top';
    }

    btns.push({ id: `select-${i}`, x: cx, y: cy, w: cardW, h: cardH });
  });

  ctx.textBaseline = 'alphabetic';
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return btns;
}
