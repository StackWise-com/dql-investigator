#!/usr/bin/env node
// Quick diagnostic for Razorpay credentials. Reads .env, hits the live
// /v1/orders endpoint with HTTP Basic auth, and prints exactly what Razorpay
// returns. Run with: node scripts/check-razorpay.js
const fs = require("fs");
const path = require("path");

function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env");
  const raw = fs.readFileSync(envPath, "utf8");
  const out = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

(async () => {
  const env = loadEnv();
  const keyId = env.RAZORPAY_KEY_ID || env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const secret = env.RAZORPAY_KEY_SECRET;

  if (!keyId || !secret) {
    console.error("Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET in .env");
    process.exit(1);
  }

  console.log("Key ID prefix:        ", keyId.slice(0, 12) + "..." + keyId.slice(-2));
  console.log("Key ID length:        ", keyId.length);
  console.log("Secret length:        ", secret.length);
  console.log("Mode:                 ", keyId.startsWith("rzp_test_") ? "TEST" : keyId.startsWith("rzp_live_") ? "LIVE" : "UNKNOWN");

  const auth = Buffer.from(`${keyId}:${secret}`).toString("base64");

  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amount: 100, currency: "INR", receipt: `diag_${Date.now()}` }),
  });

  console.log("\nHTTP status:          ", res.status);
  const body = await res.text();
  try {
    console.log("Response body:        ", JSON.stringify(JSON.parse(body), null, 2));
  } catch {
    console.log("Response body (raw):  ", body);
  }

  if (res.status === 200) {
    console.log("\n✅ Credentials are valid. The 401 in your app is caused by a stale dev server — restart `next dev` so it picks up the .env values.");
  } else if (res.status === 401) {
    console.log("\n❌ Credentials are NOT valid against Razorpay. Common causes:");
    console.log("   1. KEY_ID and KEY_SECRET were copied from different generation events.");
    console.log("      Open Razorpay Dashboard → Settings → API Keys, click 'Regenerate Test Key',");
    console.log("      then copy BOTH the Key Id and the Secret in one go.");
    console.log("   2. The key was deleted or the account is in 'inactive' state.");
    console.log("   3. You're mixing a TEST key with a LIVE secret (or vice versa).");
    console.log("\n   After updating .env, you MUST restart `next dev` — it does not hot-reload .env.");
  } else {
    console.log("\n⚠️  Unexpected status. See the response body above.");
  }
})().catch((e) => {
  console.error("Script failed:", e);
  process.exit(1);
});
