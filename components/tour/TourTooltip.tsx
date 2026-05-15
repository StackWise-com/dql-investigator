"use client";

import { motion } from "framer-motion";
import type { TourStep } from "./tour-config";

interface TourTooltipProps {
  step: TourStep;
  stepIndex: number;
  totalSteps: number;
  targetRect: DOMRect | null;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

const GAP = 16;
const TOOLTIP_WIDTH = 320;
const TOOLTIP_MIN_HEIGHT = 140;

export function TourTooltip({
  step,
  stepIndex,
  totalSteps,
  targetRect,
  onNext,
  onBack,
  onSkip,
}: TourTooltipProps) {
  const placement = computePlacement(step.placement, targetRect);
  const position = computePosition(placement, targetRect);
  const isLast = stepIndex === totalSteps - 1;
  const isFirst = stepIndex === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={{ duration: 0.2 }}
      className="fixed z-[62]"
      style={{
        top: position.top,
        left: position.left,
        width: TOOLTIP_WIDTH,
      }}
    >
      {/* Arrow */}
      {targetRect && (
        <div
          className="absolute w-3 h-3 bg-slate-900/95 border border-white/[0.08] rotate-45"
          style={getArrowStyle(placement)}
        />
      )}

      {/* Card */}
      <div className="relative glass-panel-strong rounded-xl border border-white/[0.08] shadow-2xl shadow-black/40 p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-100 leading-snug">{step.title}</h3>
          <span className="shrink-0 text-xs text-slate-500 font-medium">
            {stepIndex + 1} / {totalSteps}
          </span>
        </div>

        {/* Body */}
        <p className="text-xs text-slate-400 leading-relaxed">{step.description}</p>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={onSkip}
            className="text-xs font-medium text-slate-500 hover:text-slate-300 transition-colors"
          >
            Skip Tour
          </button>

          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                onClick={onBack}
                className="px-2.5 py-1 rounded-md text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors border border-white/[0.06]"
              >
                Back
              </button>
            )}
            <button
              onClick={onNext}
              className="px-3 py-1.5 rounded-md text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors shadow-lg shadow-cyan-400/20"
            >
              {isLast ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function computePlacement(
  preferred: TourStep["placement"],
  targetRect: DOMRect | null
): "top" | "bottom" | "left" | "right" {
  if (!targetRect) return "bottom";
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // If preferred placement fits, use it
  if (preferred) {
    if (fits(preferred, targetRect, vw, vh)) return preferred;
  }

  // Try all placements in order of preference
  const order: Array<"top" | "bottom" | "left" | "right"> = ["bottom", "top", "right", "left"];
  for (const p of order) {
    if (fits(p, targetRect, vw, vh)) return p;
  }
  return "bottom";
}

function fits(
  placement: "top" | "bottom" | "left" | "right",
  rect: DOMRect,
  vw: number,
  vh: number
): boolean {
  switch (placement) {
    case "bottom":
      return rect.bottom + GAP + TOOLTIP_MIN_HEIGHT <= vh && TOOLTIP_WIDTH <= vw;
    case "top":
      return rect.top - GAP - TOOLTIP_MIN_HEIGHT >= 0 && TOOLTIP_WIDTH <= vw;
    case "left":
      return rect.left - GAP - TOOLTIP_WIDTH >= 0;
    case "right":
      return rect.right + GAP + TOOLTIP_WIDTH <= vw;
  }
}

function computePosition(
  placement: "top" | "bottom" | "left" | "right",
  targetRect: DOMRect | null
): { top: number; left: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  if (!targetRect) {
    // Center on screen
    return {
      top: Math.max(16, vh / 2 - TOOLTIP_MIN_HEIGHT / 2),
      left: Math.max(16, vw / 2 - TOOLTIP_WIDTH / 2),
    };
  }

  let top = 0;
  let left = 0;

  switch (placement) {
    case "bottom": {
      top = targetRect.bottom + GAP;
      left = targetRect.left + targetRect.width / 2 - TOOLTIP_WIDTH / 2;
      break;
    }
    case "top": {
      top = targetRect.top - GAP - TOOLTIP_MIN_HEIGHT;
      left = targetRect.left + targetRect.width / 2 - TOOLTIP_WIDTH / 2;
      break;
    }
    case "left": {
      top = targetRect.top + targetRect.height / 2 - TOOLTIP_MIN_HEIGHT / 2;
      left = targetRect.left - GAP - TOOLTIP_WIDTH;
      break;
    }
    case "right": {
      top = targetRect.top + targetRect.height / 2 - TOOLTIP_MIN_HEIGHT / 2;
      left = targetRect.right + GAP;
      break;
    }
  }

  // Clamp to viewport
  top = Math.max(12, Math.min(top, vh - TOOLTIP_MIN_HEIGHT - 12));
  left = Math.max(12, Math.min(left, vw - TOOLTIP_WIDTH - 12));

  return { top, left };
}

function getArrowStyle(placement: "top" | "bottom" | "left" | "right"): React.CSSProperties {
  switch (placement) {
    case "bottom":
      return { top: -6, left: "50%", marginLeft: -6, borderBottom: "none", borderRight: "none" };
    case "top":
      return { bottom: -6, left: "50%", marginLeft: -6, borderTop: "none", borderLeft: "none" };
    case "left":
      return { right: -6, top: "50%", marginTop: -6, borderLeft: "none", borderBottom: "none" };
    case "right":
      return { left: -6, top: "50%", marginTop: -6, borderRight: "none", borderTop: "none" };
  }
}
