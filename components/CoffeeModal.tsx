"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInvestigatorStore } from "@/lib/store/useInvestigatorStore";
import { openRazorpayCheckout, verifyPayment } from "@/lib/razorpay/checkout";

const PRESET_AMOUNTS = [100, 150, 200, 500, 750, 1000];

interface CoffeeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CoffeeModal({ isOpen, onClose }: CoffeeModalProps) {
  const userEmail = useInvestigatorStore((s) => s.userEmail);

  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [paying, setPaying] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");

  const handlePay = async () => {
    if (!selectedAmount) {
      setStatus("error");
      setStatusMsg("Please select an amount.");
      return;
    }

    setPaying(true);
    setStatus("idle");
    setStatusMsg("");

    const amountInPaise = selectedAmount * 100;

    try {
      await openRazorpayCheckout({
        amount: amountInPaise,
        currency: "INR",
        name: "DQL Detective",
        description: "Buy me a coffee — support open-source DQL learning",
        receipt: `coffee_${Date.now()}`,
        notes: { email: userEmail || "", type: "coffee" },
        prefill: { email: userEmail },
        onSuccess: async (response) => {
          try {
            const result = await verifyPayment(response, {
              amount: amountInPaise,
              currency: "INR",
            });
            if (result.verified) {
              setStatus("success");
              setStatusMsg("Thank you for the coffee! Your support keeps this project alive.");
            } else {
              setStatus("error");
              setStatusMsg("Payment could not be verified. Please contact support.");
            }
          } catch (err) {
            setStatus("error");
            setStatusMsg(err instanceof Error ? err.message : "Verification failed.");
          } finally {
            setPaying(false);
          }
        },
        onDismiss: () => setPaying(false),
        onError: (err) => {
          setStatus("error");
          setStatusMsg(err instanceof Error ? err.message : "Payment failed.");
          setPaying(false);
        },
      });
    } catch (err) {
      setStatus("error");
      setStatusMsg(err instanceof Error ? err.message : "Could not start payment.");
      setPaying(false);
    }
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
              <label className="text-xs font-medium text-slate-500">
                Choose an amount (INR)
              </label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {PRESET_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => {
                      setSelectedAmount(amt);
                      setStatus("idle");
                    }}
                    className={`py-2 rounded-md text-sm font-medium border transition-colors ${
                      selectedAmount === amt
                        ? "bg-amber-400/25 text-amber-300 border-amber-400/50"
                        : "bg-slate-900/60 text-slate-300 border-white/[0.08] hover:border-amber-400/30 hover:bg-amber-400/10"
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
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
              onClick={handlePay}
              disabled={paying || !selectedAmount}
              className="w-full py-2.5 rounded-md text-sm font-medium bg-amber-400/15 text-amber-300 hover:bg-amber-400/25 border border-amber-400/30 transition-colors disabled:opacity-50"
            >
              {paying
                ? "Opening checkout..."
                : status === "success"
                ? "Paid"
                : selectedAmount
                ? `Pay ₹${selectedAmount}`
                : "Pay with Razorpay"}
            </motion.button>

            <p className="text-xs text-slate-500 text-center">
              Secure payments powered by Razorpay. All cards &amp; UPI accepted.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
