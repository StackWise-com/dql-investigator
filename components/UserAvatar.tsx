"use client";

import { getRank } from "@/lib/progression";
import { useInvestigatorStore } from "@/lib/store/useInvestigatorStore";
import { getAnimalEmoji } from "@/lib/avatars";

function stringToHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

function seededRandom(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

function generateAvatarSVG(seed: string, size = 64): string {
  const hash = stringToHash(seed || "default");
  const colors = [
    "#22d3ee", "#34d399", "#a78bfa", "#f472b6",
    "#fb923c", "#fbbf24", "#60a5fa", "#f87171",
  ];
  const bg = colors[hash % colors.length];
  const secondary = colors[(hash + 3) % colors.length];

  const shapes: string[] = [];
  const grid = 4;
  const cell = size / grid;

  for (let row = 0; row < grid; row++) {
    for (let col = 0; col < grid; col++) {
      const idx = row * grid + col;
      const r = seededRandom(hash + idx);
      if (r < 0.5) {
        const cx = col * cell + cell / 2;
        const cy = row * cell + cell / 2;
        const radius = (cell / 2) * (0.6 + seededRandom(hash + idx + 100) * 0.4);
        shapes.push(
          `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${secondary}" opacity="0.7"/>`
        );
      } else if (r < 0.8) {
        const x = col * cell + cell * 0.1;
        const y = row * cell + cell * 0.1;
        const w = cell * 0.8;
        const h = cell * 0.8;
        const rx = seededRandom(hash + idx + 50) * 8;
        shapes.push(
          `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${bg}" opacity="0.6"/>`
        );
      }
    }
  }

  // Central highlight
  shapes.push(
    `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 5}" fill="${bg}" opacity="0.9"/>`
  );

  return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'><rect width='100%25' height='100%25' fill='%230f172a'/><g>${shapes.join("")}</g></svg>`;
}

interface UserAvatarProps {
  email: string;
  xp: number;
  size?: number;
  showTitle?: boolean;
  emoji?: string;
}

export function UserAvatar({ email, xp, size = 32, showTitle = true, emoji }: UserAvatarProps) {
  const rank = getRank(xp);
  const gameHighScores = useInvestigatorStore((s) => s.gameHighScores);
  const totalArcade = Object.values(gameHighScores).reduce((a, b) => a + b, 0);
  const resolvedEmoji = emoji || getAnimalEmoji(email);

  return (
    <div className="flex items-center gap-2">
      <div
        className="rounded-full border border-white/10 shadow-sm overflow-hidden flex-shrink-0 flex items-center justify-center bg-slate-900"
        style={{ width: size, height: size, fontSize: size * 0.65 }}
      >
        {resolvedEmoji}
      </div>
      {showTitle && (
        <div className="flex flex-col leading-none">
          <span className="text-[10px] font-semibold text-slate-200">{rank.title}</span>
          <span className="text-[9px] text-slate-500">{rank.emoji} {xp} XP{totalArcade > 0 && ` · 🎮 ${totalArcade}`}</span>
        </div>
      )}
    </div>
  );
}
