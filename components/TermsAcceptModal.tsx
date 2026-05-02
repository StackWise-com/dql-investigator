"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInvestigatorStore } from "@/lib/store/useInvestigatorStore";
import { acceptTerms, TERMS_VERSION } from "@/lib/api/profile";

// Blocking modal that appears the first time a logged-in user enters the
// app without having accepted the current terms. The user cannot dismiss
// it without clicking "I Accept" or signing out.
export function TermsAcceptModal() {
  const userId = useInvestigatorStore((s) => s.userId);
  const userEmail = useInvestigatorStore((s) => s.userEmail);
  const termsAcceptedAt = useInvestigatorStore((s) => s.termsAcceptedAt);
  const setTermsAcceptedAt = useInvestigatorStore((s) => s.setTermsAcceptedAt);

  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const open = Boolean(userEmail && userId) && !termsAcceptedAt;

  const handleAccept = async () => {
    if (!userId || !agreed) return;
    setSubmitting(true);
    setError("");
    try {
      await acceptTerms(userId);
      setTermsAcceptedAt(new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save acceptance.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-2xl glass-panel-strong rounded-xl border border-cyan-400/20 p-6 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-slate-100">Before you continue</h2>
              <span className="text-[10px] text-slate-500">v {TERMS_VERSION}</span>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Please read and accept the terms below to use DQL Investigator.
              We&apos;ll also remember the timestamp of your acceptance for our records.
            </p>

            <div className="flex-1 overflow-y-auto pr-2 text-xs text-slate-300 space-y-3 leading-relaxed">
              <Section title="1. About this platform">
                DQL Investigator is an <strong>independent, third-party educational platform</strong>{" "}
                designed to help users practice and learn the syntax, structure, and
                problem-solving patterns of query languages used in modern observability
                tooling. It is operated solely by its independent author for educational
                purposes.
              </Section>

              <Section title="2. No affiliation with Dynatrace">
                This site is <strong>not affiliated with, endorsed by, sponsored by, or in any
                way officially connected with Dynatrace LLC, Dynatrace Inc., or any of its
                subsidiaries or affiliates</strong>. The names &quot;Dynatrace&quot;, &quot;DQL&quot;, &quot;Grail&quot;, and any
                related marks are the property of their respective owners. References to
                such names appear only as descriptive, fair-use mentions for the purpose of
                identifying the subject matter of this learning material.
              </Section>

              <Section title="3. No real backend; no production data">
                The platform does <strong>not run, host, simulate, or implement any portion of the
                Grail data lakehouse</strong>. It does <strong>not connect to any Dynatrace tenant,
                environment, API, or production system</strong>. All data shown to the user is
                synthetic, locally generated, and exists purely for instructional
                demonstration. No real telemetry, customer data, or proprietary technology is
                used at any stage.
              </Section>

              <Section title="4. Educational use only">
                Content on this site is provided for personal learning. It does not
                constitute professional advice, a certification, or a substitute for
                official documentation. Users are responsible for verifying any concepts
                against authoritative sources before applying them in production
                environments.
              </Section>

              <Section title="5. User accounts and conduct">
                You agree to (a) provide accurate registration information, (b) keep your
                credentials confidential, (c) use the platform only for lawful purposes,
                (d) not attempt to reverse-engineer, scrape, overload, or otherwise abuse
                the service, and (e) not impersonate any person or entity, including
                Dynatrace personnel, in your display name or profile.
              </Section>

              <Section title="6. Payments, premium content, and refunds">
                Optional premium content is sold via Razorpay. Pricing, billing currency,
                and refund eligibility are governed by the separate{" "}
                <a href="/refund-policy" className="text-cyan-400 hover:underline" target="_blank" rel="noopener noreferrer">
                  Refund Policy
                </a>
                . By purchasing, you confirm you are over 18 and authorized to use the
                payment instrument.
              </Section>

              <Section title="7. Intellectual property">
                All original copy, scenarios, exercises, code, design, and synthetic
                datasets on this platform are the property of the operator and are
                protected by applicable copyright and database-rights law. You may not
                redistribute, republish, or train commercial models on the content without
                prior written permission. Trademarks of third parties remain the property
                of their respective owners.
              </Section>

              <Section title="8. Privacy and data we store">
                We store your email, optional display name, country, accepted-terms
                timestamp, and progress/XP totals. Display name and XP totals appear on the
                public leaderboard once you accept these terms. We do not sell your data.
                See the in-app profile page to review or update your information at any
                time.
              </Section>

              <Section title="9. Disclaimers and limitation of liability">
                The platform is provided <strong>&quot;as is&quot;</strong> and <strong>&quot;as available&quot;</strong>, without
                warranties of any kind, whether express or implied, including merchantability,
                fitness for a particular purpose, accuracy, or non-infringement. To the maximum
                extent permitted by applicable law, the operator shall not be liable for any
                indirect, incidental, special, consequential, or punitive damages, or any loss
                of profits, data, or goodwill arising out of or relating to your use of the
                platform.
              </Section>

              <Section title="10. Indemnity">
                You agree to indemnify and hold harmless the operator from any claims,
                damages, or expenses arising out of (a) your misuse of the platform,
                (b) your breach of these terms, or (c) your infringement of any third-party
                right.
              </Section>

              <Section title="11. Governing law and jurisdiction">
                These terms are governed by the laws of India. Any dispute arising hereunder
                shall be subject to the exclusive jurisdiction of the courts located in
                India. If you are accessing the platform from outside India, you do so on
                your own initiative and are responsible for compliance with local law.
              </Section>

              <Section title="12. Changes to these terms">
                We may update these terms from time to time. Material changes will require a
                fresh acceptance the next time you sign in. Continued use of the platform
                after a non-material change constitutes acceptance of the revised terms.
              </Section>

              <Section title="13. Contact">
                Questions, takedown requests, or notices of any kind may be sent through the
                in-app feedback button.
              </Section>
            </div>

            <div className="border-t border-white/[0.06] mt-4 pt-4 space-y-3">
              <label className="flex items-start gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 w-3.5 h-3.5 rounded border-white/20 bg-slate-900 text-cyan-400 focus:ring-cyan-400"
                />
                <span>
                  I have read and agree to the Terms above and the{" "}
                  <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
                    full Terms &amp; Conditions
                  </a>
                  . I understand this platform is independent of and not affiliated with
                  Dynatrace, contains no real Grail backend, and is for learning only.
                </span>
              </label>

              {error && (
                <p className="text-xs text-rose-400 bg-rose-400/10 border border-rose-400/20 rounded-md p-2">{error}</p>
              )}

              <motion.button
                whileHover={{ scale: agreed && !submitting ? 1.01 : 1 }}
                whileTap={{ scale: agreed && !submitting ? 0.99 : 1 }}
                onClick={handleAccept}
                disabled={!agreed || submitting}
                className="w-full py-2.5 rounded-md text-sm font-medium bg-cyan-400/15 text-cyan-300 hover:bg-cyan-400/25 border border-cyan-400/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? "Saving..." : "I Accept"}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400 mb-1">
        {title}
      </h3>
      <p>{children}</p>
    </div>
  );
}
