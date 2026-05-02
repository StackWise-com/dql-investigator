"use client";

import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  display_slug: string | null;
  country_code: string | null;
  currency: string | null;
  is_premium: boolean;
  premium_expires_at: string | null;
  terms_accepted_at: string | null;
  terms_version: string | null;
  learning_xp: number;
  game_xp: number;
  created_at: string;
}

export interface LeaderboardRow {
  user_id: string;
  display_name: string | null;
  display_slug: string | null;
  country_code: string | null;
  learning_xp: number;
  game_xp: number;
}

export async function fetchOwnProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, email, display_name, display_slug, country_code, currency, is_premium, premium_expires_at, terms_accepted_at, terms_version, learning_xp, game_xp, created_at"
    )
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    console.warn("[profile] fetch failed:", error.message);
    return null;
  }
  return data as UserProfile | null;
}

export async function syncXP(userId: string, learningXP: number, gameXP: number): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ learning_xp: learningXP, game_xp: gameXP })
    .eq("id", userId);
  if (error) console.warn("[profile] xp sync failed:", error.message);
}

export async function updateDisplayName(userId: string, displayName: string): Promise<UserProfile | null> {
  const trimmed = displayName.trim();
  if (trimmed.length < 2 || trimmed.length > 32) {
    throw new Error("Display name must be 2 to 32 characters.");
  }
  const slug =
    trimmed
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-+|-+$)/g, "") +
    "-" +
    userId.replace(/-/g, "").slice(0, 6);

  const { data, error } = await supabase
    .from("profiles")
    .update({ display_name: trimmed, display_slug: slug })
    .eq("id", userId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as UserProfile;
}

export const TERMS_VERSION = "2026-05-02-v1";

export async function acceptTerms(userId: string): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({
      terms_accepted_at: new Date().toISOString(),
      terms_version: TERMS_VERSION,
    })
    .eq("id", userId);
  if (error) throw new Error(error.message);
}

export async function fetchLeaderboard(
  metric: "learning_xp" | "game_xp",
  limit = 50
): Promise<LeaderboardRow[]> {
  const { data, error } = await supabase
    .from("leaderboard")
    .select("user_id, display_name, display_slug, country_code, learning_xp, game_xp")
    .order(metric, { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) {
    console.warn("[leaderboard] fetch failed:", error.message);
    return [];
  }
  return (data ?? []) as LeaderboardRow[];
}

export async function fetchPublicProfileBySlug(slug: string): Promise<LeaderboardRow | null> {
  const { data, error } = await supabase
    .from("leaderboard")
    .select("user_id, display_name, display_slug, country_code, learning_xp, game_xp")
    .eq("display_slug", slug)
    .maybeSingle();
  if (error) return null;
  return (data as LeaderboardRow) ?? null;
}
