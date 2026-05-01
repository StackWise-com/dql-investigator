"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LoginScene } from "./three/LoginScene";
import { COUNTRIES } from "@/lib/countries";
import { getPriceForCountry } from "@/lib/pricing";
import { FeedbackButton } from "./FeedbackButton";
import { useAuth } from "@/lib/auth/useAuth";

export function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("US");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { signIn, signUp } = useAuth();

  const price = getPriceForCountry(country);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (email.length < 5 || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        await signUp(email, password, country);
      } else {
        await signIn(email, password);
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
          {/* Tab toggle */}
          <div className="flex rounded-lg bg-slate-900/60 p-0.5 pointer-events-auto">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setError("");
                }}
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

            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full mt-1 bg-slate-900/80 border border-white/[0.08] rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-400/40"
                required
              />
            </div>

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
                : "Create Account"}
            </motion.button>
          </form>

          <p className="text-[10px] text-slate-600 text-center">
            {mode === "login"
              ? "Sign in to unlock extra cases and track your progression."
              : "Create an account to save progress and unlock the full free tier."}
          </p>

          {mode === "signup" && <EnterprisePlan country={country} />}
        </div>
      </div>
      <FeedbackButton page="Login" />
    </div>
  );
}

function EnterprisePlan({ country }: { country: string }) {
  const [seats, setSeats] = useState(1);
  const price = getPriceForCountry(country);
  const discountPercent = Math.min(seats, 40);
  const totalBefore = seats * price.amount;
  const discount = (totalBefore * discountPercent) / 100;
  const totalAfter = totalBefore - discount;

  const fmt = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Enterprise Plan</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-[10px] text-slate-400">Seats</label>
          <span className="text-xs font-medium text-slate-200">{seats}</span>
        </div>
        <input
          type="range"
          min={1}
          max={100}
          value={seats}
          onChange={(e) => setSeats(Number(e.target.value))}
          className="w-full accent-cyan-400"
        />
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-slate-500">Discount: {discountPercent}%</span>
          <span className="text-slate-500">Max 40% at 40 seats</span>
        </div>
      </div>
      <div className="glass-panel rounded-md p-2.5 space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Subtotal</span>
          <span className="text-slate-300">{price.symbol}{fmt(totalBefore)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-emerald-400">Discount ({discountPercent}%)</span>
          <span className="text-emerald-400">−{price.symbol}{fmt(discount)}</span>
        </div>
        <div className="border-t border-white/[0.06] pt-1 flex items-center justify-between text-sm font-semibold">
          <span className="text-slate-200">Total</span>
          <span className="text-amber-400">{price.symbol}{fmt(totalAfter)}</span>
        </div>
      </div>
    </div>
  );
}
