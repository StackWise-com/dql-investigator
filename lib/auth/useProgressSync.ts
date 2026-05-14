"use client";

import { useEffect, useRef } from "react";
import { useInvestigatorStore } from "@/lib/store/useInvestigatorStore";
import {
  fetchOwnProfile,
  syncXP,
  fetchPlayerProgress,
  syncPlayerProgress,
} from "@/lib/api/profile";

// Bridges the Zustand progress state with the Supabase profile row.
// - On login: pulls learning_xp / game_xp from the server and seeds the store.
// - On change: debounced upsert back to the profile.
export function useProgressSync() {
  const userId = useInvestigatorStore((s) => s.userId);
  const totalXP = useInvestigatorStore((s) => s.totalXP);
  const gameHighScores = useInvestigatorStore((s) => s.gameHighScores);
  const progressHydrated = useInvestigatorStore((s) => s.progressHydrated);
  const hasSeenDemo = useInvestigatorStore((s) => s.hasSeenDemo);
  const completedScenarios = useInvestigatorStore((s) => s.completedScenarios);
  const setTotalXP = useInvestigatorStore((s) => s.setTotalXP);
  const setGameHighScores = useInvestigatorStore((s) => s.setGameHighScores);
  const setProgressHydrated = useInvestigatorStore((s) => s.setProgressHydrated);
  const setDisplayName = useInvestigatorStore((s) => s.setDisplayName);
  const setDisplaySlug = useInvestigatorStore((s) => s.setDisplaySlug);
  const setTermsAcceptedAt = useInvestigatorStore((s) => s.setTermsAcceptedAt);
  const setHasSeenDemo = useInvestigatorStore((s) => s.setHasSeenDemo);

  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressSyncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate on login (or change of user).
  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      setProgressHydrated(false);
      return;
    }

    (async () => {
      const profile = await fetchOwnProfile(userId);
      if (cancelled || !profile) return;

      setDisplayName(profile.display_name ?? "");
      setDisplaySlug(profile.display_slug ?? "");
      setTermsAcceptedAt(profile.terms_accepted_at);

      // Take the larger of (server XP, local XP). Local could be ahead if the
      // user earned XP while syncing was paused.
      setTotalXP(Math.max(profile.learning_xp ?? 0, totalXP));

      const gameTotal = Object.values(gameHighScores).reduce((a, b) => a + b, 0);
      if ((profile.game_xp ?? 0) > gameTotal) {
        // Server is ahead of local — push the server total under a synthetic
        // bucket so total reads are correct without losing per-mode bests.
        setGameHighScores({ ...gameHighScores, _server: profile.game_xp });
      }

      // Hydrate has_seen_demo from player_progress table.
      const progress = await fetchPlayerProgress(userId);
      if (!cancelled && progress) {
        // Only override local if server says true (user has seen demo somewhere).
        if (progress.has_seen_demo) {
          setHasSeenDemo(true);
        }
      }

      setProgressHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Debounced push on every XP change.
  useEffect(() => {
    if (!userId || !progressHydrated) return;
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      const learning = totalXP;
      const game = Object.values(gameHighScores).reduce((a, b) => a + b, 0);
      void syncXP(userId, learning, game);
    }, 800);

    return () => {
      if (syncTimer.current) clearTimeout(syncTimer.current);
    };
  }, [userId, progressHydrated, totalXP, gameHighScores]);

  // Debounced push for player_progress (has_seen_demo, completed_scenarios).
  useEffect(() => {
    if (!userId || !progressHydrated) return;
    if (progressSyncTimer.current) clearTimeout(progressSyncTimer.current);
    progressSyncTimer.current = setTimeout(() => {
      void syncPlayerProgress(userId, {
        has_seen_demo: hasSeenDemo,
        completed_scenarios: completedScenarios,
        total_xp: totalXP,
      });
    }, 1200);

    return () => {
      if (progressSyncTimer.current) clearTimeout(progressSyncTimer.current);
    };
  }, [userId, progressHydrated, hasSeenDemo, completedScenarios, totalXP]);
}
