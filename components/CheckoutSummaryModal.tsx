"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CheckoutSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  priceDisplay: string;
  loading: boolean;
}

export function CheckoutSummaryModal({ isOpen, onClose, onConfirm, priceDisplay, loading }: CheckoutSummaryModalProps) {
  const [agreed, setAgreed] = useState(false);

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
            className="w-full max-w-md glass-panel-strong rounded-xl border border-amber-400/20 p-6 space-y-5 shadow-2xl mx-4"
          >
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-amber-300">Premium Access Summary</h2>
              <p className="text-xs text-slate-400">Please review before completing your purchase.</p>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-900/60 border border-white/[0.06] rounded-lg p-4 space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">What you get</h3>
                <ul className="space-y-1.5">
                  <li className="flex items-start gap-2 text-xs text-slate-300">
                    <span className="text-emerald-400 mt-0.5">✓</span>
                    All advanced DQL, DPL, and combined cases
                  </li>
                  <li className="flex items-start gap-2 text-xs text-slate-300">
                    <span className="text-emerald-400 mt-0.5">✓</span>
                    DPL Pattern Builder arcade game
                  </li>
                  <li className="flex items-start gap-2 text-xs text-slate-300">
                    <span className="text-emerald-400 mt-0.5">✓</span>
                    Deeper, step-by-step explanations on every premium case
                  </li>
                  <li className="flex items-start gap-2 text-xs text-slate-300">
                    <span className="text-emerald-400 mt-0.5">✓</span>
                    Lifetime access — no subscription
                  </li>
                </ul>
              </div>

              <div className="bg-slate-900/60 border border-white/[0.06] rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Total amount</span>
                  <span className="text-base font-bold text-amber-300">{priceDisplay}</span>
                </div>
                <div className="h-px bg-white/[0.04]" />
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  7-day no-questions-asked refund. If you change your mind, email us within 7 days and we&apos;ll refund the full amount.
                </p>
                <div className="flex items-center gap-3 text-[10px] text-slate-500">
                  <a href="/terms" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300 underline">Terms</a>
                  <span>·</span>
                  <a href="/refund-policy" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300 underline">Refund Policy</a>
                </div>
              </div>
            </div>

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 accent-amber-400"
              />
              <span className="text-[11px] text-slate-300 leading-relaxed">
                I understand that this is a one-time purchase for lifetime access. I have read the Terms and Refund Policy and agree to them.
              </span>
            </label>

            <div className="flex gap-2 pt-1">
              <button
                onClick={onClose}
                className="flex-1 py-2 rounded-md text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors border border-white/[0.06]"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={!agreed || loading}
                className="flex-1 py-2 rounded-md text-xs font-medium text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? "Processing..." : `Pay ${priceDisplay}`}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
