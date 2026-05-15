// Curriculum: learning tracks that organise the 60+ scenarios into a structured path.
// Each lesson maps to an existing scenario by id; we only organise, never rewrite.

export interface Lesson {
  id: string;          // matches a Scenario.id
  title: string;
  durationMin: number;
  skills: string[];    // command names practised
}

export interface Track {
  id: string;
  title: string;
  description: string;
  totalHours: number;
  color: "cyan" | "violet" | "emerald" | "amber" | "rose";
  icon: string;        // SVG path data
  lessons: Lesson[];
}

export const TRACKS: Track[] = [
  {
    id: "fundamentals",
    title: "DQL Fundamentals",
    description: "Master the core building blocks — fetch, filter, sort, limit, and fields.",
    totalHours: 3,
    color: "cyan",
    icon: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4",
    lessons: [
      { id: "onboard-001", title: "Your first query", durationMin: 5, skills: ["fetch", "limit"] },
      { id: "onboard-002", title: "Filter: find what matters", durationMin: 7, skills: ["filter"] },
      { id: "onboard-003", title: "Sort & limit", durationMin: 6, skills: ["sort", "limit"] },
      { id: "onboard-004", title: "Pick your fields", durationMin: 6, skills: ["fields"] },
      { id: "onboard-005", title: "Filter out the noise", durationMin: 5, skills: ["filterOut"] },
      { id: "onboard-006", title: "Putting it together", durationMin: 8, skills: ["filter", "sort", "limit", "fields"] },
      { id: "case-001", title: "The Midnight Breach", durationMin: 10, skills: ["fetch", "filter", "parse"] },
      { id: "case-002", title: "Deployment Tracker", durationMin: 8, skills: ["filter"] },
      { id: "case-007", title: "The Missing Alert", durationMin: 8, skills: ["filter", "fields"] },
      { id: "case-009", title: "The Status Check", durationMin: 7, skills: ["filter", "limit"] },
    ],
  },
  {
    id: "logs-deep-dive",
    title: "Logs Deep-Dive",
    description: "Go beyond simple filters — parse structured data, expand arrays, and aggregate.",
    totalHours: 3,
    color: "violet",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    lessons: [
      { id: "case-010", title: "Search for keywords", durationMin: 6, skills: ["search"] },
      { id: "case-011", title: "Filter out the noise", durationMin: 7, skills: ["filterOut"] },
      { id: "case-004", title: "Span latency spike", durationMin: 8, skills: ["filter", "sort"] },
      { id: "case-012", title: "Host hunt", durationMin: 8, skills: ["filter", "parse"] },
      { id: "case-006", title: "The slow query heist", durationMin: 9, skills: ["filter", "sort", "parse"] },
      { id: "case-013", title: "Pattern recognition", durationMin: 8, skills: ["parse"] },
      { id: "case-014", title: "Expand your view", durationMin: 8, skills: ["expand"] },
      { id: "case-015", title: "Dedup deep-dive", durationMin: 7, skills: ["dedup"] },
    ],
  },
  {
    id: "aggregations",
    title: "Metrics & Aggregations",
    description: "Summarise, group, and visualise trends. From raw logs to meaningful numbers.",
    totalHours: 2,
    color: "emerald",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    lessons: [
      { id: "case-003", title: "The phantom orders", durationMin: 8, skills: ["summarize"] },
      { id: "case-005", title: "Error storm timeseries", durationMin: 9, skills: ["makeTimeseries"] },
      { id: "case-008", title: "Dedup and aggregate", durationMin: 8, skills: ["dedup", "summarize"] },
      { id: "case-016", title: "Count and group", durationMin: 8, skills: ["summarize"] },
      { id: "case-017", title: "Time bucketing", durationMin: 9, skills: ["makeTimeseries"] },
      { id: "case-018", title: "Top-N analysis", durationMin: 8, skills: ["summarize", "sort", "limit"] },
    ],
  },
  {
    id: "dpl-mastery",
    title: "DPL Mastery",
    description: "Extract meaning from unstructured log lines with Dynatrace Pattern Language.",
    totalHours: 2,
    color: "amber",
    icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4",
    lessons: [
      { id: "dpl-001", title: "Your first pattern", durationMin: 8, skills: ["parse"] },
      { id: "dpl-002", title: "Capture groups", durationMin: 8, skills: ["parse"] },
      { id: "dpl-003", title: "Optional fields", durationMin: 7, skills: ["parse"] },
      { id: "dpl-004", title: "Nested patterns", durationMin: 9, skills: ["parse"] },
      { id: "dpl-005", title: "Real log extraction", durationMin: 10, skills: ["parse"] },
      { id: "dpl-006", title: "DPL + filter combo", durationMin: 9, skills: ["parse", "filter"] },
    ],
  },
  {
    id: "real-incidents",
    title: "Real Incidents",
    description: "Solve 10 curated cases based on real-world Dynatrace observability scenarios.",
    totalHours: 4,
    color: "rose",
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
    lessons: [
      { id: "case-019", title: "The memory leak", durationMin: 10, skills: ["filter", "sort", "makeTimeseries"] },
      { id: "case-020", title: "CPU spike investigation", durationMin: 10, skills: ["filter", "summarize"] },
      { id: "case-021", title: "The broken deploy", durationMin: 9, skills: ["filter", "parse"] },
      { id: "case-022", title: "Network timeout storm", durationMin: 10, skills: ["filter", "makeTimeseries"] },
      { id: "case-023", title: "Auth failure cascade", durationMin: 10, skills: ["parse", "summarize"] },
      { id: "case-024", title: "Database overload", durationMin: 10, skills: ["filter", "sort", "limit"] },
      { id: "case-025", title: "The silent alert", durationMin: 9, skills: ["search", "filter"] },
      { id: "case-026", title: "Distributed trace puzzle", durationMin: 12, skills: ["filter", "fields", "sort"] },
      { id: "case-027", title: "Cost anomaly", durationMin: 10, skills: ["summarize", "makeTimeseries"] },
      { id: "case-028", title: "The final incident", durationMin: 15, skills: ["filter", "parse", "summarize", "makeTimeseries"] },
    ],
  },
];

export const TRACK_COLORS = {
  cyan: { bg: "bg-cyan-500/10", border: "border-cyan-500/20", text: "text-cyan-400", bar: "bg-cyan-500" },
  violet: { bg: "bg-violet-500/10", border: "border-violet-500/20", text: "text-violet-400", bar: "bg-violet-500" },
  emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400", bar: "bg-emerald-500" },
  amber: { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400", bar: "bg-amber-500" },
  rose: { bg: "bg-rose-500/10", border: "border-rose-500/20", text: "text-rose-400", bar: "bg-rose-500" },
} as const;

export function getTrackProgress(trackId: string, trackProgress: Record<string, { completedLessons: string[] }>) {
  const progress = trackProgress[trackId];
  if (!progress) return 0;
  const track = TRACKS.find((t) => t.id === trackId);
  if (!track) return 0;
  return Math.round((progress.completedLessons.length / track.lessons.length) * 100);
}

export function getNextLesson(trackId: string, trackProgress: Record<string, { completedLessons: string[]; currentLessonId: string }>) {
  const track = TRACKS.find((t) => t.id === trackId);
  if (!track) return null;
  const progress = trackProgress[trackId];
  if (!progress) return track.lessons[0];
  const nextIndex = track.lessons.findIndex((l) => !progress.completedLessons.includes(l.id));
  return nextIndex >= 0 ? track.lessons[nextIndex] : null;
}
