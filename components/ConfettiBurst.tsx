"use client";

import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";

interface ConfettiBurstProps {
  trigger: boolean;
  color?: string;
  originY?: number;
}

export function ConfettiBurst({ trigger, color, originY = 0.7 }: ConfettiBurstProps) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (trigger && !firedRef.current) {
      firedRef.current = true;
      const colors = color
        ? [color, "#ffffff", "#fde047"]
        : ["#ef4444", "#22d3ee", "#a855f7", "#f59e0b", "#34d399", "#ffffff"];

      confetti({
        particleCount: 80,
        spread: 120,
        startVelocity: 45,
        gravity: 1.2,
        origin: { y: originY, x: 0.5 },
        colors,
        disableForReducedMotion: true,
      });

      // Secondary burst for victory
      setTimeout(() => {
        confetti({
          particleCount: 40,
          spread: 80,
          startVelocity: 30,
          gravity: 1.2,
          origin: { y: originY + 0.05, x: 0.5 },
          colors,
          disableForReducedMotion: true,
        });
      }, 300);
    }

    if (!trigger) {
      firedRef.current = false;
    }
  }, [trigger, color, originY]);

  return null;
}
