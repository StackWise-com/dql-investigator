export const metadata = {
  title: "Terms & Conditions — DQL Investigator",
  description:
    "Terms & Conditions for DQL Investigator: an independent learning platform not affiliated with Dynatrace.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-100">Terms &amp; Conditions</h1>
          <p className="text-sm text-slate-400">Last updated: May 2, 2026 — Version 2026-05-02-v1</p>
          <a href="/" className="text-xs text-cyan-400 hover:underline">← Back to app</a>
        </div>

        <Disclaimer />

        <Section
          n="1"
          title="About this platform"
          body={
            <>
              DQL Investigator (the &quot;Service&quot;, &quot;we&quot;, &quot;us&quot;) is an independent,
              third-party educational platform designed to help users practice the syntax,
              structure, and problem-solving patterns of query languages used in modern
              observability tooling. The Service is operated by an independent author for
              educational purposes only.
            </>
          }
        />

        <Section
          n="2"
          title="No affiliation with Dynatrace"
          body={
            <>
              The Service is <strong>not affiliated with, endorsed by, sponsored by, or in any
              way officially connected with</strong> Dynatrace LLC, Dynatrace Inc., or any of its
              subsidiaries, parents, or affiliates. The names &quot;Dynatrace&quot;, &quot;DQL&quot;, &quot;Grail&quot;,
              and any related marks, logos, or product names are the property of their
              respective owners. References on the Service are descriptive, fair-use mentions
              made for the sole purpose of identifying the subject matter of the educational
              content. No claim of authorship, partnership, or trademark interest is
              asserted. If a rights-holder believes any content here is misleading or
              infringing, please contact us through the in-app feedback button and we will
              respond promptly.
            </>
          }
        />

        <Section
          n="3"
          title="No real backend; no production data"
          body={
            <>
              The Service does <strong>not run, host, simulate, replicate, reproduce, or implement
              any portion of the Grail data lakehouse</strong> or any other proprietary Dynatrace
              technology. The Service does <strong>not connect to any Dynatrace tenant, environment,
              API, agent, OneAgent, or production system</strong>. Every dataset, log line, span,
              metric, and event displayed to the user is <strong>synthetic and locally generated</strong>{" "}
              for instructional demonstration. No real customer telemetry, proprietary
              algorithm, source code, or confidential information of Dynatrace or any other
              party is used, stored, or transmitted at any stage.
            </>
          }
        />

        <Section
          n="4"
          title="Educational use only; not professional advice"
          body={
            <>
              The content of the Service is provided for personal learning and is not
              intended as a certification, accreditation, or substitute for official product
              documentation, training, or professional advice. The Service does not warrant
              that its content corresponds to any particular version of any third-party
              product. Users are solely responsible for verifying any concept against
              authoritative sources before applying it in a production context.
            </>
          }
        />

        <Section
          n="5"
          title="Eligibility and accounts"
          body={
            <>
              To use the Service you must be at least 13 years old (or the digital-consent
              age required by your jurisdiction). To purchase premium features you must be
              at least 18 and authorized to use the payment instrument. You agree to provide
              accurate registration information, keep your credentials confidential, and
              promptly notify us of any unauthorized use.
            </>
          }
        />

        <Section
          n="6"
          title="Acceptable use"
          body={
            <>
              You agree not to: (a) reverse-engineer, decompile, scrape, or attempt to derive
              source from the Service; (b) overload, flood, probe, or otherwise interfere
              with the Service&apos;s infrastructure; (c) impersonate any person or entity,
              including any Dynatrace employee, partner, or representative, in your display
              name, profile, or communications; (d) upload or transmit unlawful, infringing,
              hateful, or harassing content; (e) use the Service to train commercial machine-
              learning models without prior written permission; or (f) circumvent any access
              control, paywall, or rate limit. We may suspend or terminate accounts that
              violate this section.
            </>
          }
        />

        <Section
          n="7"
          title="Premium content, payments, and currency"
          body={
            <>
              Premium content is sold as a one-time purchase processed via Razorpay. Pricing
              is displayed in your local currency where supported. International payments may
              not be available in all jurisdictions. By initiating a purchase, you authorize
              the charge and confirm the accuracy of your payment details. Razorpay&apos;s own
              terms and privacy policy apply to payment processing.
            </>
          }
        />

        <Section
          n="8"
          title="Refunds"
          body={
            <>
              Refund eligibility is governed by our separate{" "}
              <a href="/refund-policy" className="text-cyan-400 hover:underline">
                Refund Policy
              </a>
              , which is incorporated into these Terms by reference.
            </>
          }
        />

        <Section
          n="9"
          title="Privacy and data we store"
          body={
            <>
              We store: your authentication email, an optional public display name, your
              country (used to display localized currency), the timestamp at which you
              accepted these Terms (and the Terms version), your premium status, and your
              learning- and game-progress XP totals. Your display name and XP totals appear
              on the public leaderboard once you accept these Terms. We do not sell your
              data. Authentication is handled by Supabase. Payment data is handled by
              Razorpay. You may at any time view, edit, or delete your profile information
              from inside the app, and you may request account deletion via the feedback
              button.
            </>
          }
        />

        <Section
          n="10"
          title="Intellectual property"
          body={
            <>
              All original copy, scenarios, exercises, code, design, illustrations, sound,
              and synthetic datasets on the Service are the property of the operator and are
              protected by applicable copyright, database-right, and trade-secret law. You
              may not redistribute, republish, mirror, or commercially exploit the content
              without prior written permission. Trademarks of third parties remain the
              property of their respective owners and are referenced only as permitted by
              fair use.
            </>
          }
        />

        <Section
          n="11"
          title="Disclaimers"
          body={
            <>
              The Service is provided <strong>&quot;AS IS&quot;</strong> and <strong>&quot;AS AVAILABLE&quot;</strong>, without
              warranties of any kind, whether express, implied, statutory, or otherwise, including
              warranties of merchantability, fitness for a particular purpose, accuracy,
              non-infringement, or uninterrupted operation. We do not warrant that the
              Service will be error-free, that defects will be corrected, or that the Service
              or the server that makes it available are free of viruses or other harmful
              components.
            </>
          }
        />

        <Section
          n="12"
          title="Limitation of liability"
          body={
            <>
              To the maximum extent permitted by applicable law, the operator shall not be
              liable for any indirect, incidental, special, consequential, exemplary, or
              punitive damages, or any loss of profits, revenues, data, goodwill, or other
              intangible losses, arising out of or relating to your access to or use of, or
              inability to access or use, the Service, regardless of the legal theory
              (contract, tort, statute, or otherwise) and even if advised of the possibility
              of such damages. The operator&apos;s aggregate liability for direct damages shall
              not exceed the total amount you paid to the operator, if any, in the twelve
              (12) months preceding the event giving rise to the claim.
            </>
          }
        />

        <Section
          n="13"
          title="Indemnity"
          body={
            <>
              You agree to defend, indemnify, and hold harmless the operator from and against
              any claims, liabilities, damages, losses, and expenses (including reasonable
              attorneys&apos; fees) arising out of or in any way connected with (a) your
              access to or use of the Service, (b) your breach of these Terms, or (c) your
              violation of any third-party right, including any intellectual-property right.
            </>
          }
        />

        <Section
          n="14"
          title="Governing law and jurisdiction"
          body={
            <>
              These Terms are governed by and construed in accordance with the laws of India,
              without regard to conflict-of-laws principles. Any dispute arising out of or in
              connection with these Terms shall be subject to the exclusive jurisdiction of
              the courts located in India. If you are accessing the Service from outside
              India, you do so on your own initiative and are responsible for compliance with
              local law.
            </>
          }
        />

        <Section
          n="15"
          title="Changes to these Terms"
          body={
            <>
              We may update these Terms from time to time. The &quot;Last updated&quot; date and
              version identifier above will reflect the latest revision. Material changes
              will require fresh acceptance the next time you sign in. Continued use of the
              Service after a non-material change constitutes acceptance of the revised Terms.
            </>
          }
        />

        <Section
          n="16"
          title="Severability and entire agreement"
          body={
            <>
              If any provision of these Terms is held unenforceable, the remaining
              provisions will remain in full force and effect. These Terms, together with
              the Refund Policy, constitute the entire agreement between you and the operator
              regarding the Service and supersede all prior agreements.
            </>
          }
        />

        <Section
          n="17"
          title="Contact"
          body={
            <>
              For questions, takedown notices, data-deletion requests, or any other inquiry,
              please use the in-app feedback button. We aim to respond within a reasonable
              time.
            </>
          }
        />
      </div>
    </div>
  );
}

function Disclaimer() {
  return (
    <div className="rounded-lg border border-amber-400/30 bg-amber-400/5 p-4 text-xs text-amber-200 leading-relaxed">
      <p className="font-semibold text-amber-300 mb-1">Important disclaimer</p>
      <p>
        DQL Investigator is an <strong>independent learning platform</strong>. It is{" "}
        <strong>not affiliated with, endorsed by, or sponsored by Dynatrace</strong>. It does{" "}
        <strong>not run any Grail backend</strong> and does <strong>not integrate with any
        Dynatrace environment, tenant, API, or production system</strong>. All data shown is
        synthetic and locally generated for educational purposes only.
      </p>
    </div>
  );
}

function Section({ n, title, body }: { n: string; title: string; body: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold text-slate-200">
        <span className="text-cyan-400 mr-2">{n}.</span>
        {title}
      </h2>
      <p className="text-sm text-slate-400 leading-relaxed">{body}</p>
    </section>
  );
}
