"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInvestigatorStore } from "@/lib/store/useInvestigatorStore";
import { getCoffeePriceForCountry } from "@/lib/pricing";
// Payments coming soon

interface CoffeeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CoffeeModal({ isOpen, onClose }: CoffeeModalProps) {
  const userCountry = useInvestigatorStore((s) => s.userCountry);
  // const userEmail = useInvestigatorStore((s) => s.userEmail);
  const price = getCoffeePriceForCountry(userCountry);

  const [amount, setAmount] = useState(price.amount.toString());
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");

  const handlePay = () => {
    const val = parseInt(amount, 10);
    if (!val || val < 1) {
      setStatus("error");
      setStatusMsg("Please enter a valid amount.");
      return;
    }
    setStatus("success");
    setStatusMsg("Payments are coming soon with more exciting cases to solve and an exciting gaming mode where you can be the DQL Detective.");
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
            className="w-full max-w-sm glass-panel-strong rounded-xl border border-amber-400/20 p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-amber-300">Buy me a coffee</h2>
              <button
                onClick={onClose}
                className="text-slate-500 hover:text-slate-300 text-sm"
              >
                &#10005;
              </button>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              Thanks for thinking of buying me a coffee — it really motivates me to keep building this.
            </p>

            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Amount ({price.currency})
              </label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-slate-400">{price.symbol}</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min={1}
                  className="flex-1 bg-slate-900/80 border border-white/[0.08] rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-400/40"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Suggested: {price.display} in your region
              </p>
            </div>

            {status === "success" && (
              <p className="text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-md p-2">
                {statusMsg}
              </p>
            )}
            {status === "error" && (
              <p className="text-xs text-rose-400 bg-rose-400/10 border border-rose-400/20 rounded-md p-2">
                {statusMsg}
              </p>
            )}

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handlePay}
              className="w-full py-2.5 rounded-md text-sm font-medium bg-amber-400/15 text-amber-300 hover:bg-amber-400/25 border border-amber-400/30 transition-colors"
            >
              {status === "success" ? "Coming Soon" : "Pay with Razorpay"}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
