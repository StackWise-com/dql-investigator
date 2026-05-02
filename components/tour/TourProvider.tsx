"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInvestigatorStore } from "@/lib/store/useInvestigatorStore";
import { getSegment, type TourStep } from "./tour-config";
import { TourTooltip } from "./TourTooltip";

interface TourContextValue {
  activeSegmentId: string | null;
  currentStepIndex: number;
  totalSteps: number;
  isOpen: boolean;
  startSegment: (segmentId: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipSegment: () => void;
  targetRect: DOMRect | null;
}

const TourContext = createContext<TourContextValue | null>(null);

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour must be used within TourProvider");
  return ctx;
}

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const mutationObserverRef = useRef<MutationObserver | null>(null);

  const completeTourSegment = useInvestigatorStore((s) => s.completeTourSegment);
  const skipTour = useInvestigatorStore((s) => s.skipTour);

  const segment = activeSegmentId ? getSegment(activeSegmentId) : null;
  const step: TourStep | null = segment?.steps[currentStepIndex] ?? null;
  const totalSteps = segment?.steps.length ?? 0;
  const isOpen = !!segment && !!step;

  const updateTargetRect = useCallback(() => {
    if (!step) {
      setTargetRect(null);
      return;
    }
    if (step.targetId === null) {
      setTargetRect(null);
      return;
    }
    const el = document.querySelector(`[data-tour-target="${step.targetId}"]`);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
    } else {
      setTargetRect(null);
    }
  }, [step]);

  // Update rect when step changes or window resizes
  useEffect(() => {
    updateTargetRect();
    const handleResize = () => updateTargetRect();
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleResize, true);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize, true);
    };
  }, [updateTargetRect]);

  // Observe DOM changes to re-calculate target rect
  useEffect(() => {
    if (!isOpen) return;
    mutationObserverRef.current = new MutationObserver(() => {
      updateTargetRect();
    });
    mutationObserverRef.current.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });
    return () => {
      mutationObserverRef.current?.disconnect();
    };
  }, [isOpen, updateTargetRect]);

  const startSegment = useCallback(
    (segmentId: string) => {
      const seg = getSegment(segmentId);
      if (!seg || seg.steps.length === 0) return;
      setActiveSegmentId(segmentId);
      setCurrentStepIndex(0);
    },
    []
  );

  const endSegment = useCallback(() => {
    if (activeSegmentId) {
      completeTourSegment(activeSegmentId);
    }
    setActiveSegmentId(null);
    setCurrentStepIndex(0);
    setTargetRect(null);
  }, [activeSegmentId, completeTourSegment]);

  const nextStep = useCallback(() => {
    if (!segment) return;
    const next = currentStepIndex + 1;
    if (next >= segment.steps.length) {
      endSegment();
    } else {
      setCurrentStepIndex(next);
    }
  }, [segment, currentStepIndex, endSegment]);

  const prevStep = useCallback(() => {
    setCurrentStepIndex((i) => Math.max(0, i - 1));
  }, []);

  const skipSegment = useCallback(() => {
    skipTour();
    setActiveSegmentId(null);
    setCurrentStepIndex(0);
    setTargetRect(null);
  }, [skipTour]);

  return (
    <TourContext.Provider
      value={{
        activeSegmentId,
        currentStepIndex,
        totalSteps,
        isOpen,
        startSegment,
        nextStep,
        prevStep,
        skipSegment,
        targetRect,
      }}
    >
      {children}
      <AnimatePresence>
        {isOpen && step && (
          <>
            {/* Subtle page-level backdrop to focus attention */}
            <PageBackdrop targetRect={targetRect} />
            {/* Highlight ring around target */}
            <TourHighlightRing targetRect={targetRect} />
            {/* Tooltip */}
            <TourTooltip
              step={step}
              stepIndex={currentStepIndex}
              totalSteps={totalSteps}
              targetRect={targetRect}
              onNext={nextStep}
              onBack={prevStep}
              onSkip={skipSegment}
            />
          </>
        )}
      </AnimatePresence>
    </TourContext.Provider>
  );
}

function PageBackdrop({ targetRect }: { targetRect: DOMRect | null }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[60] pointer-events-none"
      style={{
        background: targetRect
          ? undefined
          : "rgba(2, 6, 23, 0.35)",
      }}
    >
      {targetRect && (
        <>
          {/* Four overlay rects to create a hole around target */}
          <div
            className="absolute bg-slate-950/35"
            style={{ top: 0, left: 0, right: 0, height: targetRect.top }}
          />
          <div
            className="absolute bg-slate-950/35"
            style={{ top: targetRect.bottom, left: 0, right: 0, bottom: 0 }}
          />
          <div
            className="absolute bg-slate-950/35"
            style={{ top: targetRect.top, left: 0, width: targetRect.left, height: targetRect.height }}
          />
          <div
            className="absolute bg-slate-950/35"
            style={{ top: targetRect.top, left: targetRect.right, right: 0, height: targetRect.height }}
          />
        </>
      )}
    </motion.div>
  );
}

function TourHighlightRing({ targetRect }: { targetRect: DOMRect | null }) {
  if (!targetRect) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed z-[61] pointer-events-none rounded-lg"
      style={{
        top: targetRect.top - 4,
        left: targetRect.left - 4,
        width: targetRect.width + 8,
        height: targetRect.height + 8,
        boxShadow: "0 0 0 4px rgba(34, 211, 238, 0.35), 0 0 20px rgba(34, 211, 238, 0.15)",
      }}
    >
      <motion.div
        className="absolute inset-0 rounded-lg border-2 border-cyan-400/50"
        animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0, 0.6] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
  );
}
