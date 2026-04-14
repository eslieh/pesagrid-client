import Reveal from "../pesagrid/Reveal";
import Link from "next/link";

export const metadata = {
  title: "Terms of Service | PesaGrid",
  description: "Read the terms and conditions for using PesaGrid's automated reconciliation and payment infrastructure services.",
};

export default function TermsOfService() {
  const effectiveDate = "April 14, 2026";
  
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 selection:bg-lime-200">
      {/* Background Orbs */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-28 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-lime-300/20 blur-3xl" />
        <div className="absolute -left-24 top-48 h-[22rem] w-[22rem] rounded-full bg-emerald-200/25 blur-3xl" />
      </div>

      <header className="sticky top-0 z-20 border-b border-white/40 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between px-6">
          <Link href="/" className="text-xl font-bold tracking-tight text-zinc-800">
            PesaGrid
          </Link>
          <Link href="/" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
            Back to Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-16 lg:py-24">
        <Reveal>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            Terms of Service
          </h1>
          <p className="mt-4 text-zinc-500 font-medium">
            Effective Date: {effectiveDate}
          </p>
        </Reveal>

        <div className="mt-12 space-y-12 text-base leading-7 text-zinc-600">
          <Reveal delay={0.1}>
            <section>
              <h2 className="text-xl font-semibold text-zinc-900">1. Acceptance</h2>
              <p className="mt-4">
                By accessing or using PesaGrid, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
              </p>
            </section>
          </Reveal>

          <Reveal delay={0.15}>
            <section>
              <h2 className="text-xl font-semibold text-zinc-900">2. Services</h2>
              <p className="mt-4">PesaGrid provides:</p>
              <ul className="mt-2 list-inside list-disc space-y-1 font-semibold text-zinc-800">
                <li>Payment infrastructure</li>
                <li>API integrations</li>
                <li>Financial transaction tools</li>
                <li>Reconciliation (listening to banks and PSPs)</li>
              </ul>
            </section>
          </Reveal>

          <Reveal delay={0.2}>
            <section>
              <h2 className="text-xl font-semibold text-zinc-900">3. Eligibility</h2>
              <p className="mt-4">You must:</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Be at least 18 years old</li>
                <li>Provide accurate and complete information during registration</li>
                <li>Comply with all applicable local and international laws</li>
              </ul>
            </section>
          </Reveal>

          <Reveal delay={0.25}>
            <section>
              <h2 className="text-xl font-semibold text-zinc-900">4. Account Responsibilities</h2>
              <p className="mt-4 font-bold text-zinc-800">You are responsible for:</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Maintaining the security and confidentiality of your account credentials</li>
                <li>All activity that occurs under your account</li>
                <li>Notifying us immediately of any unauthorized use of your account</li>
              </ul>
            </section>
          </Reveal>

          <Reveal delay={0.3}>
            <section>
              <h2 className="text-xl font-semibold text-zinc-900">5. Payments & Fees</h2>
              <ul className="mt-4 list-inside list-disc space-y-1">
                <li>Fees may apply depending on your selected plan and usage.</li>
                <li>All transactions are final unless explicitly stated otherwise.</li>
                <li>Chargebacks and disputes follow the rules set by our payment providers.</li>
              </ul>
            </section>
          </Reveal>

          <Reveal delay={0.35}>
            <section>
              <h2 className="text-xl font-semibold text-zinc-900">6. Prohibited Activities</h2>
              <p className="mt-4">You may NOT use PesaGrid for:</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Fraudulent or illegal transactions</li>
                <li>Money laundering activities</li>
                <li>Unauthorized access, hacking, or data breaches</li>
                <li>Abuse or misuse of our APIs</li>
              </ul>
            </section>
          </Reveal>

          <Reveal delay={0.4}>
            <section>
              <h2 className="text-xl font-semibold text-zinc-900">7. API Usage</h2>
              <ul className="mt-4 list-inside list-disc space-y-1">
                <li>Users must adhere to established rate limits.</li>
                <li>You are solely responsible for the secure implementation of our APIs.</li>
                <li>Abuse or excessive use of APIs may lead to temporary or permanent suspension.</li>
              </ul>
            </section>
          </Reveal>

          <Reveal delay={0.45}>
            <section>
              <h2 className="text-xl font-semibold text-zinc-900">8. Service Availability</h2>
              <p className="mt-4">We aim for maximum uptime, however:</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>We do not guarantee uninterrupted or error-free service.</li>
                <li>We may perform scheduled maintenance or emergency updates at any time.</li>
              </ul>
            </section>
          </Reveal>

          <Reveal delay={0.5}>
            <section>
              <h2 className="text-xl font-semibold text-zinc-900">9. Suspension & Termination</h2>
              <p className="mt-4">We reserve the right to suspend or terminate accounts if:</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>These Terms are violated.</li>
                <li>Fraudulent activity or high security risk is detected.</li>
              </ul>
            </section>
          </Reveal>

          <Reveal delay={0.55}>
            <section>
              <h2 className="text-xl font-semibold text-zinc-900">10. Limitation of Liability</h2>
              <p className="mt-4">PesaGrid is NOT liable for:</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Indirect, incidental, or consequential losses.</li>
                <li>Losses resulting from service downtime.</li>
                <li>Failures or delays caused by third-party systems (banks, PSPs, etc.).</li>
              </ul>
            </section>
          </Reveal>

          <Reveal delay={0.6}>
            <section>
              <h2 className="text-xl font-semibold text-zinc-900">11. Indemnification</h2>
              <p className="mt-4">
                You agree to indemnify and hold PesaGrid harmless against any claims, damages, or losses arising from your misuse of the platform or violation of these Terms.
              </p>
            </section>
          </Reveal>

          <Reveal delay={0.65}>
            <section>
              <h2 className="text-xl font-semibold text-zinc-900">12. Governing Law</h2>
              <p className="mt-4">
                This agreement shall be governed by and construed in accordance with the laws of **Kenya**.
              </p>
            </section>
          </Reveal>

          <Reveal delay={0.7}>
            <section className="rounded-3xl border border-zinc-900/10 bg-white p-8 shadow-sm">
              <h2 className="text-xl font-bold text-zinc-900">⚠️ Disclaimers</h2>
              <div className="mt-6 space-y-6 text-sm">
                <div>
                  <h3 className="font-bold text-zinc-800 uppercase tracking-wider text-[10px]">No Financial Advice</h3>
                  <p className="mt-1">PesaGrid does not provide financial, investment, or legal advice.</p>
                </div>
                <div>
                  <h3 className="font-bold text-zinc-800 uppercase tracking-wider text-[10px]">Third-Party Services</h3>
                  <p className="mt-1">We rely on external providers (banks, telecom services). We are not responsible for their failures.</p>
                </div>
                <div>
                  <h3 className="font-bold text-zinc-800 uppercase tracking-wider text-[10px]">Transaction Risks</h3>
                  <p className="mt-1">Transactions may fail or experience delays due to external system impacts.</p>
                </div>
                <div>
                  <h3 className="font-bold text-zinc-800 uppercase tracking-wider text-[10px]">Compliance</h3>
                  <p className="mt-1">Users must ensure their usage complies with all local laws and tax regulations.</p>
                </div>
              </div>
            </section>
          </Reveal>
        </div>
      </main>

      <footer className="border-t border-zinc-200 bg-white py-12">
        <div className="mx-auto max-w-4xl px-6 text-center text-sm text-zinc-500">
          <p>© {new Date().getFullYear()} PesaGrid. All rights reserved.</p>
          <div className="mt-4 flex justify-center gap-6">
            <Link href="/privacy" className="hover:text-zinc-900 transition-colors">Privacy Policy</Link>
            <Link href="/" className="hover:text-zinc-900 transition-colors">Home</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
