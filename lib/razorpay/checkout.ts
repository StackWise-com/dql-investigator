export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: RazorpayResponse) => void) => void;
    };
  }
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById("razorpay-checkout-script")) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-checkout-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay checkout script"));
    document.body.appendChild(script);
  });
}

export async function createOrder(amount: number, currency: string, receipt?: string, notes?: Record<string, string>) {
  const res = await fetch("/api/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount, currency, receipt, notes }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to create order: ${res.status}`);
  }

  return res.json() as Promise<{ order_id: string; amount: number; currency: string }>;
}

export async function verifyPayment(response: RazorpayResponse) {
  const res = await fetch("/api/verify-payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(response),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to verify payment: ${res.status}`);
  }

  return res.json() as Promise<{ verified: boolean; message: string }>;
}

function isTestKey(key: string): boolean {
  return key.startsWith("rzp_test_");
}

export function getEffectiveCurrency(requestedCurrency: string): {
  currency: string;
  isTestMode: boolean;
} {
  const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";
  if (isTestKey(key)) {
    // Razorpay test accounts are Indian by default and only support INR reliably
    return { currency: "INR", isTestMode: true };
  }
  return { currency: requestedCurrency, isTestMode: false };
}

export function convertToTestAmount(originalAmount: number, originalCurrency: string): number {
  // For test mode, convert to a reasonable INR amount
  // Use a fixed test amount to avoid currency conversion headaches
  const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";
  if (isTestKey(key)) {
    // Return a reasonable INR test amount (e.g. ₹100)
    // This avoids "international cards not supported" errors
    return Math.max(100, Math.round(originalAmount));
  }
  return originalAmount;
}

export async function openRazorpayCheckout(options: {
  amount: number;
  currency: string;
  name: string;
  description: string;
  receipt?: string;
  notes?: Record<string, string>;
  prefill?: RazorpayOptions["prefill"];
  onSuccess?: (response: RazorpayResponse) => void;
  onDismiss?: () => void;
  onError?: (error: unknown) => void;
}): Promise<void> {
  await loadRazorpayScript();

  const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  if (!key) {
    throw new Error("NEXT_PUBLIC_RAZORPAY_KEY_ID is not set in environment variables");
  }

  const { currency, isTestMode } = getEffectiveCurrency(options.currency);
  const amount = isTestMode ? convertToTestAmount(options.amount, options.currency) : options.amount;

  const order = await createOrder(amount, currency, options.receipt, options.notes);

  const rzp = new window.Razorpay({
    key,
    amount: order.amount,
    currency: order.currency,
    name: options.name,
    description: options.description,
    order_id: order.order_id,
    prefill: options.prefill || {},
    theme: { color: "#22d3ee" },
    // Explicitly configure payment methods for test mode
    method: {
      card: true,
      upi: true,
      netbanking: true,
      wallet: true,
      emi: false,
      paylater: false,
    },
    handler: (response: RazorpayResponse) => {
      if (options.onSuccess) {
        options.onSuccess(response);
      }
    },
    modal: {
      ondismiss: () => {
        if (options.onDismiss) {
          options.onDismiss();
        }
      },
      escape: true,
      backdropclose: false,
      confirm_close: true,
    },
  });

  rzp.on("payment.failed", (response: RazorpayResponse) => {
    if (options.onError) {
      options.onError(response);
    }
  });

  rzp.open();
}
