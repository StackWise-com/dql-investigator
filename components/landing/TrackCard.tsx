"use client";

import { useInvestigatorStore } from "@/lib/store/useInvestigatorStore";
import { TRACKS, TRACK_COLORS, getTrackProgress, getNextLesson, type Track } from "@/lib/curriculum/tracks";

interface TrackCardProps {
  track: Track;
  onStart: (trackId: string, lessonId: string) => void;
}

export function TrackCard({ track, onStart }: TrackCardProps) {
  const trackProgress = useInvestigatorStore((s) => s.trackProgress);
  const pct = getTrackProgress(track.id, trackProgress);
  const nextLesson = getNextLesson(track.id, trackProgress);
  const colors = TRACK_COLORS[track.color];
  const completedCount = trackProgress[track.id]?.completedLessons.length || 0;
  const isComplete = completedCount === track.lessons.length;

  return (
    <div className={`group relative bg-slate-900/80 border ${colors.border} rounded-xl p-5 hover:bg-slate-900 transition-colors`}>
      {isComplete && (
        <div className={`absolute top-3 right-3 text-xs font-medium ${colors.text} flex items-center gap-1`}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
            <path d="M3 8l4 4 6-6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Complete
        </div>
      )}
      <div className="flex items-start gap-3 mb-4">
        <div className={`w-9 h-9 rounded-lg ${colors.bg} flex items-center justify-center shrink-0`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={`w-5 h-5 ${colors.text}`}>
            <path d={track.icon} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-100 mb-0.5 truncate">{track.title}</h3>
          <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{track.description}</p>
        </div>
      </div>
      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-slate-500">{completedCount}/{track.lessons.length} lessons</span>
          <span className={`text-xs font-medium ${colors.text}`}>{pct}%</span>
        </div>
        <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className={`h-full ${colors.bar} rounded-full transition-all duration-700`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      {/* Duration */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-600">{track.totalHours}h total · {track.lessons.length} lessons</span>
        {!isComplete && nextLesson && (
          <button
            onClick={() => onStart(track.id, nextLesson.id)}
            className={`text-xs font-medium ${colors.text} hover:underline flex items-center gap-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded`}
          >
            {completedCount > 0 ? "Continue" : "Start"}
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
              <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export function TrackGrid({ onStart }: { onStart: (trackId: string, lessonId: string) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      {TRACKS.map((track) => (
        <TrackCard key={track.id} track={track} onStart={onStart} />
      ))}
    </div>
  );
}
