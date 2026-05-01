"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { COUNTRIES } from "@/lib/countries";
import { useInvestigatorStore } from "@/lib/store/useInvestigatorStore";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("US");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const setUserCountry = useInvestigatorStore((s) => s.setUserCountry);
  const setUserEmail = useInvestigatorStore((s) => s.setUserEmail);
  const setIsGuest = useInvestigatorStore((s) => s.setIsGuest);

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

    // Store country on signup
    if (mode === "signup") {
      setUserCountry(country);
    }
    setUserEmail(email);

    // TODO: Wire up Supabase auth here
    setLoading(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm glass-panel-strong rounded-xl border border-cyan-400/20 p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-100">
                {mode === "login" ? "Sign In" : "Create Account"}
              </h2>
              <button
                onClick={onClose}
                className="text-slate-500 hover:text-slate-300 text-sm"
              >
                &#10005;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
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

              {error && (
                <p className="text-xs text-rose-400 bg-rose-400/10 border border-rose-400/20 rounded-md p-2">{error}</p>
              )}

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-md text-sm font-medium bg-cyan-400/15 text-cyan-300 hover:bg-cyan-400/25 border border-cyan-400/30 transition-colors disabled:opacity-50"
              >
                {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
              </motion.button>
            </form>

            <p className="text-xs text-slate-500 text-center">
              {mode === "login" ? (
                <>
                  Don&apos;t have an account?{" "}
                  <button
                    onClick={() => { setMode("signup"); setError(""); }}
                    className="text-cyan-400 hover:underline"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    onClick={() => { setMode("login"); setError(""); }}
                    className="text-cyan-400 hover:underline"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>

            <div className="pt-1 border-t border-white/[0.05] text-center">
              <button
                type="button"
                onClick={() => { setIsGuest(true); onClose(); }}
                className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
              >
                Continue without login
                <span className="ml-1 text-[9px] text-slate-600">(limited access)</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
