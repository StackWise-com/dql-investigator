"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useInvestigatorStore } from "@/lib/store/useInvestigatorStore";
import { useAuth } from "@/lib/auth/useAuth";
import { useProgressSync } from "@/lib/auth/useProgressSync";
import {
  fetchOwnProfile,
  updateDisplayName,
  type UserProfile,
} from "@/lib/api/profile";
import { UserAvatar } from "./UserAvatar";
import { ANIMAL_EMOJIS } from "@/lib/avatars";

export function ProfileScreen() {
  // Hydrate session + progress in case the user navigates here directly.
  useAuth();
  useProgressSync();

  const router = useRouter();
  const userId = useInvestigatorStore((s) => s.userId);
  const userEmail = useInvestigatorStore((s) => s.userEmail);
  const totalXP = useInvestigatorStore((s) => s.totalXP);
  const gameHighScores = useInvestigatorStore((s) => s.gameHighScores);
  const setDisplayName = useInvestigatorStore((s) => s.setDisplayName);
  const setDisplaySlug = useInvestigatorStore((s) => s.setDisplaySlug);
  const avatarEmoji = useInvestigatorStore((s) => s.avatarEmoji);
  const setAvatarEmoji = useInvestigatorStore((s) => s.setAvatarEmoji);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const gameXP = Object.values(gameHighScores).reduce((a, b) => a + b, 0);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const p = await fetchOwnProfile(userId);
      if (cancelled) return;
      setProfile(p);
      setEditingName(p?.display_name ?? "");
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!userEmail) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
        <div className="max-w-xl mx-auto space-y-4">
          <h1 className="text-xl font-semibold">Profile</h1>
          <p className="text-sm text-slate-400">You need to be signed in to view your profile.</p>
          <button
            onClick={() => router.push("/")}
            className="px-3 py-2 rounded-md text-xs font-medium bg-cyan-400/15 text-cyan-300 border border-cyan-400/30"
          >
            Go to sign in
          </button>
        </div>
      </div>
    );
  }

  const handleSaveName = async () => {
    if (!userId) return;
    setError("");
    setInfo("");
    setSaving(true);
    try {
      const updated = await updateDisplayName(userId, editingName);
      if (updated) {
        setProfile(updated);
        setDisplayName(updated.display_name ?? "");
        setDisplaySlug(updated.display_slug ?? "");
        setInfo("Display name updated.");
        setEditing(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Profile</h1>
          <div className="flex items-center gap-2 text-xs">
            <a href="/leaderboard" className="text-cyan-400 hover:underline">Leaderboard</a>
            <span className="text-slate-600">·</span>
            <a href="/" className="text-slate-400 hover:text-slate-200">← Back to app</a>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel-strong rounded-xl border border-cyan-400/20 p-6 space-y-5"
        >
          <div className="flex items-center gap-4">
            <UserAvatar email={userEmail} xp={totalXP} size={56} showTitle={false} emoji={avatarEmoji} />
            <div>
              <p className="text-sm font-semibold text-slate-100">
                {profile?.display_name || userEmail.split("@")[0]}
              </p>
              <p className="text-xs text-slate-400">{userEmail}</p>
            </div>
          </div>

          <Field label="Avatar">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-2xl" title="Current avatar">{avatarEmoji}</span>
              <div className="flex flex-wrap gap-1">
                {ANIMAL_EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => setAvatarEmoji(e)}
                    className={`text-lg px-1 py-0.5 rounded hover:bg-white/10 transition-colors ${
                      e === avatarEmoji ? "bg-cyan-400/20 ring-1 ring-cyan-400/40" : ""
                    }`}
                    title="Pick this avatar"
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </Field>

          <Field label="Display name (shown on leaderboard)">
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  maxLength={32}
                  className="flex-1 bg-slate-900/80 border border-white/[0.08] rounded-md px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-400/40"
                />
                <button
                  onClick={handleSaveName}
                  disabled={saving}
                  className="px-3 py-1.5 rounded-md text-xs font-medium bg-cyan-400/15 text-cyan-300 border border-cyan-400/30 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setEditingName(profile?.display_name ?? "");
                    setError("");
                  }}
                  className="px-2 py-1.5 rounded-md text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-200">
                  {profile?.display_name || <span className="text-slate-500">— not set —</span>}
                </span>
                <button
                  onClick={() => setEditing(true)}
                  className="text-[10px] text-cyan-400 hover:underline"
                >
                  Edit
                </button>
              </div>
            )}
          </Field>

          <Field label="Country">
            <span className="text-sm text-slate-200">{profile?.country_code ?? "—"}</span>
          </Field>

          <Field label="Public profile URL">
            {profile?.display_slug ? (
              <a
                href={`/u/${profile.display_slug}`}
                className="text-sm text-cyan-400 hover:underline break-all"
              >
                /u/{profile.display_slug}
              </a>
            ) : (
              <span className="text-sm text-slate-500">— not yet generated —</span>
            )}
          </Field>

          <Field label="Terms & Conditions accepted">
            <span className="text-sm text-slate-200">
              {profile?.terms_accepted_at
                ? new Date(profile.terms_accepted_at).toLocaleString()
                : "— not yet accepted —"}
            </span>
            {profile?.terms_version && (
              <span className="ml-2 text-[10px] text-slate-500">version {profile.terms_version}</span>
            )}
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Stat label="Learning XP" value={profile?.learning_xp ?? totalXP} accent="cyan" />
            <Stat label="Game XP" value={profile?.game_xp ?? gameXP} accent="violet" />
          </div>

          {error && (
            <p className="text-xs text-rose-400 bg-rose-400/10 border border-rose-400/20 rounded-md p-2">{error}</p>
          )}
          {info && !error && (
            <p className="text-xs text-emerald-300 bg-emerald-400/10 border border-emerald-400/20 rounded-md p-2">{info}</p>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">{label}</p>
      <div>{children}</div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "cyan" | "violet";
}) {
  const cls = accent === "cyan" ? "text-cyan-300" : "text-violet-300";
  return (
    <div className="rounded-lg border border-white/[0.06] bg-slate-900/40 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`text-2xl font-bold ${cls}`}>{value}</p>
    </div>
  );
}
