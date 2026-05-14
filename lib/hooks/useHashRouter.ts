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
          // User pressed Back to empty hash — return to landing page
          setShowLanding(true);
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
        // Fresh session: empty hash should always land on home page
        setShowLanding(true);
      }
    } else {
      const idx = PHASE_HASHES.indexOf(hash);
      if (idx !== -1) {
        // Only restore hash if user is already past landing in this session.
        // On a fresh session (showLanding true) we stay on the home page.
        if (!state.showLanding) {
          if (state.currentPhase !== idx) {
            setPhase(idx);
          }
        } else {
          // Fresh session with a hash in the URL: strip it to stay on home page
          window.history.replaceState(null, "", "");
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
