import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createServerSupabase, createAdminSupabase } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, currency } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing required fields: razorpay_order_id, razorpay_payment_id, razorpay_signature" },
        { status: 400 }
      );
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: "Razorpay secret not configured", verified: false },
        { status: 500 }
      );
    }
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json(
        { error: "Signature mismatch", verified: false },
        { status: 400 }
      );
    }

    const userClient = createServerSupabase();
    const { data: { user } } = await userClient.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated", verified: false },
        { status: 401 }
      );
    }

    const admin = createAdminSupabase();

    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const { error: profileErr } = await admin
      .from("profiles")
      .update({ is_premium: true, premium_expires_at: expiresAt.toISOString() })
      .eq("id", user.id);
    if (profileErr) throw profileErr;

    const { error: paymentErr } = await admin
      .from("payments")
      .insert({
        user_id: user.id,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        amount: typeof amount === "number" ? amount : 0,
        currency: typeof currency === "string" ? currency : "INR",
        status: "completed",
        metadata: { source: "premium_unlock" },
      });
    if (paymentErr) throw paymentErr;

    return NextResponse.json({
      verified: true,
      message: "Payment verified successfully",
      razorpay_order_id,
      razorpay_payment_id,
    });
  } catch (error: unknown) {
    console.error("Razorpay verify payment error:", error);
    const message = error instanceof Error ? error.message : "Failed to verify payment";
    return NextResponse.json({ error: message, verified: false }, { status: 500 });
  }
}
