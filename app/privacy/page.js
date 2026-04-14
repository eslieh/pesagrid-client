import Reveal from "../pesagrid/Reveal";
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | PesaGrid",
  description: "Learn how PesaGrid collects, uses, and protects your personal data when using our automated reconciliation platform.",
};

export default function PrivacyPolicy() {
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
            Privacy Policy
          </h1>
          <p className="mt-4 text-zinc-500 font-medium">
            Effective Date: {effectiveDate}
          </p>
        </Reveal>

        <div className="mt-12 space-y-12 text-base leading-7 text-zinc-600">
          <Reveal delay={0.1}>
            <section>
              <h2 className="text-xl font-semibold text-zinc-900">1. Introduction</h2>
              <p className="mt-4">
                PesaGrid (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you use our platform.
              </p>
            </section>
          </Reveal>

          <Reveal delay={0.15}>
            <section>
              <h2 className="text-xl font-semibold text-zinc-900">2. Information We Collect</h2>
              <div className="mt-4 space-y-6">
                <div>
                  <h3 className="font-bold text-zinc-800">a) Personal Information</h3>
                  <ul className="mt-2 list-inside list-disc space-y-1">
                    <li>Full name</li>
                    <li>Email address</li>
                    <li>Phone number</li>
                    <li>Business details (if applicable)</li>
                    <li>Identification documents (for KYC, if required)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold text-zinc-800">b) Technical Data</h3>
                  <ul className="mt-2 list-inside list-disc space-y-1">
                    <li>IP address</li>
                    <li>Device type</li>
                    <li>Browser type</li>
                    <li>Cookies and usage data</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold text-zinc-800">c) Transaction Data</h3>
                  <ul className="mt-2 list-inside list-disc space-y-1">
                    <li>Payment records</li>
                    <li>Transaction metadata</li>
                    <li>API usage logs</li>
                  </ul>
                </div>
              </div>
            </section>
          </Reveal>

          <Reveal delay={0.2}>
            <section>
              <h2 className="text-xl font-semibold text-zinc-900">3. How We Use Your Information</h2>
              <p className="mt-4">We use your data to:</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Provide and maintain our services</li>
                <li>Process payments and transactions</li>
                <li>Verify identity (KYC / compliance)</li>
                <li>Improve system performance and security</li>
                <li>Communicate with you (updates, support)</li>
                <li>Detect fraud and prevent abuse</li>
              </ul>
            </section>
          </Reveal>

          <Reveal delay={0.25}>
            <section>
              <h2 className="text-xl font-semibold text-zinc-900">4. Legal Basis for Processing</h2>
              <p className="mt-4">We process your data based on:</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Contractual necessity</li>
                <li>Legal obligations (financial regulations)</li>
                <li>Legitimate business interests</li>
                <li>Your consent (where applicable)</li>
              </ul>
            </section>
          </Reveal>

          <Reveal delay={0.3}>
            <section>
              <h2 className="text-xl font-semibold text-zinc-900">5. Data Sharing</h2>
              <p className="mt-4">We may share data with:</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Payment processors and banks</li>
                <li>Regulatory authorities (when required)</li>
                <li>Service providers (hosting, analytics)</li>
              </ul>
              <p className="mt-4 font-semibold text-zinc-900">We do NOT sell your data.</p>
            </section>
          </Reveal>

          <Reveal delay={0.35}>
            <section>
              <h2 className="text-xl font-semibold text-zinc-900">6. Data Retention</h2>
              <p className="mt-4">
                We retain your data only as long as necessary for:
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Legal compliance</li>
                <li>Fraud prevention</li>
                <li>Business operations</li>
              </ul>
            </section>
          </Reveal>

          <Reveal delay={0.4}>
            <section>
              <h2 className="text-xl font-semibold text-zinc-900">7. Data Security</h2>
              <p className="mt-4">We implement:</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Encryption (in transit & at rest)</li>
                <li>Secure authentication systems</li>
                <li>Access control policies</li>
              </ul>
              <p className="mt-4">
                However, no system is 100% secure.
              </p>
            </section>
          </Reveal>

          <Reveal delay={0.45}>
            <section>
              <h2 className="text-xl font-semibold text-zinc-900">8. Your Rights</h2>
              <p className="mt-4">You may:</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Access your data</li>
                <li>Request correction</li>
                <li>Request deletion</li>
                <li>Object to processing</li>
              </ul>
              <p className="mt-4">
                Contact: <a href="mailto:privacy@pesagrid.co.ke" className="text-lime-600 font-semibold hover:underline">privacy@pesagrid.co.ke</a>
              </p>
            </section>
          </Reveal>

          <Reveal delay={0.5}>
            <section>
              <h2 className="text-xl font-semibold text-zinc-900">9. Cookies</h2>
              <p className="mt-4">We use cookies for:</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Authentication</li>
                <li>Analytics</li>
                <li>Performance tracking</li>
              </ul>
            </section>
          </Reveal>

          <Reveal delay={0.55}>
            <section>
              <h2 className="text-xl font-semibold text-zinc-900">10. Changes to This Policy</h2>
              <p className="mt-4">
                We may update this policy. Continued use of the platform after updates constitutes your acceptance of the revised policy.
              </p>
            </section>
          </Reveal>
        </div>
      </main>

      <footer className="border-t border-zinc-200 bg-white py-12">
        <div className="mx-auto max-w-4xl px-6 text-center text-sm text-zinc-500">
          <p>© {new Date().getFullYear()} PesaGrid. All rights reserved.</p>
          <div className="mt-4 flex justify-center gap-6">
            <Link href="/terms" className="hover:text-zinc-900 transition-colors">Terms of Service</Link>
            <Link href="/" className="hover:text-zinc-900 transition-colors">Home</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
