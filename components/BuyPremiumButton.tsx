"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useInvestigatorStore } from "@/lib/store/useInvestigatorStore";
import { useAuth } from "@/lib/auth/useAuth";
import { createClient } from "@/lib/supabase/client";
import { openRazorpayCheckout, verifyPayment } from "@/lib/razorpay/checkout";
import { getPriceForCountry } from "@/lib/pricing";

export function BuyPremiumButton() {
  // Hydrate auth state — pricing is a static page, no other hook does this.
  useAuth();

  const router = useRouter();
  const userEmail = useInvestigatorStore((s) => s.userEmail);
  const userCountry = useInvestigatorStore((s) => s.userCountry);
  const isPremium = useInvestigatorStore((s) => s.isPremium);
  const setIsPremium = useInvestigatorStore((s) => s.setIsPremium);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [showIntlNotice, setShowIntlNotice] = useState(false);

  const isIndia = userCountry === "IN";
  const indiaPrice = getPriceForCountry("IN");
  const localPrice = getPriceForCountry(userCountry || "US");

  if (isPremium) {
    return (
      <div className="rounded-md bg-emerald-400/10 border border-emerald-400/20 p-3 text-center">
        <p className="text-sm font-medium text-emerald-300">
          You already have Premium. Thank you!
        </p>
        <a href="/profile" className="text-xs text-cyan-400 hover:underline">
          View your profile →
        </a>
      </div>
    );
  }

  const handleBuy = async () => {
    setError(null);

    if (!userEmail) {
      router.push("/");
      return;
    }
    if (!agreed) {
      setError("Please agree to the Terms & Refund Policy first.");
      return;
    }
    if (!isIndia) {
      setShowIntlNotice(true);
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      await openRazorpayCheckout({
        amount: Math.round(indiaPrice.amount * 100),
        currency: "INR",
        name: "DQL Investigator",
        description: "Premium access — full case library + deeper explanations",
        receipt: `prem_${Date.now()}`,
        notes: { user_id: user?.id ?? "", email: userEmail, source: "pricing-page" },
        prefill: { email: userEmail },
        onSuccess: async (response) => {
          try {
            const result = await verifyPayment(response, {
              amount: Math.round(indiaPrice.amount * 100),
              currency: "INR",
            });
            if (result.verified) {
              setIsPremium(true);
            } else {
              setError("Payment could not be verified. Please contact support.");
            }
          } catch (err) {
            setError(err instanceof Error ? err.message : "Verification failed.");
          } finally {
            setLoading(false);
          }
        },
        onDismiss: () => setLoading(false),
        onError: (err) => {
          setError(err instanceof Error ? err.message : "Payment failed.");
          setLoading(false);
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start payment.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="flex items-start gap-2 text-[11px] text-slate-400 cursor-pointer">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 w-3.5 h-3.5 rounded border-white/20 bg-slate-900 text-amber-400 focus:ring-amber-400"
        />
        <span>
          I have read and agree to the{" "}
          <a href="/terms" className="text-cyan-400 hover:underline" target="_blank" rel="noopener noreferrer">
            Terms
          </a>{" "}
          and{" "}
          <a href="/refund-policy" className="text-cyan-400 hover:underline" target="_blank" rel="noopener noreferrer">
            Refund Policy
          </a>{" "}
          (including the limits on refunds when premium content has been substantially used).
        </span>
      </label>

      <motion.button
        whileHover={{ scale: agreed && !loading ? 1.02 : 1 }}
        whileTap={{ scale: agreed && !loading ? 0.98 : 1 }}
        onClick={handleBuy}
        disabled={loading}
        className="w-full py-3 rounded-md text-sm font-semibold bg-amber-400/15 text-amber-300 hover:bg-amber-400/25 border border-amber-400/30 transition-colors disabled:opacity-50"
      >
        {loading
          ? "Opening checkout..."
          : !userEmail
          ? "Sign in to upgrade"
          : isIndia
          ? `Buy Premium · ${indiaPrice.display}`
          : `Buy Premium · ${localPrice.display}`}
      </motion.button>

      {error && (
        <p className="text-xs text-rose-400 bg-rose-400/10 border border-rose-400/20 rounded-md p-2">
          {error}
        </p>
      )}

      {showIntlNotice && (
        <div className="rounded-md bg-slate-900/60 border border-cyan-400/20 p-3 text-xs text-slate-300 space-y-2">
          <p className="font-semibold text-cyan-300">International payments</p>
          <p>
            Payments are currently enabled only for India ({indiaPrice.display}). International
            checkout is rolling out shortly. Please email{" "}
            <a href="mailto:technomonstert@gmail.com" className="text-cyan-400 hover:underline">
              technomonstert@gmail.com
            </a>{" "}
            and we will help you upgrade manually.
          </p>
          <button
            onClick={() => setShowIntlNotice(false)}
            className="text-[11px] text-slate-400 hover:text-slate-200"
          >
            Dismiss
          </button>
        </div>
      )}

      <p className="text-[10px] text-slate-500 text-center">
        Secure payment via Razorpay · One-time purchase · Lifetime access
      </p>
    </div>
  );
}
