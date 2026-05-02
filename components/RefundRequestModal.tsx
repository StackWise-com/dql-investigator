"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { RefundEligibilityCard, type RefundEligibilityResult } from "./RefundEligibilityCard";

interface RefundRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RefundRequestModal({ isOpen, onClose }: RefundRequestModalProps) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [eligibility, setEligibility] = useState<RefundEligibilityResult | null>(null);

  const canSubmit =
    !!eligibility && (eligibility.eligible || eligibility.partialEligible);

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setResult({ ok: false, message: "You must be signed in to request a refund." });
        return;
      }

      // Find the most recent completed payment for this user
      const { data: payments } = await supabase
        .from("payments")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(1);

      const paymentId = payments?.[0]?.id ?? null;

      const { error } = await supabase.from("refund_requests").insert({
        user_id: user.id,
        payment_id: paymentId,
        reason: reason.trim(),
        status: "pending",
        // Snapshot of the server-side eligibility verdict at submit time so
        // support has the same numbers the user saw.
        eligibility_snapshot: eligibility,
      });

      if (error) {
        setResult({ ok: false, message: error.message });
      } else {
        setResult({ ok: true, message: "Refund request submitted. We&apos;ll review it within 2 business days." });
        setReason("");
      }
    } catch (err) {
      setResult({ ok: false, message: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setReason("");
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
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm glass-panel-strong rounded-xl border border-rose-400/20 p-6 space-y-4 shadow-2xl mx-4"
          >
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-rose-300">Request a Refund</h2>
              <p className="text-xs text-slate-400">
                Eligibility is checked against the server-side activity log. See the
                criteria below.
              </p>
            </div>

            <RefundEligibilityCard onResolved={setEligibility} />

            {result ? (
              <div className={`rounded-lg p-3 text-sm border ${
                result.ok
                  ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/20"
                  : "bg-rose-400/10 text-rose-400 border-rose-400/20"
              }`}>
                {result.message}
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Reason (optional)</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Tell us why you&apos;d like a refund..."
                    className="w-full h-24 bg-slate-950/80 border border-white/[0.06] rounded-lg p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-rose-400/40 resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleClose}
                    className="flex-1 py-2 rounded-md text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors border border-white/[0.06]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !canSubmit}
                    title={canSubmit ? "" : "You must be within the refund window and below the consumption thresholds to submit."}
                    className="flex-1 py-2 rounded-md text-xs font-medium text-rose-300 bg-rose-400/10 hover:bg-rose-400/20 border border-rose-400/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {submitting
                      ? "Submitting..."
                      : !eligibility
                      ? "Checking eligibility..."
                      : eligibility.eligible
                      ? "Submit full refund request"
                      : eligibility.partialEligible
                      ? "Submit partial refund request"
                      : "Not eligible"}
                  </button>
                </div>
              </>
            )}

            {result && (
              <button
                onClick={handleClose}
                className="w-full py-2 rounded-md text-xs font-medium text-slate-300 bg-white/5 hover:bg-white/10 border border-white/[0.06] transition-colors"
              >
                Close
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
