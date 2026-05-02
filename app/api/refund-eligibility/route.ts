import { NextResponse } from "next/server";
import { createServerSupabase, createAdminSupabase } from "@/lib/supabase/server";
import { scenarios } from "@/lib/dql/scenarios";
import { dplScenarios } from "@/lib/dql/scenarios-dpl";
import { combinedScenarios } from "@/lib/dql/scenarios-combined";
import { getIsPremiumCase } from "@/lib/scenarios/premium";

const REFUND_WINDOW_DAYS = 7;
const COMPLETION_PCT_LIMIT = 0.25;
const COMPLETED_COUNT_LIMIT = 5;
const DEEP_DIVE_VIEWS_LIMIT = 3;

interface ThresholdResult {
  key: string;
  label: string;
  passed: boolean;
  detail: string;
}

export async function GET() {
  try {
    const userClient = createServerSupabase();
    const {
      data: { user },
    } = await userClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const admin = createAdminSupabase();

    const { data: latestPayment } = await admin
      .from("payments")
      .select("id, created_at, amount, currency, status")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!latestPayment) {
      return NextResponse.json({
        eligible: false,
        reason: "no-payment",
        message: "We don't see any completed premium payment on your account.",
        thresholds: [],
        partialEligible: false,
      });
    }

    const purchasedAt = new Date(latestPayment.created_at);
    const ageMs = Date.now() - purchasedAt.getTime();
    const daysSincePurchase = ageMs / (1000 * 60 * 60 * 24);
    const insideWindow = daysSincePurchase <= REFUND_WINDOW_DAYS;

    const allPremiumCases = [
      ...scenarios.map((s) => ({ id: s.id, tier: s.tier })),
      ...dplScenarios.map((s) => ({ id: s.id, tier: s.tier })),
      ...combinedScenarios.map((s) => ({ id: s.id, tier: s.tier })),
    ].filter((s) => getIsPremiumCase(s.id, s.tier));

    const premiumCount = allPremiumCases.length;
    const premiumIdSet = new Set(allPremiumCases.map((s) => s.id));

    const { data: attempts } = await admin
      .from("case_attempts")
      .select("scenario_id, is_completed, xp_awarded, updated_at, metadata")
      .eq("user_id", user.id);

    const attemptsArr = attempts ?? [];
    const completedPremium = new Set(
      attemptsArr
        .filter((a) => a.is_completed && premiumIdSet.has(a.scenario_id))
        .map((a) => a.scenario_id)
    );

    const completedCount = completedPremium.size;
    const completionPct = premiumCount > 0 ? completedCount / premiumCount : 0;

    type AttemptRow = (typeof attemptsArr)[number] & { metadata?: { deep_dive_viewed?: boolean } | null };
    const deepDiveViewed = new Set(
      (attemptsArr as AttemptRow[])
        .filter((a) => premiumIdSet.has(a.scenario_id) && a.metadata?.deep_dive_viewed)
        .map((a) => a.scenario_id)
    );

    const thresholds: ThresholdResult[] = [
      {
        key: "completion_percentage",
        label: `Completed > ${Math.round(COMPLETION_PCT_LIMIT * 100)}% of premium cases`,
        passed: completionPct > COMPLETION_PCT_LIMIT,
        detail: `${completedCount} of ${premiumCount} (${(completionPct * 100).toFixed(1)}%)`,
      },
      {
        key: "completed_count",
        label: `Completed ≥ ${COMPLETED_COUNT_LIMIT} premium cases`,
        passed: completedCount >= COMPLETED_COUNT_LIMIT,
        detail: `${completedCount} completed`,
      },
      {
        key: "deep_dive_views",
        label: `Viewed deep-dive walkthrough on > ${DEEP_DIVE_VIEWS_LIMIT} premium cases`,
        passed: deepDiveViewed.size > DEEP_DIVE_VIEWS_LIMIT,
        detail: `${deepDiveViewed.size} walkthrough(s) viewed`,
      },
    ];

    const tripped = thresholds.filter((t) => t.passed);
    const eligibleForFull = insideWindow && tripped.length === 0;
    const partialEligible = insideWindow && !eligibleForFull;

    let estimatedPartial = 0;
    if (partialEligible && premiumCount > 0) {
      const consumedFraction = Math.min(1, completedCount / premiumCount);
      const refundFraction = Math.max(0, 1 - consumedFraction);
      estimatedPartial = Math.round((latestPayment.amount ?? 0) * refundFraction);
    }

    return NextResponse.json({
      eligible: eligibleForFull,
      partialEligible,
      reason: !insideWindow
        ? "outside-window"
        : tripped.length > 0
        ? "thresholds-tripped"
        : "ok",
      message: !insideWindow
        ? `Your purchase is ${Math.floor(daysSincePurchase)} days old; the refund window is ${REFUND_WINDOW_DAYS} days. Post-window refunds are at our discretion (technical issues, duplicate charges, unauthorized payments).`
        : tripped.length > 0
        ? "You no longer qualify for a full refund because you have substantially consumed the premium content. A partial refund may still be available."
        : "You qualify for a full no-questions-asked refund. Submit a refund request through the in-app feedback button.",
      window: {
        purchasedAt: latestPayment.created_at,
        daysSincePurchase: Number(daysSincePurchase.toFixed(2)),
        insideWindow,
        windowDays: REFUND_WINDOW_DAYS,
      },
      payment: {
        amount: latestPayment.amount,
        currency: latestPayment.currency,
      },
      thresholds,
      summary: {
        completedPremium: completedCount,
        totalPremium: premiumCount,
        deepDivesViewed: deepDiveViewed.size,
      },
      estimatedPartialRefundMinor: estimatedPartial,
    });
  } catch (err) {
    console.error("[refund-eligibility]", err);
    const message = err instanceof Error ? err.message : "Eligibility check failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
