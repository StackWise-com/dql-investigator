"use client";

import { useEffect } from "react";
import { useInvestigatorStore } from "@/lib/store/useInvestigatorStore";

const PHASE_HASHES = ["learn", "sandbox", "visualize", "cases", "arcade"];

export function useHashRouter() {
  const setPhase = useInvestigatorStore((s) => s.setPhase);
  const setShowLanding = useInvestigatorStore((s) => s.setShowLanding);
  const currentPhase = useInvestigatorStore((s) => s.currentPhase);
  const showLanding = useInvestigatorStore((s) => s.showLanding);

  // Sync store changes → URL hash
  useEffect(() => {
    const targetHash = showLanding ? "" : PHASE_HASHES[currentPhase] ?? "";
    if (window.location.hash !== `#${targetHash}`) {
      window.history.pushState(null, "", `#${targetHash}`);
    }
  }, [currentPhase, showLanding]);

  // Sync URL hash changes → store (browser back/forward, manual hash edit)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      const state = useInvestigatorStore.getState();

      if (!hash || hash === "") {
        if (!state.showLanding) {
          // User pressed Back to empty hash while in a case — stay in case,
          // just fix the URL silently so they don't lose their place.
          const targetHash = PHASE_HASHES[state.currentPhase] ?? "";
          window.history.replaceState(null, "", `#${targetHash}`);
        }
      } else {
        const idx = PHASE_HASHES.indexOf(hash);
        if (idx !== -1) {
          if (state.showLanding || state.currentPhase !== idx) {
            setPhase(idx);
            setShowLanding(false);
          }
        }
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initial sync on mount
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    const state = useInvestigatorStore.getState();

    if (!hash || hash === "") {
      if (!state.showLanding) {
        // Returning user was in a case. Restore the URL to match their
        // persisted state without touching the store.
        const targetHash = PHASE_HASHES[state.currentPhase] ?? "";
        window.history.replaceState(null, "", `#${targetHash}`);
      }
    } else {
      const idx = PHASE_HASHES.indexOf(hash);
      if (idx !== -1) {
        if (state.showLanding || state.currentPhase !== idx) {
          setPhase(idx);
          setShowLanding(false);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
