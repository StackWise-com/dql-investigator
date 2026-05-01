"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useInvestigatorStore } from "@/lib/store/useInvestigatorStore";
import { scenarios } from "@/lib/dql/scenarios";
import { getPriceForCountry } from "@/lib/pricing";
import { createClient } from "@/lib/supabase/client";
import { openRazorpayCheckout, verifyPayment } from "@/lib/razorpay/checkout";

const DIFFICULTY_COLORS = {
  Beginner: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
  Intermediate: "bg-amber-400/10 text-amber-400 border-amber-400/20",
  Advanced: "bg-rose-400/10 text-rose-400 border-rose-400/20",
};

const FREE_CASES = new Set([
  "case-001", "case-006", "case-007", "case-008", "case-009",
  "case-010", "case-011", "case-012", "case-013", "case-014",
  "case-015", "case-016", "case-017", "case-018", "case-019",
]);

function getScenarioTag(id: string): string | null {
  const tags: Record<string, string> = {
    "case-001": "fetch logs",
    "case-002": "fetch events",
    "case-003": "fetch bizevents",
    "case-004": "fetch spans",
    "case-005": "makeTimeseries",
    "case-006": "filter WARN",
    "case-007": "filter critical",
    "case-008": "dedup",
    "case-009": "limit",
    "case-010": "search",
    "case-011": "filterOut",
    "case-012": "summarize",
    "case-013": "sum",
    "case-014": "makeTimeseries",
    "case-015": "sort",
    "case-016": "compound filter",
    "case-017": "revenue",
    "case-018": "returns",
    "case-019": "scale-up",
    "case-020": "fieldsAdd",
    "case-021": "fieldsRename",
    "case-022": "expand",
    "case-023": "parse",
    "case-024": "dedup",
    "case-025": "limit",
    "case-026": "avg",
    "case-027": "parse",
    "case-028": "makeTimeseries",
    "case-029": "fieldsRemove",
    "case-030": "parse",
    "case-031": "limit",
    "case-032": "in array",
    "case-033": "fieldsRemove",
    "case-034": "makeTimeseries",
    "case-035": "if()",
    "case-036": "timeseries+by",
    "case-037": "fieldsAdd+if",
    "case-038": "tier+sum",
    "case-039": "parse+sort",
    "case-040": "avg+limit",
  };
  return tags[id] || null;
}

function LockIcon() {
  return (
    <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 00-9 0v3.75m-2.25 0h13.5a1.5 1.5 0 011.5 1.5v6a1.5 1.5 0 01-1.5 1.5H3.75a1.5 1.5 0 01-1.5-1.5v-6a1.5 1.5 0 011.5-1.5z" />
    </svg>
  );
}

export function ScenarioSelector() {
  const setScenario = useInvestigatorStore((s) => s.setScenario);
  const completedScenarios = useInvestigatorStore((s) => s.completedScenarios);
  const unlockedScenarios = useInvestigatorStore((s) => s.unlockedScenarios);
  const isPremium = useInvestigatorStore((s) => s.isPremium);
  const setIsPremium = useInvestigatorStore((s) => s.setIsPremium);
  const userCountry = useInvestigatorStore((s) => s.userCountry);
  const userEmail = useInvestigatorStore((s) => s.userEmail);

  const indiaPrice = getPriceForCountry("IN");
  const [showPremiumInfo, setShowPremiumInfo] = useState(false);
  const [intlNoticeOpen, setIntlNoticeOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const unlockedSet = new Set(unlockedScenarios);
  const isIndia = userCountry === "IN";

  const handlePremiumPay = async () => {
    setPayError(null);
    if (!isIndia) {
      setIntlNoticeOpen(true);
      return;
    }

    setPaying(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      await openRazorpayCheckout({
        amount: Math.round(indiaPrice.amount * 100), // paise
        currency: "INR",
        name: "DQL Detective",
        description: "Premium access — all cases + 2× XP",
        receipt: `prem_${Date.now()}`,
        notes: { user_id: user?.id ?? "", email: userEmail },
        prefill: { email: userEmail },
        onSuccess: async (response) => {
          try {
            const result = await verifyPayment(response, {
              amount: Math.round(indiaPrice.amount * 100),
              currency: "INR",
            });
            if (result.verified) {
              setIsPremium(true);
              setShowPremiumInfo(false);
            } else {
              setPayError("Payment could not be verified. Please contact support.");
            }
          } catch (err) {
            setPayError(err instanceof Error ? err.message : "Verification failed.");
          } finally {
            setPaying(false);
          }
        },
        onDismiss: () => setPaying(false),
        onError: (err) => {
          setPayError(err instanceof Error ? err.message : "Payment failed.");
          setPaying(false);
        },
      });
    } catch (err) {
      setPayError(err instanceof Error ? err.message : "Could not start payment.");
      setPaying(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-100">Cases</h1>
          <p className="text-sm text-slate-400">
            Select a case to investigate. Complete free cases to unlock more. Upgrade to Premium for full access.
          </p>
          {!isPremium && (
            <button
              onClick={() => setShowPremiumInfo((o) => !o)}
              className="text-xs font-medium text-amber-300 hover:text-amber-200"
            >
              {showPremiumInfo ? "Hide premium info" : "View premium upgrade →"}
            </button>
          )}
        </div>

        <div className="grid gap-4">
          {scenarios.map((scenario, i) => {
            const isCompleted = completedScenarios.includes(scenario.id);
            const isUnlocked = unlockedSet.has(scenario.id) || FREE_CASES.has(scenario.id);
            const tag = getScenarioTag(scenario.id);

            return (
              <motion.div
                key={scenario.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <motion.button
                  whileHover={isUnlocked || isPremium ? { scale: 1.01, y: -2 } : {}}
                  whileTap={isUnlocked || isPremium ? { scale: 0.99 } : {}}
                  onClick={() => {
                    if (isUnlocked || isPremium) {
                      setScenario(scenario);
                    }
                  }}
                  disabled={!isUnlocked && !isPremium}
                  className={`w-full glass-panel-strong rounded-xl p-5 text-left border transition-colors ${
                    isUnlocked || isPremium
                      ? "border-white/[0.06] hover:border-cyan-400/20"
                      : "border-white/[0.03] opacity-70 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-slate-100">{scenario.title}</h3>
                        {isCompleted && (
                          <span className="text-emerald-400 text-xs">&#10003; Completed</span>
                        )}
                        {!isUnlocked && !isPremium && (
                          <span className="flex items-center gap-1 text-[10px] font-medium text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                            <LockIcon /> Premium
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{scenario.company}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                        DIFFICULTY_COLORS[scenario.difficulty]
                      }`}
                    >
                      {scenario.difficulty}
                    </span>
                  </div>

                  <p className="text-sm text-slate-400 mt-3 leading-relaxed">{scenario.briefing}</p>

                  <div className="flex items-center gap-3 mt-4 flex-wrap">
                    <span className="text-[10px] text-slate-500">{scenario.steps.length} steps</span>
                    <span className="text-[10px] text-slate-600">·</span>
                    <span className="text-[10px] text-slate-500">+{scenario.steps.length * 25} XP</span>
                    {tag && (
                      <span className="text-[10px] font-mono font-medium text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-1.5 py-0.5 rounded">
                        {tag}
                      </span>
                    )}
                  </div>
                </motion.button>
              </motion.div>
            );
          })}
        </div>

        <AnimatePresence>
          {showPremiumInfo && !isPremium && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="glass-panel-strong rounded-xl border border-amber-400/20 p-5 space-y-3"
            >
              <h3 className="text-base font-semibold text-amber-300">Premium Access</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Unlock all advanced cases and earn 2× XP on every premium case.
              </p>
              <p className="text-xs text-slate-400">
                One-time payment of <span className="text-amber-300 font-semibold">{indiaPrice.display}</span>.
              </p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Payments are currently available for users in India only. International payments
                are not yet activated on our Razorpay account — we&apos;ll enable them soon.
              </p>
              {payError && (
                <p className="text-xs text-rose-400 bg-rose-400/10 border border-rose-400/20 rounded-md p-2">
                  {payError}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowPremiumInfo(false)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
                >
                  Maybe later
                </button>
                <button
                  onClick={handlePremiumPay}
                  disabled={paying}
                  className="px-3 py-1.5 rounded-md text-xs font-medium text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 transition-colors disabled:opacity-50"
                >
                  {paying ? "Opening checkout…" : isIndia ? `Pay ${indiaPrice.display}` : "Unlock Premium"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {intlNoticeOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
              onClick={() => setIntlNoticeOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm glass-panel-strong rounded-xl border border-amber-400/20 p-6 space-y-4 shadow-2xl"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-amber-300">International payments coming soon</h2>
                  <button
                    onClick={() => setIntlNoticeOpen(false)}
                    className="text-slate-500 hover:text-slate-300 text-sm"
                  >
                    &#10005;
                  </button>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Premium payments are currently available for users in India only. International
                  payments are not yet activated on our Razorpay account — we&apos;ll enable them
                  shortly. In the meantime, please enjoy the free cases.
                </p>
                <div className="flex justify-end">
                  <button
                    onClick={() => setIntlNoticeOpen(false)}
                    className="px-3 py-1.5 rounded-md text-xs font-medium text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 transition-colors"
                  >
                    Got it
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
