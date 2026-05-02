import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

function getRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay credentials are not configured (RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET)."
    );
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

// Razorpay's Node SDK throws errors shaped like
// { statusCode, error: { code, description, source, step, reason, metadata } }.
// `error instanceof Error` is true but `error.message` is often empty, which
// is why callers have been seeing the bland "Failed to create order" fallback.
function extractRazorpayMessage(err: unknown): string {
  if (typeof err === "object" && err !== null) {
    const e = err as {
      error?: { description?: string; code?: string; reason?: string };
      message?: string;
      statusCode?: number;
    };
    const desc = e.error?.description;
    const code = e.error?.code;
    const reason = e.error?.reason;
    const status = e.statusCode;
    const parts = [desc, code && `(${code})`, reason && `— ${reason}`, status && `[HTTP ${status}]`]
      .filter(Boolean)
      .join(" ");
    if (parts) return parts;
    if (e.message) return e.message;
  }
  if (err instanceof Error && err.message) return err.message;
  return "Razorpay rejected the order. Check the server logs for details.";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, currency = "INR", receipt, notes } = body;

    if (!amount || typeof amount !== "number" || amount < 100) {
      return NextResponse.json(
        { error: "Amount must be at least 100 paise (1 INR)." },
        { status: 400 }
      );
    }

    const order = await getRazorpay().orders.create({
      amount,
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      notes: notes || {},
    });

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error: unknown) {
    // Log the full object so the operator can see the real reason in the server
    // logs, then surface a useful slice of it to the client.
    console.error("[create-order] Razorpay error:", JSON.stringify(error, null, 2));
    return NextResponse.json(
      { error: extractRazorpayMessage(error) },
      { status: 500 }
    );
  }
}
