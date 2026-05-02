import { getPriceForCountry } from "@/lib/pricing";
import { BuyPremiumButton } from "@/components/BuyPremiumButton";

export const metadata = {
  title: "Pricing — DQL Detective",
  description: "Premium pricing and feature comparison for DQL Detective.",
};

export default function PricingPage() {
  const indiaPrice = getPriceForCountry("IN");
  const usPrice = getPriceForCountry("US");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-slate-100">Pricing</h1>
          <p className="text-sm text-slate-400">One-time purchase. No subscription. No recurring fees.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Free tier */}
          <div className="glass-panel-strong rounded-xl border border-white/[0.06] p-6 space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-slate-100">Free</h2>
              <p className="text-sm text-slate-400">Forever free. No credit card required.</p>
            </div>
            <div className="text-3xl font-bold text-slate-100">$0</div>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">&#10003;</span> Onboarding track (6 cases)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">&#10003;</span> ~15 DQL cases
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">&#10003;</span> ~4 DPL cases
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">&#10003;</span> 2 Combined DPL+DQL cases
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">&#10003;</span> Codex reference
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">&#10003;</span> Arcade modes
              </li>
              <li className="flex items-center gap-2 text-slate-600">
                <span>-</span> No premium-only cases
              </li>
              <li className="flex items-center gap-2 text-slate-600">
                <span>-</span> Lighter explanations (no extended walkthroughs)
              </li>
            </ul>
          </div>

          {/* Premium tier */}
          <div className="glass-panel-strong rounded-xl border border-amber-400/20 p-6 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-amber-400/10 text-amber-300 text-[10px] font-semibold px-2 py-1 rounded-bl-lg border-b border-l border-amber-400/20">
              RECOMMENDED
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-amber-300">Premium</h2>
              <p className="text-sm text-slate-400">One-time purchase. Lifetime access.</p>
            </div>
            <div className="text-3xl font-bold text-amber-300">{usPrice.display}</div>
            <p className="text-xs text-slate-500">India: {indiaPrice.display} · Localized pricing available</p>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">&#10003;</span> Everything in Free
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">&#10003;</span> All 40+ DQL cases
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">&#10003;</span> All 12 DPL cases
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">&#10003;</span> All 8 Combined cases
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">&#10003;</span> Deeper, narrated explanations on every premium case
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">&#10003;</span> Priority support
              </li>
            </ul>
            <div className="pt-2 space-y-3">
              <BuyPremiumButton />
              <p className="text-[11px] text-slate-500">
                7-day refund window. Refund forfeited once a substantial portion of premium
                content has been consumed — see the{" "}
                <a href="/refund-policy" className="text-cyan-400 hover:underline">
                  Refund Policy
                </a>{" "}
                for the exact thresholds.
              </p>
            </div>
          </div>
        </div>

        <div className="glass-panel-strong rounded-xl border border-white/[0.06] p-6 space-y-3">
          <h3 className="text-base font-semibold text-slate-100">Frequently Asked Questions</h3>
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-200">Is this a subscription?</p>
              <p className="text-sm text-slate-400">No. You pay once and keep premium forever. No monthly or yearly charges.</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-200">Can I get a refund?</p>
              <p className="text-sm text-slate-400">
                Yes, within 7 days of purchase — provided you have not substantially consumed
                the premium content. As a guideline, eligibility is forfeited once you have
                completed more than 25% of premium-only cases or earned more than 1,000 XP
                from premium content. The full thresholds (and a partial-refund option) are on
                the{" "}
                <a href="/refund-policy" className="text-cyan-400 hover:underline">
                  Refund Policy
                </a>{" "}
                page. We process eligible refunds within 5–7 business days.
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-200">What payment methods are accepted?</p>
              <p className="text-sm text-slate-400">We use Razorpay in India (UPI, cards, net banking). International payments are coming soon.</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-200">Do you offer team or enterprise licenses?</p>
              <p className="text-sm text-slate-400">Not yet. Contact us at technomonstert@gmail.com if you are interested.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
