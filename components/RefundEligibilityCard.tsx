"use client";

import { useEffect, useState } from "react";

interface ThresholdResult {
  key: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface RefundEligibilityResult {
  eligible: boolean;
  partialEligible: boolean;
  reason: "ok" | "outside-window" | "thresholds-tripped" | "no-payment" | string;
  message: string;
  window?: {
    purchasedAt: string;
    daysSincePurchase: number;
    insideWindow: boolean;
    windowDays: number;
  };
  payment?: { amount: number; currency: string };
  thresholds: ThresholdResult[];
  summary?: { completedPremium: number; totalPremium: number; deepDivesViewed: number };
  estimatedPartialRefundMinor?: number;
  error?: string;
}

interface Props {
  onResolved?: (result: RefundEligibilityResult) => void;
}

export function RefundEligibilityCard({ onResolved }: Props) {
  const [data, setData] = useState<RefundEligibilityResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch("/api/refund-eligibility", { cache: "no-store" });
        const json = (await res.json()) as RefundEligibilityResult;
        if (cancelled) return;
        if (!res.ok || json.error) {
          setErr(json.error ?? `HTTP ${res.status}`);
          setData(null);
        } else {
          setData(json);
          onResolved?.(json);
        }
      } catch (e) {
        if (cancelled) return;
        setErr(e instanceof Error ? e.message : "Failed to check eligibility");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="rounded-md border border-white/[0.06] bg-slate-900/40 p-3 text-xs text-slate-500">
        Checking refund eligibility...
      </div>
    );
  }
  if (err || !data) {
    return (
      <div className="rounded-md border border-rose-400/20 bg-rose-400/10 p-3 text-xs text-rose-300">
        Could not check eligibility: {err ?? "unknown error"}.
      </div>
    );
  }

  const tone = data.eligible
    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
    : data.partialEligible
    ? "border-amber-400/30 bg-amber-400/10 text-amber-300"
    : "border-rose-400/20 bg-rose-400/10 text-rose-300";

  const heading = data.eligible
    ? "Eligible for a full refund"
    : data.partialEligible
    ? "Eligible for a partial refund"
    : "Not eligible for an automatic refund";

  return (
    <div className={`rounded-md border p-4 space-y-3 ${tone}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{heading}</p>
        {data.window && (
          <span className="text-[10px] opacity-70">
            day {data.window.daysSincePurchase.toFixed(1)} / {data.window.windowDays}
          </span>
        )}
      </div>

      <p className="text-xs leading-relaxed opacity-90">{data.message}</p>

      {data.thresholds.length > 0 && (
        <ul className="text-[11px] space-y-1">
          {data.thresholds.map((t) => (
            <li key={t.key} className="flex items-start justify-between gap-2">
              <span>
                <span className="opacity-90">{t.label}</span>
              </span>
              <span className={t.passed ? "text-rose-300 font-mono" : "text-slate-400 font-mono"}>
                {t.detail} {t.passed ? "✗" : "✓"}
              </span>
            </li>
          ))}
        </ul>
      )}

      {data.partialEligible && data.estimatedPartialRefundMinor && data.payment && (
        <p className="text-[11px] opacity-90">
          Estimated partial refund based on consumed content:{" "}
          <span className="font-mono">
            {(data.estimatedPartialRefundMinor / 100).toFixed(2)} {data.payment.currency}
          </span>
          . Final amount is determined by support after manual review.
        </p>
      )}
    </div>
  );
}
