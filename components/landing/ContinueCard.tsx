"use client";

import { useInvestigatorStore } from "@/lib/store/useInvestigatorStore";
import { TRACKS, getNextLesson } from "@/lib/curriculum/tracks";

interface ContinueCardProps {
  onResume: (trackId: string, lessonId: string) => void;
  onStartFresh: () => void;
}

function formatTimeAgo(isoDate: string): string {
  const ms = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(ms / 60000);
  const hours = Math.floor(ms / 3600000);
  const days = Math.floor(ms / 86400000);
  if (mins < 2) return "just now";
  if (hours < 1) return `${mins}m ago`;
  if (days < 1) return `${hours}h ago`;
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

export function ContinueCard({ onResume, onStartFresh }: ContinueCardProps) {
  const lastActiveAt = useInvestigatorStore((s) => s.lastActiveAt);
  const trackProgress = useInvestigatorStore((s) => s.trackProgress);
  const streak = useInvestigatorStore((s) => s.streak);

  // Find the most recently active track with incomplete lessons
  const activeTrack = TRACKS.find((t) => {
    const p = trackProgress[t.id];
    return p && p.completedLessons.length > 0 && p.completedLessons.length < t.lessons.length;
  }) || TRACKS[0];

  const nextLesson = getNextLesson(activeTrack.id, trackProgress);
  const progress = trackProgress[activeTrack.id];
  const completedCount = progress?.completedLessons.length || 0;

  if (!lastActiveAt || completedCount === 0) {
    // First-time user
    return (
      <div className="bg-accent/8 border border-accent/20 rounded-xl p-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-100 mb-1">Start your DQL journey</h2>
          <p className="text-sm text-slate-400">30 days to go from zero to Dynatrace power user. Begin with the fundamentals.</p>
        </div>
        <button
          onClick={() => onResume(TRACKS[0].id, TRACKS[0].lessons[0].id)}
          className="shrink-0 px-4 py-2 bg-accent text-slate-950 text-sm font-semibold rounded-lg hover:bg-accent/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        >
          Begin Track 1 →
        </button>
      </div>
    );
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const streakAtRisk = streak.lastVisitDate && streak.lastVisitDate < todayStr && streak.current > 0;

  return (
    <div className="bg-slate-900/80 border border-white/[0.08] rounded-xl p-5 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-slate-500">Continue</span>
          <span className="text-xs text-slate-600">·</span>
          <span className="text-xs text-slate-500">{lastActiveAt ? formatTimeAgo(lastActiveAt) : ""}</span>
          {streakAtRisk && (
            <span className="text-xs text-amber-400 font-medium">· ⚠ Streak at risk today</span>
          )}
        </div>
        <h2 className="text-base font-semibold text-slate-100 truncate mb-0.5">
          {nextLesson?.title || "All lessons complete"}
        </h2>
        <p className="text-xs text-slate-400">{activeTrack.title} · lesson {completedCount + 1} of {activeTrack.lessons.length}</p>
      </div>
      {nextLesson && (
        <button
          onClick={() => onResume(activeTrack.id, nextLesson.id)}
          className="shrink-0 px-4 py-2 bg-accent text-slate-950 text-sm font-semibold rounded-lg hover:bg-accent/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        >
          Resume →
        </button>
      )}
    </div>
  );
}
