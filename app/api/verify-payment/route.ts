import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing required fields: razorpay_order_id, razorpay_payment_id, razorpay_signature" },
        { status: 400 }
      );
    }

    const secret = process.env.RAZORPAY_KEY_SECRET!;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const isValid = expectedSignature === razorpay_signature;

    if (!isValid) {
      return NextResponse.json(
        { error: "Signature mismatch", verified: false },
        { status: 400 }
      );
    }

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
