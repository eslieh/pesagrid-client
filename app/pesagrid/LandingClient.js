"use client";

import Image from "next/image";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useState } from "react";
import Reveal from "./Reveal";
import { formatKES } from "./format";

function Pill({ children }) {
  return (
    <div className="inline-flex w-fit items-center gap-2 rounded-full border border-zinc-900/10 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 shadow-sm">
      <span className="h-2 w-2 rounded-full bg-lime-500" />
      {children}
    </div>
  );
}

function Card({ className = "", children }) {
  return (
    <div
      className={[
        "rounded-3xl border border-zinc-900/10 bg-white shadow-[0_1px_0_0_rgba(24,24,27,0.04),0_20px_60px_-40px_rgba(24,24,27,0.55)]",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function SoftPanel({ className = "", children }) {
  return (
    <div
      className={[
        "rounded-2xl border border-zinc-900/10 bg-zinc-50",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function ElasticBubbleSlider({ size = "md", className = "" }) {
  const [active, setActive] = useState("get-started");

  const wrapHeight = size === "sm" ? "h-10" : "h-12";
  const textSize = size === "sm" ? "text-sm" : "text-sm";
  const wrapPadding = size === "sm" ? "p-1" : "p-1.5";

  const options = [
    { id: "get-started", label: "Get Started Today", href: "#request-demo" },
    { id: "watch-demo", label: "Watch the Demo", href: "#demo" },
  ];

  return (
    <div
      className={[
        "inline-grid grid-cols-2 items-center rounded-full border border-white/70 bg-white/50 shadow-[0_10px_30px_-18px_rgba(24,24,27,0.45),inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-xl",
        wrapHeight,
        wrapPadding,
        className,
      ].join(" ")}
    >
      {options.map((opt) => {
        const isActive = active === opt.id;
        return (
          <a
            key={opt.id}
            href={opt.href}
            onClick={() => setActive(opt.id)}
            className={[
              "relative z-10 inline-flex h-full min-w-[140px] items-center justify-center rounded-full px-4 font-semibold transition-colors",
              textSize,
              isActive ? "text-zinc-900" : "text-zinc-600 hover:text-zinc-900",
            ].join(" ")}
          >
            {isActive ? (
              <motion.span
                layoutId={`cta-bubble-${size}`}
                className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-lime-300 via-lime-200 to-emerald-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_8px_22px_-12px_rgba(132,204,22,0.75)]"
                transition={{
                  type: "spring",
                  stiffness: 420,
                  damping: 24,
                  mass: 0.75,
                }}
              />
            ) : null}
            {opt.label}
          </a>
        );
      })}
    </div>
  );
}

const navLinks = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#value", label: "Value" },
  { href: "#use-cases", label: "Use cases" },
  { href: "#psps", label: "Supported PSPs" },
];

export default function LandingClient() {
  const year = new Date().getFullYear();
  const { scrollY } = useScroll();
  const [isCompactNav, setIsCompactNav] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsCompactNav(latest > 72);
  });

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 text-zinc-900">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-28 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-lime-300/25 blur-3xl" />
        <div className="absolute -left-24 top-48 h-[22rem] w-[22rem] rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="absolute -right-24 top-72 h-[22rem] w-[22rem] rounded-full bg-zinc-200/70 blur-3xl" />
      </div>

      <header className="sticky top-4 z-20">
        <div className="mx-auto flex w-full max-w-6xl justify-center px-6">
          <motion.nav
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="hidden items-center rounded-full border border-white/65 bg-[linear-gradient(120deg,rgba(255,255,255,0.62),rgba(255,255,255,0.28))] p-1.5 shadow-[0_12px_45px_-22px_rgba(24,24,27,0.52),inset_0_1px_0_rgba(255,255,255,0.6)] backdrop-blur-2xl md:flex"
          >
            <motion.a
              href="#"
              animate={{
                width: isCompactNav ? 0 : "auto",
                opacity: isCompactNav ? 0 : 1,
                marginRight: isCompactNav ? 0 : 10,
              }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-2 overflow-hidden whitespace-nowrap rounded-full px-2 py-1"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-lime-300 via-lime-400 to-emerald-400 text-sm font-black text-zinc-900 shadow-[inset_0_1px_1px_rgba(255,255,255,0.5),0_6px_14px_-8px_rgba(34,197,94,0.9)]">
                P
              </span>
              <span className="pr-2 text-sm font-semibold tracking-tight text-zinc-800">
                Pesagrid
              </span>
            </motion.a>

            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="rounded-full border border-transparent px-4 py-2 text-sm font-medium text-zinc-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/75 hover:bg-white/70 hover:text-zinc-900"
              >
                {l.label}
              </a>
            ))}
            <ElasticBubbleSlider size="sm" />
          </motion.nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6">
        {/* Hero */}
        <section className="grid items-center gap-10 py-14 md:grid-cols-2 md:py-20">
          <div className="flex flex-col gap-6">
            <Reveal>
              <Pill>Built for modern Kenyan businesses</Pill>
            </Reveal>

            <Reveal delay={0.05}>
              <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight text-zinc-900 sm:text-5xl">
                Stop Chasing Payments. Start Scaling Your Business.
              </h1>
            </Reveal>

            <Reveal delay={0.1}>
              <p className="max-w-xl text-base leading-7 text-zinc-600 sm:text-lg">
                Automate reconciliation across M-PESA, bank transfers, and more.
                Eliminate manual errors and get real-time oversight of
                collections, outstanding balances, and cash flow.
              </p>
            </Reveal>

            <Reveal delay={0.12}>
              <ElasticBubbleSlider />
            </Reveal>

            <div className="grid gap-3 pt-2 sm:grid-cols-3">
              {[
                {
                  label: "Reconciliation",
                  value: "100%",
                  note: "Accurate matching",
                },
                {
                  label: "Manual work",
                  value: "↓ 90%",
                  note: "Less spreadsheet time",
                },
                {
                  label: "Cash flow",
                  value: "Faster",
                  note: "Lower DSO",
                },
              ].map((s, idx) => (
                <Reveal key={s.label} delay={0.05 + idx * 0.04}>
                  <Card className="p-4">
                    <div className="text-xs font-semibold text-zinc-500">
                      {s.label}
                    </div>
                    <div className="mt-1 text-xl font-semibold tracking-tight text-zinc-900">
                      {s.value}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">{s.note}</div>
                  </Card>
                </Reveal>
              ))}
            </div>
          </div>

          {/* Dashboard visual + image placeholder */}
          <div className="hidden md:block">
            <Reveal delay={0.08} y={18}>
              <div className="relative rounded-[2rem] border border-zinc-900/10 bg-white p-6 shadow-[0_1px_0_0_rgba(24,24,27,0.04),0_24px_70px_-34px_rgba(24,24,27,0.5)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-zinc-900" />
                    <div>
                      <div className="text-sm font-semibold tracking-tight">
                        Collections overview
                      </div>
                      <div className="text-xs text-zinc-500">
                        Real-time reconciliation dashboard
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-28 rounded-full bg-zinc-100" />
                    <div className="h-9 w-9 rounded-full bg-zinc-100" />
                  </div>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-3">
                  <SoftPanel className="p-4 lg:col-span-2">
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-xs font-semibold text-zinc-500">
                          Collected (KES)
                        </div>
                        <div className="mt-1 text-2xl font-semibold tracking-tight">
                          {formatKES(1845000)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
                        <span className="inline-flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-lime-500" />
                          Matched
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-zinc-300" />
                          Unmatched
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-7 items-end gap-2">
                      {[20, 28, 40, 62, 46, 54, 34].map((h, idx) => (
                        <div
                          key={idx}
                          className="rounded-xl bg-white p-2 shadow-[0_10px_30px_-22px_rgba(24,24,27,0.5)]"
                        >
                          <div
                            className="w-full rounded-lg bg-zinc-200"
                            style={{ height: `${h}px` }}
                          />
                          <div
                            className="mt-2 w-full rounded-lg bg-lime-400/80"
                            style={{ height: `${Math.max(10, h * 0.55)}px` }}
                          />
                        </div>
                      ))}
                    </div>
                  </SoftPanel>

                  <div className="rounded-2xl border border-zinc-900/10 bg-white p-4">
                    <div className="text-xs font-semibold text-zinc-500">
                      Notifications
                    </div>
                    <div className="mt-3 grid gap-3">
                      {[
                        { title: "Overdue reminders", meta: "SMS · WhatsApp" },
                        { title: "Partial payments", meta: "Auto follow-up" },
                        { title: "Receipts", meta: "Instant delivery" },
                      ].map((item) => (
                        <motion.div
                          key={item.title}
                          className="rounded-xl border border-zinc-900/10 bg-zinc-50 p-3"
                          whileHover={{ y: -2 }}
                          transition={{
                            duration: 0.2,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                        >
                          <div className="text-sm font-semibold tracking-tight">
                            {item.title}
                          </div>
                          <div className="text-xs text-zinc-500">{item.meta}</div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  {[
                    { label: "Total collected", value: formatKES(3520000) },
                    { label: "Outstanding", value: formatKES(910000) },
                    { label: "Saved time", value: "18 hrs/week" },
                  ].map((kpi) => (
                    <div
                      key={kpi.label}
                      className="rounded-2xl border border-zinc-900/10 bg-white p-4"
                    >
                      <div className="text-xs font-semibold text-zinc-500">
                        {kpi.label}
                      </div>
                      <div className="mt-1 text-lg font-semibold tracking-tight">
                        {kpi.value}
                      </div>
                      <div className="mt-2 h-2 w-full rounded-full bg-zinc-100">
                        <div className="h-2 w-2/3 rounded-full bg-lime-400" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Placeholder image slot (you'll replace src) */}
                <div className="mt-5 overflow-hidden rounded-2xl border border-zinc-900/10 bg-zinc-50">
                  <div className="flex items-center justify-between border-b border-zinc-900/10 px-4 py-3">
                    <div className="text-xs font-semibold text-zinc-600">
                      Replace with your dashboard screenshot
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      `public/images/hero-dashboard.png`
                    </div>
                  </div>
                  <div className="relative aspect-[16/9] w-full">
                    <Image
                      src="/images/hero-dashboard.png"
                      alt="Pesagrid dashboard preview"
                      fill
                      sizes="(min-width: 768px) 520px, 100vw"
                      className="object-cover"
                      priority
                    />
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Advantage */}
        <section id="advantage" className="border-t border-zinc-200/70 py-10 md:py-14">
          <Reveal>
            <div className="flex flex-col gap-3">
              <h2 className="text-2xl font-semibold tracking-tight">
                Why Choose Pesagrid?
              </h2>
              <p className="max-w-3xl text-zinc-600">
                The business advantage for Kenya: fewer manual tasks, cleaner
                books, faster collections—and a single view across branches and
                payment channels.
              </p>
            </div>
          </Reveal>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {[
              {
                title: "100% Reconciliation Accuracy",
                desc: "Intelligent matching ensures every shilling is accounted for—automatically linking incoming payments to invoices, subscriptions, or fees.",
              },
              {
                title: "Hands-Free Notifications",
                desc: "Automated SMS, WhatsApp, and Email reminders for overdue or partial payments to keep collections moving.",
              },
              {
                title: "Real-Time Financial Intelligence",
                desc: "A unified dashboard for collections, outstanding balances, and growth trends—branch by branch.",
              },
              {
                title: "Multi-tenant Scalability",
                desc: "From one branch to a thousand, Pesagrid scales with your organizational structure effortlessly.",
              },
            ].map((f, idx) => (
              <Reveal key={f.title} delay={0.04 * idx}>
                <Card className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 h-10 w-10 shrink-0 rounded-2xl bg-lime-400/20 ring-1 ring-lime-500/20">
                      <div className="grid h-full w-full place-items-center text-sm font-semibold text-lime-700">
                        ✓
                      </div>
                    </div>
                    <div>
                      <div className="text-base font-semibold tracking-tight">
                        {f.title}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-zinc-600">
                        {f.desc}
                      </p>
                    </div>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Value */}
        <section id="value" className="py-10 md:py-14">
          <Reveal>
            <div className="rounded-[2.25rem] border border-zinc-900/10 bg-white p-8 shadow-[0_1px_0_0_rgba(24,24,27,0.04),0_24px_70px_-42px_rgba(24,24,27,0.6)] md:p-10">
              <div className="grid gap-8 md:grid-cols-2 md:items-center">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">
                    What value does Pesagrid bring to your business?
                  </h2>
                  <p className="mt-3 text-zinc-600">
                    You’ll reconcile faster, collect sooner, and reduce leakage
                    from missed or misapplied payments. The result is healthier
                    cash flow and better decision-making.
                  </p>
                </div>

                <div className="grid gap-3">
                  {[
                    {
                      title: "Reduce operational overhead",
                      desc: "Cut reconciliation work by up to 90%—less manual data entry, fewer errors.",
                    },
                    {
                      title: "Faster cash flow",
                      desc: "Automated reminders and clearer statements reduce Days Sales Outstanding (DSO).",
                    },
                    {
                      title: "Lower revenue leakage",
                      desc: "Match every payment to an obligation and close gaps before month-end.",
                    },
                  ].map((b) => (
                    <SoftPanel key={b.title} className="p-4">
                      <div className="text-sm font-semibold tracking-tight">
                        {b.title}
                      </div>
                      <div className="mt-1 text-sm leading-6 text-zinc-600">
                        {b.desc}
                      </div>
                    </SoftPanel>
                  ))}
                </div>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {[
                  {
                    label: "Example monthly collections",
                    value: formatKES(12000000),
                    note: "Across branches",
                  },
                  {
                    label: "Estimated time saved",
                    value: "60+ hrs",
                    note: "Per finance team/month",
                  },
                  {
                    label: "Faster follow-ups",
                    value: "Minutes",
                    note: "Not days",
                  },
                ].map((k) => (
                  <div
                    key={k.label}
                    className="rounded-2xl border border-zinc-900/10 bg-white p-4"
                  >
                    <div className="text-xs font-semibold text-zinc-500">
                      {k.label}
                    </div>
                    <div className="mt-1 text-lg font-semibold tracking-tight">
                      {k.value}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">{k.note}</div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </section>

        {/* Use cases */}
        <section
          id="use-cases"
          className="border-t border-zinc-200/70 py-10 md:py-14"
        >
          <Reveal>
            <div className="flex flex-col gap-3">
              <h2 className="text-2xl font-semibold tracking-tight">
                Use cases in Kenya
              </h2>
              <p className="max-w-3xl text-zinc-600">
                Pesagrid fits any business collecting high-volume payments that
                must be reconciled accurately—especially where M-PESA and bank
                payments mix.
              </p>
            </div>
          </Reveal>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Schools & institutions",
                desc: "Match fees to students, automate reminders, and issue receipts instantly.",
                img: "https://images.pexels.com/photos/34162709/pexels-photo-34162709.jpeg",
              },
              {
                title: "SACCOs & microfinance",
                desc: "Reconcile loan repayments, dues, and deposits with full audit trails.",
                img: "https://images.pexels.com/photos/3184396/pexels-photo-3184396.jpeg",
              },
              {
                title: "Real estate & rent",
                desc: "Link rent payments to units/tenants and follow up on arrears automatically.",
                img: "https://images.pexels.com/photos/7578975/pexels-photo-7578975.jpeg",
              },
              {
                title: "E-commerce & delivery",
                desc: "Reconcile COD and M-PESA payments to orders and routes.",
                img: "https://images.pexels.com/photos/4440841/pexels-photo-4440841.jpeg",
              },
              {
                title: "Healthcare",
                desc: "Match patient payments to invoices and reduce front-desk reconciliation time.",
                img: "https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg",
              },
              {
                title: "Utilities & subscriptions",
                desc: "Recurring billing, partial payment handling, and automated reminders.",
                img: "https://images.pexels.com/photos/236089/pexels-photo-236089.jpeg",
              },
            ].map((u, idx) => (
              <Reveal key={u.title} delay={0.03 * idx}>
                <Card className="overflow-hidden">
                  <div className="relative aspect-[16/10] w-full bg-zinc-100">
                    <Image
                      src={u.img}
                      alt={`${u.title} placeholder image`}
                      fill
                      sizes="(min-width: 768px) 320px, 100vw"
                      className="object-cover"
                    />
                    {/* <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-white/40 bg-white/70 px-3 py-2 text-[11px] font-semibold text-zinc-700 backdrop-blur">
                      Replace image: <span className="font-mono">{u.img}</span>
                    </div> */}
                  </div>
                  <div className="p-6">
                    <div className="text-base font-semibold tracking-tight">
                      {u.title}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-zinc-600">
                      {u.desc}
                    </p>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Supported PSPs */}
        <section id="psps" className="py-10 md:py-14">
          <Reveal>
            <div className="grid gap-8 md:grid-cols-2 md:items-center">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  Supported payment service providers
                </h2>
                <p className="mt-3 text-zinc-600">
                  Connect the channels your customers already use. Ingest
                  statements, match payments, and keep a clean audit trail.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { name: "M-PESA", note: "Paybill / Till / Statements" },
                  { name: "KCB Bank", note: "Transfers / Collections" },
                  { name: "Airtel Money", note: "Collections (optional)" },
                  { name: "Cards", note: "Gateway integrations (optional)" },
                ].map((p, idx) => (
                  <Reveal key={p.name} delay={0.04 * idx}>
                    <SoftPanel className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold tracking-tight">
                          {p.name}
                        </div>
                        <span className="inline-flex items-center rounded-full bg-lime-400/20 px-3 py-1 text-[11px] font-semibold text-lime-800 ring-1 ring-lime-500/20">
                          supported
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-zinc-600">{p.note}</div>
                    </SoftPanel>
                  </Reveal>
                ))}
              </div>
            </div>
          </Reveal>
        </section>

        {/* How it works */}
        <section
          id="how-it-works"
          className="border-t border-zinc-200/70 py-10 md:py-14"
        >
          <Reveal>
            <div className="flex flex-col gap-3">
              <h2 className="text-2xl font-semibold tracking-tight">
                How it works (simple flow)
              </h2>
              <p className="max-w-3xl text-zinc-600">
                Turn scattered payments into accurate, real-time reconciliation
                with an automated pipeline.
              </p>
            </div>
          </Reveal>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {[
              {
                step: "Ingest",
                desc: "Connect M-PESA and bank sources (e.g., KCB). Import statements or integrate directly.",
              },
              {
                step: "Match",
                desc: "Automatically reconcile payments against invoices, subscriptions, fees, or policies.",
              },
              {
                step: "Notify",
                desc: "Automated SMS/WhatsApp/Email reminders for overdue and partial payments.",
              },
              {
                step: "Analyze",
                desc: "Track collections, arrears, and trends in a unified dashboard—branch by branch.",
              },
            ].map((s, idx) => (
              <Reveal key={s.step} delay={0.04 * idx}>
                <Card className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-2xl bg-lime-400/20 text-sm font-semibold text-lime-800 ring-1 ring-lime-500/20">
                      {idx + 1}
                    </div>
                    <div className="text-base font-semibold tracking-tight">
                      {s.step}
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-zinc-600">{s.desc}</p>
                </Card>
              </Reveal>
            ))}
          </div>

          {/* Optional “how it looks” image placeholder */}
          <Reveal delay={0.06}>
            <div className="mt-8 overflow-hidden rounded-[2rem] border border-zinc-900/10 bg-white shadow-[0_1px_0_0_rgba(24,24,27,0.04),0_24px_70px_-42px_rgba(24,24,27,0.6)]">
              <div className="flex items-center justify-between border-b border-zinc-900/10 px-6 py-4">
                <div className="text-sm font-semibold tracking-tight">
                  Add a “How it works” illustration/video still
                </div>
                <div className="text-xs text-zinc-500">
                  `public/images/how-it-works.png`
                </div>
              </div>
              <div className="relative aspect-[21/9] w-full bg-zinc-100">
                <Image
                  src="/images/how-it-works.png"
                  alt="How Pesagrid works placeholder image"
                  fill
                  sizes="(min-width: 768px) 1100px, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
          </Reveal>
        </section>

        {/* CTA */}
        <section id="demo" className="py-10 md:py-14">
          <Reveal>
            <div className="rounded-[2.25rem] border border-zinc-900/10 bg-zinc-900 p-8 text-white shadow-[0_24px_70px_-42px_rgba(24,24,27,0.7)] md:p-10">
              <div className="grid gap-8 md:grid-cols-2 md:items-center">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">
                    Ready to transform your collections and reconciliation?
                  </h2>
                  <p className="mt-3 text-white/80">
                    Join teams across Kenya using Pesagrid to reduce manual work,
                    improve accuracy, and accelerate cash flow.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <a
                    id="request-demo"
                    href="#"
                    className="inline-flex h-12 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-zinc-900 shadow-sm transition-colors hover:bg-zinc-100"
                  >
                    Request a Custom Demo
                  </a>
                  <a
                    href="#use-cases"
                    className="inline-flex h-12 items-center justify-center rounded-full border border-white/20 bg-white/5 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                  >
                    See use cases
                  </a>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        <footer className="pb-10 pt-6 text-sm text-zinc-500">
          <div className="flex flex-col gap-3 border-t border-zinc-200/70 pt-6 md:flex-row md:items-center md:justify-between">
            <div>© {year} Pesagrid. All rights reserved.</div>
            <div className="flex items-center gap-4">
              {navLinks.slice(0, 3).map((l) => (
                <a key={l.href} className="hover:text-zinc-700" href={l.href}>
                  {l.label}
                </a>
              ))}
              <a className="hover:text-zinc-700" href="#demo">
                Demo
              </a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

