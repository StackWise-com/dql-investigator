"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

  const { signIn, signUp, resetPassword, signInWithOAuth } = useAuth();

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
    <div className="h-screen w-screen relative overflow-hidden bg-slate-950 flex">
      {/* Left panel — hero */}
      <div className="hidden lg:flex flex-col justify-between w-[46%] bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border-r border-white/[0.06] p-12 relative overflow-hidden">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "48px 48px" }}
        />
        {/* Logo */}
        <div className="relative">
          <div className="flex items-center gap-3 mb-6">
            <svg viewBox="0 0 32 32" className="w-8 h-8 text-accent" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="14" cy="14" r="8" />
              <path d="M20 20l7 7" strokeLinecap="round" />
              <path d="M11 14h6M14 11v6" strokeLinecap="round" />
            </svg>
            <span className="text-base font-semibold text-slate-100 tracking-tight">DQL Detective</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-100 tracking-tight leading-snug mb-4">
            Learn Dynatrace<br />Query Language<br />by doing.
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
            Solve real observability incidents, build intuition with interactive pipelines, and track your progress from Trainee to Legend.
          </p>
        </div>
        {/* Stats */}
        <div className="relative flex items-center gap-8">
          {[["60+", "Scenarios"], ["5", "Learning Tracks"], ["Free", "Always"]].map(([n, l]) => (
            <div key={l}>
              <div className="text-xl font-bold text-slate-100">{n}</div>
              <div className="text-xs text-slate-500 mt-0.5">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Center glass card */}
      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-sm space-y-4">
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
                className="text-xs text-slate-500 hover:text-slate-300"
              >
                ← Back to sign in
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 pointer-events-auto">
            <div>
              <label className="text-xs font-medium text-slate-500">Email</label>
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
                  <label className="text-xs font-medium text-slate-500">Password</label>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => switchMode("forgot")}
                      className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline"
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
                <label className="text-xs font-medium text-slate-500">Country</label>
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

          {/* Social login */}
          {mode === "login" && (
            <>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-[10px] text-slate-600 uppercase tracking-wider">or</span>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await signInWithOAuth("google");
                  } catch {
                    // OAuth redirect happens before error can propagate in most cases
                  }
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] border border-white/[0.08] transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Sign in with Google
              </button>
            </>
          )}

          <p className="text-xs text-slate-600 text-center">
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
