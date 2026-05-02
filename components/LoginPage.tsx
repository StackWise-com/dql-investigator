"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LoginScene } from "./three/LoginScene";
import { COUNTRIES } from "@/lib/countries";
import { FeedbackButton } from "./FeedbackButton";
import { useAuth } from "@/lib/auth/useAuth";

type Mode = "login" | "signup" | "forgot";

export function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("US");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const { signIn, signUp, resetPassword } = useAuth();

  const switchMode = (m: Mode) => {
    setMode(m);
    setError("");
    setInfo("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");

    const trimmedEmail = email.trim();

    if (trimmedEmail.length < 5 || !trimmedEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (mode !== "forgot" && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const { needsEmailConfirmation } = await signUp(trimmedEmail, password, country);
        if (needsEmailConfirmation) {
          setInfo("Account created — check your email to confirm before signing in.");
          setMode("login");
          setPassword("");
        }
      } else if (mode === "login") {
        await signIn(trimmedEmail, password);
      } else {
        await resetPassword(trimmedEmail);
        setInfo("If that email is registered, a reset link is on its way. Check your inbox.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen relative overflow-hidden bg-slate-950">
      <div className="pointer-events-none">
        <LoginScene />
      </div>

      {/* Title */}
      <div
        className="absolute top-6 left-8 z-20"
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse-glow" />
          <span className="text-sm font-semibold tracking-wide text-cyan-400">DQL INVESTIGATOR</span>
        </div>
        <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
          Make the invisible visible. Learn Dynatrace Query Language by investigating real incidents.
        </p>
      </div>

      {/* Center glass card */}
      <div
        className="absolute inset-0 z-10 flex items-center justify-center p-6"
      >
        <div
          className="w-full max-w-sm glass-panel-strong rounded-xl border border-cyan-400/20 p-6 space-y-4 shadow-2xl backdrop-blur-xl pointer-events-auto"
        >
          {/* Tab toggle (hidden on forgot screen) */}
          {mode !== "forgot" && (
            <div className="flex rounded-lg bg-slate-900/60 p-0.5 pointer-events-auto">
              {(["login", "signup"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMode(m)}
                  className={`flex-1 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer select-none ${
                    mode === m
                      ? "bg-cyan-400/15 text-cyan-300"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {m === "login" ? "Sign In" : "Create Account"}
                </button>
              ))}
            </div>
          )}

          {mode === "forgot" && (
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-cyan-300">Reset password</h2>
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="text-[11px] text-slate-500 hover:text-slate-300"
              >
                ← Back to sign in
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 pointer-events-auto">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full mt-1 bg-slate-900/80 border border-white/[0.08] rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-400/40"
                required
              />
            </div>

            {mode !== "forgot" && (
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Password</label>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => switchMode("forgot")}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full mt-1 bg-slate-900/80 border border-white/[0.08] rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-400/40"
                  required
                />
              </div>
            )}

            {mode === "signup" && (
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Country</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full mt-1 bg-slate-900/80 border border-white/[0.08] rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-400/40"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name} ({c.currency})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs text-rose-400 bg-rose-400/10 border border-rose-400/20 rounded-md p-2"
                >
                  {error}
                </motion.p>
              )}
              {info && !error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs text-emerald-300 bg-emerald-400/10 border border-emerald-400/20 rounded-md p-2"
                >
                  {info}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-md text-sm font-medium bg-cyan-400/15 text-cyan-300 hover:bg-cyan-400/25 border border-cyan-400/30 transition-colors disabled:opacity-50"
            >
              {loading
                ? "Please wait..."
                : mode === "login"
                ? "Sign In"
                : mode === "signup"
                ? "Create Account"
                : "Send reset link"}
            </motion.button>
          </form>

          <p className="text-[10px] text-slate-600 text-center">
            {mode === "login"
              ? "Sign in to unlock extra cases and track your progression."
              : mode === "signup"
              ? "Create an account to save progress and unlock the full free tier."
              : "We'll email you a link to set a new password."}
          </p>

        </div>
      </div>
      <FeedbackButton page="Login" />
    </div>
  );
}
