import { NextResponse } from "next/server";
import Razorpay from "razorpay";

function getRazorpayClient() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay credentials missing. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment."
    );
  }

  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

export async function POST(request: Request) {
  try {
    const { amount, currency, receipt, notes } = (await request.json()) as {
      amount: number;
      currency: string;
      receipt?: string;
      notes?: Record<string, string>;
    };

    if (!amount || amount < 1) {
      return NextResponse.json(
        { error: "amount is required and must be at least 1" },
        { status: 400 }
      );
    }
    if (!currency) {
      return NextResponse.json(
        { error: "currency is required" },
        { status: 400 }
      );
    }

    const razorpay = getRazorpayClient();

    const order = await razorpay.orders.create({
      amount,
      currency: currency.toUpperCase(),
      receipt: receipt || `order_${Date.now()}`,
      notes,
    });

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err: unknown) {
    console.error("[create-order] Error:", err);

    let message = "Failed to create order";
    if (err instanceof Error) {
      message = err.message;
    } else if (typeof err === "object" && err !== null) {
      const anyErr = err as Record<string, unknown>;
      if (typeof anyErr.description === "string") {
        message = anyErr.description;
      } else if (typeof anyErr.message === "string") {
        message = anyErr.message;
      } else if (typeof anyErr.error === "string") {
        message = anyErr.error;
      }
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
