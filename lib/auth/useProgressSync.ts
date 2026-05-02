"use client";

import { useEffect, useRef } from "react";
import { useInvestigatorStore } from "@/lib/store/useInvestigatorStore";
import { fetchOwnProfile, syncXP } from "@/lib/api/profile";

// Bridges the Zustand progress state with the Supabase profile row.
// - On login: pulls learning_xp / game_xp from the server and seeds the store.
// - On change: debounced upsert back to the profile.
export function useProgressSync() {
  const userId = useInvestigatorStore((s) => s.userId);
  const totalXP = useInvestigatorStore((s) => s.totalXP);
  const gameHighScores = useInvestigatorStore((s) => s.gameHighScores);
  const progressHydrated = useInvestigatorStore((s) => s.progressHydrated);
  const setTotalXP = useInvestigatorStore((s) => s.setTotalXP);
  const setGameHighScores = useInvestigatorStore((s) => s.setGameHighScores);
  const setProgressHydrated = useInvestigatorStore((s) => s.setProgressHydrated);
  const setDisplayName = useInvestigatorStore((s) => s.setDisplayName);
  const setDisplaySlug = useInvestigatorStore((s) => s.setDisplaySlug);
  const setTermsAcceptedAt = useInvestigatorStore((s) => s.setTermsAcceptedAt);
  const setIsPremium = useInvestigatorStore((s) => s.setIsPremium);

  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      setIsPremium(Boolean(profile.is_premium));

      // Take the larger of (server XP, local XP). Local could be ahead if the
      // user earned XP while syncing was paused.
      setTotalXP(Math.max(profile.learning_xp ?? 0, totalXP));

      const gameTotal = Object.values(gameHighScores).reduce((a, b) => a + b, 0);
      if ((profile.game_xp ?? 0) > gameTotal) {
        // Server is ahead of local — push the server total under a synthetic
        // bucket so total reads are correct without losing per-mode bests.
        setGameHighScores({ ...gameHighScores, _server: profile.game_xp });
      }

      setProgressHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Debounced push on every change.
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
}
