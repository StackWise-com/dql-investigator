"use client";

import { useEffect, useRef } from "react";
import { useInvestigatorStore } from "@/lib/store/useInvestigatorStore";
import { useTour } from "./TourProvider";

export function TourAutoTrigger() {
  const { startSegment, isOpen } = useTour();
  const userEmail = useInvestigatorStore((s) => s.userEmail);
  const showLanding = useInvestigatorStore((s) => s.showLanding);
  const currentPhase = useInvestigatorStore((s) => s.currentPhase);
  const activeScenario = useInvestigatorStore((s) => s.activeScenario);
  const tourCompletedSegments = useInvestigatorStore((s) => s.tourCompletedSegments);

  const hasStartedLanding = useRef(false);
  const hasStartedLearn = useRef(false);
  const hasStartedSandbox = useRef(false);
  const hasStartedVisualize = useRef(false);
  const hasStartedCasesSelector = useRef(false);
  const hasStartedCasesActive = useRef(false);
  const hasStartedArcade = useRef(false);

  const tryStart = (segmentId: string, condition: boolean, flagRef: React.MutableRefObject<boolean>) => {
    if (isOpen) return;
    if (!condition) return;
    if (flagRef.current) return;
    if (tourCompletedSegments.includes(segmentId)) return;

    flagRef.current = true;
    // Delay so DOM settles after phase transitions
    const t = setTimeout(() => {
      startSegment(segmentId);
    }, 700);
    return () => clearTimeout(t);
  };

  useEffect(() => {
    if (!userEmail) {
      // Reset flags on logout so tour re-triggers for next login
      hasStartedLanding.current = false;
      hasStartedLearn.current = false;
      hasStartedSandbox.current = false;
      hasStartedVisualize.current = false;
      hasStartedCasesSelector.current = false;
      hasStartedCasesActive.current = false;
      hasStartedArcade.current = false;
      return;
    }

    // Landing
    const cleanup = tryStart(
      "landing",
      showLanding,
      hasStartedLanding
    );
    if (cleanup) return cleanup;

    if (showLanding) return;

    // Phase-based segments
    switch (currentPhase) {
      case 0: {
        const c = tryStart("learn", true, hasStartedLearn);
        if (c) return c;
        break;
      }
      case 1: {
        const c = tryStart("sandbox", true, hasStartedSandbox);
        if (c) return c;
        break;
      }
      case 2: {
        const c = tryStart("visualize", true, hasStartedVisualize);
        if (c) return c;
        break;
      }
      case 3: {
        if (!activeScenario) {
          const c = tryStart("cases-selector", true, hasStartedCasesSelector);
          if (c) return c;
        } else {
          const c = tryStart("cases-active", true, hasStartedCasesActive);
          if (c) return c;
        }
        break;
      }
      case 4: {
        const c = tryStart("arcade", true, hasStartedArcade);
        if (c) return c;
        break;
      }
    }
  }, [
    userEmail,
    showLanding,
    currentPhase,
    activeScenario,
    tourCompletedSegments,
    isOpen,
    startSegment,
  ]);

  return null;
}
