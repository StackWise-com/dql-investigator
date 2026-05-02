"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = useState(() => createClient())[0];

  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // When the user clicks the recovery email link, Supabase establishes a
    // session and fires a PASSWORD_RECOVERY event. Listen for both the current
    // session and that event so the page works on cold load and on the redirect.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      setHasSession(Boolean(session));
      setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === "PASSWORD_RECOVERY" || session) {
        setHasSession(true);
        setReady(true);
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setInfo("Password updated. Redirecting...");
      setTimeout(() => router.push("/"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-slate-950 p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm glass-panel-strong rounded-xl border border-cyan-400/20 p-6 space-y-4 shadow-2xl backdrop-blur-xl"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse-glow" />
            <span className="text-sm font-semibold tracking-wide text-cyan-400">DQL INVESTIGATOR</span>
          </div>
          <h1 className="text-base font-semibold text-slate-100 mt-2">Set a new password</h1>
        </div>

        {!ready ? (
          <p className="text-xs text-slate-500">Verifying reset link...</p>
        ) : !hasSession ? (
          <div className="space-y-3">
            <p className="text-xs text-rose-400 bg-rose-400/10 border border-rose-400/20 rounded-md p-2">
              This reset link is invalid or has expired. Please request a new one.
            </p>
            <button
              onClick={() => router.push("/")}
              className="w-full py-2.5 rounded-md text-sm font-medium bg-cyan-400/15 text-cyan-300 hover:bg-cyan-400/25 border border-cyan-400/30"
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">New password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full mt-1 bg-slate-900/80 border border-white/[0.08] rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-400/40"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Confirm password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                className="w-full mt-1 bg-slate-900/80 border border-white/[0.08] rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-400/40"
                required
              />
            </div>

            {error && (
              <p className="text-xs text-rose-400 bg-rose-400/10 border border-rose-400/20 rounded-md p-2">{error}</p>
            )}
            {info && !error && (
              <p className="text-xs text-emerald-300 bg-emerald-400/10 border border-emerald-400/20 rounded-md p-2">{info}</p>
            )}

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-md text-sm font-medium bg-cyan-400/15 text-cyan-300 hover:bg-cyan-400/25 border border-cyan-400/30 transition-colors disabled:opacity-50"
            >
              {loading ? "Please wait..." : "Update password"}
            </motion.button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
