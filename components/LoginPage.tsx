"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LoginScene } from "./three/LoginScene";
import { useInvestigatorStore } from "@/lib/store/useInvestigatorStore";
import { COUNTRIES } from "@/lib/countries";
import { getPriceForCountry } from "@/lib/pricing";
import { FeedbackButton } from "./FeedbackButton";

export function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("US");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const setUserEmail = useInvestigatorStore((s) => s.setUserEmail);
  const setUserCountry = useInvestigatorStore((s) => s.setUserCountry);
  const setIsGuest = useInvestigatorStore((s) => s.setIsGuest);
  const setShowLanding = useInvestigatorStore((s) => s.setShowLanding);

  const price = getPriceForCountry(country);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    await new Promise((r) => setTimeout(r, 800));

    if (email.length < 5 || !email.includes("@")) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    if (mode === "signup") {
      setUserCountry(country);
    }
    setUserEmail(email);
    setLoading(false);
    setShowLanding(true);
  };

  const handleGuest = () => {
    setIsGuest(true);
    setShowLanding(true);
  };

  return (
    <div className="h-screen w-screen relative overflow-hidden bg-slate-950">
      <div className="pointer-events-none">
        <LoginScene />
      </div>

      {/* Top-right guest button */}
      <motion.button
        className="absolute top-6 right-8 z-20 px-4 py-2 rounded-full glass-panel-strong border border-white/[0.08] text-xs font-medium text-slate-300 hover:text-slate-100 hover:bg-white/5 transition-colors backdrop-blur-md pointer-events-auto"
        onClick={handleGuest}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        Continue without login
        <span className="ml-1.5 text-[9px] text-slate-500">(Limited access)</span>
      </motion.button>

      {/* Title */}
      <motion.div
        className="absolute top-6 left-8 z-20"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse-glow" />
          <span className="text-sm font-semibold tracking-wide text-cyan-400">DQL INVESTIGATOR</span>
        </div>
        <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
          Make the invisible visible. Learn Dynatrace Query Language by investigating real incidents.
        </p>
      </motion.div>

      {/* Center glass card */}
      <motion.div
        className="absolute inset-0 z-10 flex items-center justify-center p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <motion.div
          className="w-full max-w-sm glass-panel-strong rounded-xl border border-cyan-400/20 p-6 space-y-4 shadow-2xl backdrop-blur-xl pointer-events-auto"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
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
        </motion.div>
      </motion.div>
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
