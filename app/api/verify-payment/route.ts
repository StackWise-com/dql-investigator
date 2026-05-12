import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminSupabase } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
      amount?: number;
      currency?: string;
    };

    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing payment verification fields" },
        { status: 400 }
      );
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return NextResponse.json(
        { verified: false, message: "Razorpay secret not configured on server" },
        { status: 500 }
      );
    }

    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json(
        { verified: false, message: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // Record the payment
    const supabase = createAdminSupabase();
    const { error } = await supabase.from("payments").insert({
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
      amount: body.amount || 0,
      currency: body.currency || "INR",
      status: "captured",
    });

    if (error) {
      console.warn("[verify-payment] failed to record payment:", error.message);
    }

    return NextResponse.json({
      verified: true,
      message: "Payment verified. Thank you for your support!",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Payment verification failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
