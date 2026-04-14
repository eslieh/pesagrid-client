import LandingClient from "../pesagrid/components/LandingClient";
import Reveal from "../pesagrid/Reveal";
import { formatKES } from "../pesagrid/format";
import Link from "next/link";

export const metadata = {
  title: "Simple, Transparent Pricing | PesaGrid",
  description: "Pricing plans for businesses of all sizes - Starter, Growth, and Enterprise. Automated reconciliation starting at KES 3,000/mo.",
};

function PricingCard({ tier, price, sms, features, isFeatured = false, walletMin }) {
  return (
    <div
      className={`relative flex flex-col rounded-3xl border ${
        isFeatured
          ? "border-lime-500/20 bg-white shadow-[0_24px_70px_-34px_rgba(24,24,27,0.45)] ring-1 ring-lime-500/10"
          : "border-zinc-900/10 bg-white shadow-sm"
      } p-8`}
    >
      {isFeatured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-lime-500 px-3 py-1 text-[11px] font-bold text-white shadow-sm">
          MOST POPULAR
        </div>
      )}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-zinc-900">{tier}</h3>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-3xl font-bold tracking-tight text-zinc-900">
            {typeof price === "number" ? formatKES(price) : price}
          </span>
          {typeof price === "number" && (
            <span className="text-sm font-medium text-zinc-500">/mo</span>
          )}
        </div>
        <p className="mt-4 text-sm text-zinc-600">
          {sms} per SMS notification
        </p>
      </div>

      <div className="mb-8 flex-1">
        <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          What&apos;s included
        </div>
        <ul className="space-y-3">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-sm text-zinc-600">
              <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-lime-100 text-[10px] font-bold text-lime-700">
                ✓
              </span>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto flex flex-col gap-4">
        <div className="rounded-2xl bg-zinc-50 p-4 ring-1 ring-zinc-900/5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Wallet Minimum
          </div>
          <div className="mt-1 text-sm font-semibold text-zinc-900">
            {walletMin}
          </div>
          <p className="mt-1 text-[10px] leading-relaxed text-zinc-400">
            Mandatory wallet balance for automated fee deductions.
          </p>
        </div>
        <Link
          href="/auth/register"
          className={`flex h-11 items-center justify-center rounded-full px-6 text-sm font-semibold transition-all hover:-translate-y-0.5 ${
            isFeatured
              ? "bg-lime-500 text-white shadow-sm hover:bg-lime-600"
              : "border border-zinc-900/10 bg-white text-zinc-900 hover:bg-zinc-50"
          }`}
        >
          {tier === "Enterprise" ? "Contact Sales" : "Get Started"}
        </Link>
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 selection:bg-lime-200">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-28 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-lime-300/25 blur-3xl" />
        <div className="absolute -left-24 top-48 h-[22rem] w-[22rem] rounded-full bg-emerald-200/30 blur-3xl" />
      </div>

      <header className="sticky top-0 z-20 border-b border-white/40 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <Link href="/" className="text-xl font-bold tracking-tight text-zinc-800">
            PesaGrid
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
              Home
            </Link>
            <Link
              href="/auth/login"
              className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-zinc-800"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-20 lg:py-28 text-center">
        <Reveal>
          <div className="mx-auto max-w-2xl">
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
              Pay for growth, not for complexity.
            </h1>
            <p className="mt-6 text-lg leading-8 text-zinc-600">
              Simple, transparent pricing built to scale with your transaction volume. 
              No hidden fees, just pure automated reconciliation.
            </p>
          </div>
        </Reveal>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          <Reveal delay={0.1}>
            <PricingCard
              tier="Starter"
              price={3000}
              sms="KES 0.50"
              walletMin="KES 5,000"
              features={[
                "1 branch setup",
                "Up to 2 connected PSPs",
                "Automated M-PESA import",
                "Weekly reporting emails",
                "Standard reconciliation engine",
              ]}
            />
          </Reveal>

          <Reveal delay={0.2}>
            <PricingCard
              tier="Growth"
              price={12000}
              sms="KES 0.50"
              walletMin="KES 15,000"
              isFeatured={true}
              features={[
                "Up to 20 branches/points",
                "Unlimited connected PSPs",
                "Real-time reconciliation",
                "Detailed ledger access",
                "Multi-channel reminders",
                "Priority support",
              ]}
            />
          </Reveal>

          <Reveal delay={0.3}>
            <PricingCard
              tier="Enterprise"
              price="Custom"
              sms="KES 0.50"
              walletMin="Tailored requirement"
              features={[
                "Unlimited branches & points",
                "Custom API integrations",
                "Dedicated account manager",
                "Advanced audit trails",
                "Custom SLA & Priority Support",
                "On-prem deployment (optional)",
              ]}
            />
          </Reveal>
        </div>

        <Reveal delay={0.4}>
          <div className="mt-24 rounded-[2.5rem] border border-zinc-900/10 bg-white p-8 shadow-sm md:p-12">
            <div className="mx-auto max-w-3xl">
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
                Understanding the Wallet & Deductions
              </h2>
              <p className="mt-4 text-zinc-600">
                To ensure zero interruptions in your reconciliation pipeline, PesaGrid operates on a
                <strong> Wallet model</strong>. Your monthly subscription and per-transaction fees are 
                automatically deducted from your balance.
              </p>
              
              <div className="mt-10 grid gap-6 md:grid-cols-2 text-left">
                <div className="rounded-2xl bg-zinc-50 p-6 ring-1 ring-zinc-900/5">
                  <div className="text-sm font-bold text-zinc-900">Auto-Deduction</div>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                    Subscriptions are deducted on the 1st of every month. Transaction fees are applied 
                    only upon successful reconciliation.
                  </p>
                </div>
                <div className="rounded-2xl bg-zinc-50 p-6 ring-1 ring-zinc-900/5">
                  <div className="text-sm font-bold text-zinc-900">SMS Billing</div>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                    SMS charges (KES 0.50) are deducted instantly for every notification sent to your clients. 
                    Monitor usage in real-time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        <footer className="mt-32 border-t border-zinc-200 pt-10 text-sm text-zinc-500">
          © {new Date().getFullYear()} PesaGrid. All rights reserved.
        </footer>
      </main>
    </div>
  );
}
