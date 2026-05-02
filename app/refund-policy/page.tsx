export const metadata = {
  title: "Refund Policy — DQL Investigator",
  description: "Refund Policy for DQL Investigator premium purchases.",
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-100">Refund Policy</h1>
          <p className="text-sm text-slate-400">Last updated: May 2, 2026</p>
          <a href="/pricing" className="text-xs text-cyan-400 hover:underline">← Back to pricing</a>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-medium text-slate-200">Summary</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            We offer a 7-day refund window on premium purchases, subject to the limits
            described below. The limits exist to keep the offer fair to the many users who
            buy in good faith. They are based on how much premium content you have
            consumed, not on the calendar alone.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium text-slate-200">1. 7-Day refund window</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            You may request a full refund of your premium purchase within{" "}
            <strong>7 calendar days of the original payment</strong>, provided you have not
            substantially consumed the premium content (see Section 2). Requests received
            after 7 days are handled at our discretion under Section 4.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium text-slate-200">
            2. Substantial-use clause (the &quot;completed-the-content&quot; rule)
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Premium content is digital and, once consumed, cannot be returned. If a user
            were to complete most or all of the premium cases inside the 7-day window and
            then ask for a full refund, that would unfairly let them keep the educational
            value while paying nothing.
          </p>
          <p className="text-sm text-slate-400 leading-relaxed">
            For that reason, your eligibility for a <strong>full</strong> refund is forfeited if,
            at the time of the request, <strong>any</strong> of the following is true:
          </p>
          <ul className="list-disc list-inside text-sm text-slate-400 leading-relaxed space-y-1">
            <li>
              You have completed more than <strong>25% of the premium-locked cases</strong>{" "}
              (counted across the DQL, DPL, and Combined tracks); or
            </li>
            <li>
              You have completed <strong>5 or more premium cases</strong>; or
            </li>
            <li>
              You have viewed the deep-dive walkthrough for more than{" "}
              <strong>3 distinct premium cases</strong>; or
            </li>
            <li>
              You have downloaded, copied, or exported a substantial portion of the premium
              datasets, walkthroughs, or solutions.
            </li>
          </ul>
          <p className="text-sm text-slate-400 leading-relaxed">
            These are <em>independent</em> thresholds — meeting any one of them ends
            eligibility for a no-questions-asked full refund. The thresholds are measured
            against your account&apos;s server-side activity log.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium text-slate-200">3. Partial refunds</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            If you fall outside the full-refund eligibility but still wish to discontinue,
            you may request a <strong>partial refund</strong> within the 7-day window. We will
            calculate it as the purchase price minus a pro-rated value of the premium
            content already consumed (each completed premium case is valued proportionally
            to its share of total premium content). Partial refunds are granted at our
            reasonable discretion and only when activity logs are consistent with good-
            faith use.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium text-slate-200">4. After 7 days</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Once the 7-day window has elapsed, refunds are granted only at our discretion,
            and typically only when:
          </p>
          <ul className="list-disc list-inside text-sm text-slate-400 leading-relaxed space-y-1">
            <li>A technical defect on our side has prevented you from accessing the content; or</li>
            <li>A duplicate or accidental charge has occurred (report within 48 hours of the charge); or</li>
            <li>A payment was unauthorized and you have notified your card issuer.</li>
          </ul>
          <p className="text-sm text-slate-400 leading-relaxed">
            We do not refund for change of mind after 7 days.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium text-slate-200">5. What is not refundable</h2>
          <ul className="list-disc list-inside text-sm text-slate-400 leading-relaxed space-y-1">
            <li>Accounts terminated for violations of the Terms &amp; Conditions.</li>
            <li>Purchases made with fraudulent or charged-back payment methods.</li>
            <li>Coffee tips and any other voluntary, non-product payments.</li>
            <li>
              Currency-conversion losses, payment-gateway fees retained by Razorpay or your
              bank, or any local tax already remitted to authorities. The refund returns the
              net amount we received, in the original currency, to the original payment
              instrument.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium text-slate-200">6. Anti-abuse</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            We reserve the right to deny a refund and/or terminate the account where, on
            reasonable evidence, we believe a request is part of a pattern of abuse —
            including, without limitation: speed-running premium content within the refund
            window, creating multiple accounts to repeatedly claim the offer, sharing
            premium credentials, or coordinating refund-back-to-back purchases. Such
            denials are final.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium text-slate-200">7. How to request a refund</h2>
          <ul className="list-disc list-inside text-sm text-slate-400 leading-relaxed space-y-1">
            <li>
              Email <strong>technomonstert@gmail.com</strong> with your Razorpay payment ID
              (starts with <code>pay_</code> or <code>order_</code>) and the email associated
              with the account.
            </li>
            <li>
              Or use the in-app feedback button and write <strong>&quot;Refund Request&quot;</strong> at the
              top of the message.
            </li>
            <li>
              We aim to acknowledge requests within <strong>2 business days</strong> and to process
              eligible refunds within <strong>5–7 business days</strong> from approval to the
              original payment method. Bank-side settlement may take additional days.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium text-slate-200">8. Statutory rights</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Nothing in this policy limits any non-waivable consumer rights you may have
            under the laws of your jurisdiction. Where a local consumer-protection statute
            grants a stronger refund right for digital content, that statute prevails over
            the thresholds in Section 2 only to the extent legally required.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium text-slate-200">9. Changes</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            We may update this policy from time to time. The version in force at the time
            of your purchase is the one that applies to that purchase. The current version
            is dated above.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium text-slate-200">10. Contact</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Questions about refunds? Email <strong>technomonstert@gmail.com</strong> or use
            the in-app feedback button.
          </p>
        </section>
      </div>
    </div>
  );
}
