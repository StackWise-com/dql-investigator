"use client";

import { motion } from "framer-motion";

export type ChibiCharacterId =
  | "detective"
  | "santa"
  | "tony-stark"
  | "batman"
  | "cyborg"
  | "sherlock"
  | "spider-man"
  | "doctor-strange"
  | "black-panther"
  | "wall-e"
  | "doraemon";

export type ChibiMood = "neutral" | "thinking" | "excited" | "victory";

interface ChibiCharacterProps {
  character: ChibiCharacterId;
  mood: ChibiMood;
  size?: number;
  className?: string;
}

const THEME_COLORS: Record<ChibiCharacterId, string> = {
  detective: "#f59e0b",
  santa: "#ef4444",
  "tony-stark": "#f59e0b",
  batman: "#94a3b8",
  cyborg: "#06b6d4",
  sherlock: "#8b5cf6",
  "spider-man": "#ef4444",
  "doctor-strange": "#a855f7",
  "black-panther": "#475569",
  "wall-e": "#eab308",
  doraemon: "#3b82f6",
};

function ArmLeft({ mood, color }: { mood: ChibiMood; color: string }) {
  if (mood === "victory") {
    return (
      <motion.g initial={{ rotate: 0 }} animate={{ rotate: -25 }} transition={{ type: "spring" }}>
        <rect x="14" y="38" width="8" height="22" rx="4" fill={color} />
        <circle cx="18" cy="36" r="5" fill="#fde047" />
      </motion.g>
    );
  }
  if (mood === "excited") {
    return <rect x="16" y="40" width="8" height="18" rx="4" fill={color} transform="rotate(-15 20 49)" />;
  }
  if (mood === "thinking") {
    return (
      <g>
        <rect x="14" y="38" width="8" height="20" rx="4" fill={color} />
        <circle cx="18" cy="34" r="4.5" fill="#fde047" />
      </g>
    );
  }
  return <rect x="14" y="42" width="8" height="18" rx="4" fill={color} />;
}

function ArmRight({ mood, color }: { mood: ChibiMood; color: string }) {
  if (mood === "victory") {
    return (
      <motion.g initial={{ rotate: 0 }} animate={{ rotate: 25 }} transition={{ type: "spring" }}>
        <rect x="38" y="38" width="8" height="22" rx="4" fill={color} />
        <circle cx="42" cy="36" r="5" fill="#fde047" />
      </motion.g>
    );
  }
  if (mood === "excited") {
    return <rect x="36" y="40" width="8" height="18" rx="4" fill={color} transform="rotate(15 40 49)" />;
  }
  if (mood === "thinking") {
    return <rect x="38" y="42" width="8" height="18" rx="4" fill={color} />;
  }
  return <rect x="38" y="42" width="8" height="18" rx="4" fill={color} />;
}

function Eyes({ mood }: { mood: ChibiMood }) {
  if (mood === "thinking") {
    return (
      <g>
        <circle cx="26" cy="26" r="2.5" fill="#1e293b" />
        <circle cx="34" cy="26" r="2.5" fill="#1e293b" />
        <path d="M23 22 Q26 20 29 22" stroke="#1e293b" strokeWidth="0.8" fill="none" />
      </g>
    );
  }
  if (mood === "victory" || mood === "excited") {
    return (
      <g>
        <path d="M23 25 Q26 22 29 25" stroke="#1e293b" strokeWidth="1.2" fill="none" />
        <path d="M31 25 Q34 22 37 25" stroke="#1e293b" strokeWidth="1.2" fill="none" />
      </g>
    );
  }
  return (
    <g>
      <circle cx="26" cy="26" r="2.5" fill="#1e293b" />
      <circle cx="34" cy="26" r="2.5" fill="#1e293b" />
    </g>
  );
}

function Mouth({ mood }: { mood: ChibiMood }) {
  if (mood === "victory" || mood === "excited") {
    return <path d="M26 32 Q30 37 34 32" stroke="#1e293b" strokeWidth="1.2" fill="none" strokeLinecap="round" />;
  }
  if (mood === "thinking") {
    return <circle cx="30" cy="33" r="1.5" fill="#1e293b" />;
  }
  return <path d="M27 33 Q30 35 33 33" stroke="#1e293b" strokeWidth="1" fill="none" strokeLinecap="round" />;
}

function BaseBody({ color }: { color: string }) {
  return (
    <g>
      {/* Body */}
      <rect x="20" y="36" width="20" height="22" rx="6" fill={color} />
      {/* Legs */}
      <rect x="22" y="56" width="7" height="12" rx="3" fill="#334155" />
      <rect x="31" y="56" width="7" height="12" rx="3" fill="#334155" />
      {/* Head */}
      <circle cx="30" cy="24" r="14" fill="#fde047" />
      {/* Blush */}
      <circle cx="22" cy="28" r="2" fill="#fca5a5" opacity="0.6" />
      <circle cx="38" cy="28" r="2" fill="#fca5a5" opacity="0.6" />
    </g>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DETECTIVE (Demo)
   ═══════════════════════════════════════════════════════════════ */
function DetectiveSVG({ mood, size }: { mood: ChibiMood; size: number }) {
  const color = "#64748b";
  return (
    <svg width={size} height={size} viewBox="0 0 60 70" className="drop-shadow-lg">
      <BaseBody color={color} />
      <Eyes mood={mood} />
      <Mouth mood={mood} />
      {/* Deerstalker hat */}
      <rect x="18" y="10" width="24" height="6" rx="2" fill="#78350f" />
      <path d="M20 10 Q30 2 40 10" fill="#78350f" />
      <circle cx="18" cy="12" r="3" fill="#78350f" />
      <circle cx="42" cy="12" r="3" fill="#78350f" />
      <rect x="24" y="16" width="12" height="2" fill="#451a03" />
      <ArmLeft mood={mood} color={color} />
      <ArmRight mood={mood} color={color} />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SANTA
   ═══════════════════════════════════════════════════════════════ */
function SantaSVG({ mood, size }: { mood: ChibiMood; size: number }) {
  const color = "#dc2626";
  return (
    <svg width={size} height={size} viewBox="0 0 60 70" className="drop-shadow-lg">
      <BaseBody color={color} />
      <Eyes mood={mood} />
      <Mouth mood={mood} />
      {/* White trim */}
      <rect x="20" y="50" width="20" height="6" rx="2" fill="#f8fafc" />
      <rect x="18" y="34" width="24" height="5" rx="2" fill="#f8fafc" />
      {/* Santa hat */}
      <path d="M18 16 Q30 0 42 16" fill="#dc2626" />
      <rect x="18" y="14" width="24" height="5" rx="2" fill="#f8fafc" />
      <circle cx="42" cy="8" r="4" fill="#f8fafc" />
      {/* Beard */}
      <path d="M20 30 Q30 42 40 30" fill="#f8fafc" />
      <ArmLeft mood={mood} color={color} />
      <ArmRight mood={mood} color={color} />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TONY STARK (Iron Man simplified)
   ═══════════════════════════════════════════════════════════════ */
function TonyStarkSVG({ mood, size }: { mood: ChibiMood; size: number }) {
  const color = "#b91c1c";
  return (
    <svg width={size} height={size} viewBox="0 0 60 70" className="drop-shadow-lg">
      <BaseBody color={color} />
      <Eyes mood={mood} />
      <Mouth mood={mood} />
      {/* Arc reactor */}
      <circle cx="30" cy="46" r="4" fill="#06b6d4" />
      <circle cx="30" cy="46" r="2" fill="#67e8f9" />
      {/* Helmet hints */}
      <rect x="24" y="14" width="12" height="4" rx="1" fill="#f59e0b" />
      <path d="M20 18 L24 14 L24 18 Z" fill="#f59e0b" />
      <path d="M40 18 L36 14 L36 18 Z" fill="#f59e0b" />
      <ArmLeft mood={mood} color={color} />
      <ArmRight mood={mood} color={color} />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   BATMAN
   ═══════════════════════════════════════════════════════════════ */
function BatmanSVG({ mood, size }: { mood: ChibiMood; size: number }) {
  const color = "#1e293b";
  return (
    <svg width={size} height={size} viewBox="0 0 60 70" className="drop-shadow-lg">
      <BaseBody color={color} />
      <Eyes mood={mood} />
      <Mouth mood={mood} />
      {/* Belt */}
      <rect x="22" y="48" width="16" height="4" rx="1" fill="#fbbf24" />
      <rect x="28" y="48" width="4" height="4" fill="#f59e0b" />
      {/* Cowl ears */}
      <path d="M22 14 L18 4 L26 12 Z" fill="#1e293b" />
      <path d="M38 14 L42 4 L34 12 Z" fill="#1e293b" />
      {/* Cowl eye mask */}
      <path d="M20 22 Q30 18 40 22 L40 26 Q30 22 20 26 Z" fill="#1e293b" />
      <ArmLeft mood={mood} color={color} />
      <ArmRight mood={mood} color={color} />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CYBORG
   ═══════════════════════════════════════════════════════════════ */
function CyborgSVG({ mood, size }: { mood: ChibiMood; size: number }) {
  const color = "#0891b2";
  return (
    <svg width={size} height={size} viewBox="0 0 60 70" className="drop-shadow-lg">
      <BaseBody color={color} />
      <Eyes mood={mood} />
      <Mouth mood={mood} />
      {/* Robot eye visor */}
      <rect x="22" y="22" width="16" height="5" rx="2" fill="#ef4444" />
      <circle cx="26" cy="24.5" r="1.5" fill="#ef4444" />
      <circle cx="34" cy="24.5" r="1.5" fill="#ef4444" />
      {/* Cybernetic arm hint */}
      <rect x="38" y="42" width="10" height="6" rx="2" fill="#64748b" />
      <rect x="40" y="44" width="6" height="2" rx="1" fill="#22d3ee" />
      <ArmLeft mood={mood} color={color} />
      <ArmRight mood={mood} color="#64748b" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SHERLOCK
   ═══════════════════════════════════════════════════════════════ */
function SherlockSVG({ mood, size }: { mood: ChibiMood; size: number }) {
  const color = "#7c3aed";
  return (
    <svg width={size} height={size} viewBox="0 0 60 70" className="drop-shadow-lg">
      <BaseBody color={color} />
      <Eyes mood={mood} />
      <Mouth mood={mood} />
      {/* Deerstalker */}
      <rect x="18" y="10" width="24" height="6" rx="2" fill="#78350f" />
      <path d="M20 10 Q30 2 40 10" fill="#78350f" />
      <circle cx="18" cy="12" r="3" fill="#78350f" />
      <circle cx="42" cy="12" r="3" fill="#78350f" />
      {/* Inverness cape hint */}
      <path d="M16 36 Q12 48 16 56" stroke="#7c3aed" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M44 36 Q48 48 44 56" stroke="#7c3aed" strokeWidth="3" fill="none" strokeLinecap="round" />
      <ArmLeft mood={mood} color={color} />
      <ArmRight mood={mood} color={color} />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SPIDER-MAN
   ═══════════════════════════════════════════════════════════════ */
function SpiderManSVG({ mood, size }: { mood: ChibiMood; size: number }) {
  const color = "#dc2626";
  return (
    <svg width={size} height={size} viewBox="0 0 60 70" className="drop-shadow-lg">
      <BaseBody color={color} />
      <Eyes mood={mood} />
      <Mouth mood={mood} />
      {/* Web pattern on mask */}
      <path d="M24 14 Q30 20 36 14" stroke="#3b82f6" strokeWidth="0.8" fill="none" />
      <path d="M22 18 Q30 24 38 18" stroke="#3b82f6" strokeWidth="0.8" fill="none" />
      {/* Large eye lenses */}
      <ellipse cx="25" cy="24" rx="4" ry="5" fill="#fff" transform="rotate(-10 25 24)" />
      <ellipse cx="35" cy="24" rx="4" ry="5" fill="#fff" transform="rotate(10 35 24)" />
      <ellipse cx="25" cy="24" rx="2.5" ry="3.5" fill="#1e293b" transform="rotate(-10 25 24)" />
      <ellipse cx="35" cy="24" rx="2.5" ry="3.5" fill="#1e293b" transform="rotate(10 35 24)" />
      {/* Spider emblem */}
      <circle cx="30" cy="46" r="3" fill="#1e293b" />
      <path d="M30 43 L30 49 M27 46 L33 46" stroke="#1e293b" strokeWidth="0.6" />
      <ArmLeft mood={mood} color={color} />
      <ArmRight mood={mood} color={color} />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DOCTOR STRANGE
   ═══════════════════════════════════════════════════════════════ */
function DoctorStrangeSVG({ mood, size }: { mood: ChibiMood; size: number }) {
  const color = "#9333ea";
  return (
    <svg width={size} height={size} viewBox="0 0 60 70" className="drop-shadow-lg">
      <BaseBody color={color} />
      <Eyes mood={mood} />
      <Mouth mood={mood} />
      {/* Eye of Agamotto */}
      <circle cx="30" cy="46" r="4" fill="#10b981" />
      <circle cx="30" cy="46" r="2" fill="#34d399" />
      {/* High collar */}
      <path d="M20 34 L16 20 L24 34 Z" fill="#7e22ce" />
      <path d="M40 34 L44 20 L36 34 Z" fill="#7e22ce" />
      {/* Gray temples */}
      <rect x="20" y="14" width="4" height="8" rx="1" fill="#94a3b8" />
      <rect x="36" y="14" width="4" height="8" rx="1" fill="#94a3b8" />
      <ArmLeft mood={mood} color={color} />
      <ArmRight mood={mood} color={color} />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   BLACK PANTHER
   ═══════════════════════════════════════════════════════════════ */
function BlackPantherSVG({ mood, size }: { mood: ChibiMood; size: number }) {
  const color = "#0f172a";
  return (
    <svg width={size} height={size} viewBox="0 0 60 70" className="drop-shadow-lg">
      <BaseBody color={color} />
      <Eyes mood={mood} />
      <Mouth mood={mood} />
      {/* Necklace */}
      <rect x="22" y="42" width="16" height="3" rx="1" fill="#06b6d4" />
      <circle cx="30" cy="44" r="2" fill="#67e8f9" />
      {/* Mask ears */}
      <path d="M22 14 L18 4 L26 12 Z" fill="#0f172a" />
      <path d="M38 14 L42 4 L34 12 Z" fill="#0f172a" />
      {/* Silver accents */}
      <path d="M24 22 L30 28 L36 22" stroke="#94a3b8" strokeWidth="1" fill="none" />
      <path d="M20 36 L24 42 L20 48" stroke="#94a3b8" strokeWidth="1" fill="none" />
      <path d="M40 36 L36 42 L40 48" stroke="#94a3b8" strokeWidth="1" fill="none" />
      <ArmLeft mood={mood} color={color} />
      <ArmRight mood={mood} color={color} />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   WALL-E
   ═══════════════════════════════════════════════════════════════ */
function WallESVG({ mood, size }: { mood: ChibiMood; size: number }) {
  const color = "#ca8a04";
  return (
    <svg width={size} height={size} viewBox="0 0 60 70" className="drop-shadow-lg">
      {/* Boxy body */}
      <rect x="16" y="36" width="28" height="24" rx="3" fill={color} />
      <rect x="18" y="50" width="24" height="6" rx="1" fill="#a16207" />
      {/* Tracks */}
      <rect x="14" y="58" width="10" height="8" rx="2" fill="#334155" />
      <rect x="36" y="58" width="10" height="8" rx="2" fill="#334155" />
      {/* Head */}
      <rect x="20" y="14" width="20" height="18" rx="3" fill="#e2e8f0" />
      <rect x="22" y="16" width="16" height="6" rx="1" fill="#94a3b8" />
      {/* Eyes */}
      <circle cx="26" cy="24" r="3" fill="#1e293b" />
      <circle cx="34" cy="24" r="3" fill="#1e293b" />
      {mood === "victory" || mood === "excited" ? (
        <path d="M26 20 Q28 18 30 20" stroke="#1e293b" strokeWidth="0.6" fill="none" />
      ) : null}
      {/* Solar charge level */}
      <rect x="22" y="40" width="16" height="3" rx="1" fill="#22c55e" />
      <ArmLeft mood={mood} color={color} />
      <ArmRight mood={mood} color={color} />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DORAEMON
   ═══════════════════════════════════════════════════════════════ */
function DoraemonSVG({ mood, size }: { mood: ChibiMood; size: number }) {
  const color = "#2563eb";
  return (
    <svg width={size} height={size} viewBox="0 0 60 70" className="drop-shadow-lg">
      {/* Round body */}
      <circle cx="30" cy="48" r="14" fill={color} />
      <circle cx="30" cy="48" r="10" fill="#fff" />
      {/* White face */}
      <circle cx="30" cy="24" r="14" fill="#fff" />
      {/* Eyes */}
      <ellipse cx="26" cy="18" rx="4" ry="5" fill="#fff" stroke="#1e293b" strokeWidth="0.8" />
      <ellipse cx="34" cy="18" rx="4" ry="5" fill="#fff" stroke="#1e293b" strokeWidth="0.8" />
      <circle cx="26" cy="18" r="1.5" fill="#1e293b" />
      <circle cx="34" cy="18" r="1.5" fill="#1e293b" />
      {/* Nose */}
      <circle cx="30" cy="24" r="3" fill="#dc2626" />
      <line x1="30" y1="27" x2="30" y2="32" stroke="#1e293b" strokeWidth="0.8" />
      {/* Mouth */}
      <path d="M24 32 Q30 36 36 32" stroke="#1e293b" strokeWidth="0.8" fill="none" />
      {/* Whiskers */}
      <line x1="18" y1="26" x2="24" y2="27" stroke="#1e293b" strokeWidth="0.6" />
      <line x1="18" y1="29" x2="24" y2="29" stroke="#1e293b" strokeWidth="0.6" />
      <line x1="36" y1="27" x2="42" y2="26" stroke="#1e293b" strokeWidth="0.6" />
      <line x1="36" y1="29" x2="42" y2="29" stroke="#1e293b" strokeWidth="0.6" />
      {/* Collar bell */}
      <rect x="22" y="34" width="16" height="3" rx="1" fill="#dc2626" />
      <circle cx="30" cy="38" r="3" fill="#fbbf24" />
      <circle cx="30" cy="38" r="1" fill="#1e293b" />
      {/* Pocket */}
      <path d="M24 48 Q30 56 36 48" stroke="#1e293b" strokeWidth="0.8" fill="none" />
      <ArmLeft mood={mood} color={color} />
      <ArmRight mood={mood} color={color} />
    </svg>
  );
}

export function ChibiCharacter({ character, mood, size = 180, className = "" }: ChibiCharacterProps) {
  const variants = {
    neutral: { scale: 1, y: 0 },
    thinking: { scale: 1, y: 0, rotate: 2 },
    excited: { scale: 1.05, y: -4 },
    victory: { scale: 1.15, y: -8 },
  };

  const renderCharacter = () => {
    switch (character) {
      case "detective":
        return <DetectiveSVG mood={mood} size={size} />;
      case "santa":
        return <SantaSVG mood={mood} size={size} />;
      case "tony-stark":
        return <TonyStarkSVG mood={mood} size={size} />;
      case "batman":
        return <BatmanSVG mood={mood} size={size} />;
      case "cyborg":
        return <CyborgSVG mood={mood} size={size} />;
      case "sherlock":
        return <SherlockSVG mood={mood} size={size} />;
      case "spider-man":
        return <SpiderManSVG mood={mood} size={size} />;
      case "doctor-strange":
        return <DoctorStrangeSVG mood={mood} size={size} />;
      case "black-panther":
        return <BlackPantherSVG mood={mood} size={size} />;
      case "wall-e":
        return <WallESVG mood={mood} size={size} />;
      case "doraemon":
        return <DoraemonSVG mood={mood} size={size} />;
      default:
        return <DetectiveSVG mood={mood} size={size} />;
    }
  };

  return (
    <motion.div
      className={`inline-block ${className}`}
      animate={variants[mood]}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      {renderCharacter()}
    </motion.div>
  );
}
