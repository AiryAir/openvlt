import {
  ArrowRight,
  Shield,
  HardDrive,
  RefreshCw,
  FileText,
  Lock,
  Search,
  Smartphone,
  Star,
  Check,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function LandingSeven() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* ── NAV ───────────────────────────────────────────────── */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-8">
          <Link
            href="/7"
            className="font-mono text-lg font-bold tracking-tight"
          >
            openvlt
          </Link>
          <div className="hidden items-center gap-6 sm:flex">
            <a
              href="#features"
              className="text-sm text-stone-400 transition-colors hover:text-white"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="text-sm text-stone-400 transition-colors hover:text-white"
            >
              Pricing
            </a>
            <Link
              href="/4"
              className="text-sm text-stone-400 transition-colors hover:text-white"
            >
              Open Source
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden rounded-lg px-4 py-2 text-sm text-stone-400 transition-colors hover:text-white sm:block"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90"
          >
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 pt-20 pb-12 sm:pt-28 sm:pb-16">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute top-0 left-1/2 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[oklch(0.45_0.1_166/0.15)] blur-[120px]" />

        <div className="relative mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm">
            <Star className="size-3.5 fill-amber-400 text-amber-400" />
            <span className="text-stone-300">
              Now with end-to-end encryption
            </span>
          </div>

          {/* Headline */}
          <h1 className="mx-auto mb-6 max-w-3xl text-4xl leading-[1.1] font-bold tracking-tight sm:text-6xl lg:text-7xl">
            The notes app that
            <br />
            <span className="bg-gradient-to-r from-[oklch(0.75_0.15_166)] to-[oklch(0.7_0.12_200)] bg-clip-text text-transparent">
              respects your privacy
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-stone-400">
            Beautiful markdown editor. Files stored on your server, not ours.
            E2E encrypted locked notes. Works offline. Free to self-host, or let
            us handle the infrastructure.
          </p>

          {/* CTAs */}
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-black transition-all hover:shadow-[0_0_24px_oklch(0.7_0.12_166/0.25)]"
            >
              Start Free Trial
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/4"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-8 py-3.5 text-sm font-medium text-stone-300 transition-all hover:border-white/20 hover:bg-white/5"
            >
              Self-Host for Free
            </Link>
          </div>

          {/* Trust line */}
          <p className="mt-6 text-sm text-stone-600">
            No credit card required &middot; 14-day free trial &middot; Cancel
            anytime
          </p>
        </div>

        {/* ── PRODUCT SCREENSHOT ──────────────────────────────── */}
        <div className="relative mx-auto mt-16 max-w-5xl">
          {/* Glow behind screenshot */}
          <div className="pointer-events-none absolute inset-0 -bottom-20 rounded-3xl bg-gradient-to-b from-[oklch(0.45_0.1_166/0.1)] to-transparent blur-2xl" />

          <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-black/50">
            <Image
              src="/openvlt_demo.webp"
              alt="openvlt — markdown notes app with sidebar, editor, and outline panel"
              width={1920}
              height={1080}
              className="w-full"
              priority
            />
          </div>

          {/* Fade to black at bottom */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
        </div>
      </section>

      {/* ── LOGOS / SOCIAL PROOF ──────────────────────────────── */}
      <section className="border-y border-white/5 py-10">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="mb-6 text-xs tracking-widest text-stone-600 uppercase">
            Trusted by teams and individuals who value privacy
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 font-mono text-sm text-stone-600">
            <span>developers</span>
            <span className="hidden text-stone-800 sm:inline">/</span>
            <span>researchers</span>
            <span className="hidden text-stone-800 sm:inline">/</span>
            <span>journalists</span>
            <span className="hidden text-stone-800 sm:inline">/</span>
            <span>writers</span>
            <span className="hidden text-stone-800 sm:inline">/</span>
            <span>founders</span>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section id="features" className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to think clearly
            </h2>
            <p className="mx-auto max-w-lg text-lg text-stone-400">
              A focused writing experience with powerful features that stay out
              of your way.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: FileText,
                title: "Markdown Native",
                desc: "Write in markdown with a beautiful hybrid editor. See your formatting live while keeping full markdown control.",
              },
              {
                icon: Lock,
                title: "E2E Encrypted Notes",
                desc: "Lock sensitive notes with AES-256-GCM encryption. Zero-knowledge — even we can't read your locked notes.",
              },
              {
                icon: HardDrive,
                title: "Files on Your Server",
                desc: "Notes stored as plain .md files. Browse in Finder, edit in any editor, back up with rsync. No vendor lock-in.",
              },
              {
                icon: Search,
                title: "Instant Search",
                desc: "Full-text search across all your notes powered by SQLite FTS5. Find anything in milliseconds.",
              },
              {
                icon: RefreshCw,
                title: "Offline-First Sync",
                desc: "Works without internet. Changes sync automatically when you're back online with conflict resolution built in.",
              },
              {
                icon: Smartphone,
                title: "Works Everywhere",
                desc: "Progressive Web App that installs on any device. Native-feeling experience on mobile, tablet, and desktop.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition-all hover:border-white/10 hover:bg-white/[0.04]"
              >
                <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-white/5">
                  <f.icon className="size-5 text-stone-400 transition-colors group-hover:text-white" />
                </div>
                <h3 className="mb-2 text-base font-semibold">{f.title}</h3>
                <p className="text-sm leading-relaxed text-stone-500">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────── */}
      <section id="pricing" className="border-t border-white/5 py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mx-auto max-w-lg text-lg text-stone-400">
              Self-host for free, or let us handle the server so you can focus
              on writing.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Free / Self-Hosted */}
            <div className="flex flex-col rounded-2xl border border-white/5 bg-white/[0.02] p-8">
              <div className="mb-6">
                <h3 className="mb-1 text-lg font-semibold">Self-Hosted</h3>
                <p className="text-sm text-stone-500">Run on your own server</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold">$0</span>
                <span className="ml-1 text-stone-500">/forever</span>
              </div>
              <ul className="mb-8 flex-1 space-y-3">
                {[
                  "Unlimited notes & users",
                  "Full source code (MIT)",
                  "Docker one-command deploy",
                  "All features included",
                  "Community support",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm text-stone-400"
                  >
                    <Check className="mt-0.5 size-4 shrink-0 text-stone-600" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="https://github.com/openvlt/openvlt"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-white/10 py-3 text-center text-sm font-medium transition-all hover:border-white/20 hover:bg-white/5"
              >
                View on GitHub
              </Link>
            </div>

            {/* Pro */}
            <div className="relative flex flex-col rounded-2xl border border-[oklch(0.5_0.1_166)] bg-white/[0.03] p-8">
              <div className="absolute -top-3 right-6 rounded-full bg-gradient-to-r from-[oklch(0.65_0.15_166)] to-[oklch(0.6_0.12_200)] px-3 py-1 text-xs font-semibold text-white">
                Most Popular
              </div>
              <div className="mb-6">
                <h3 className="mb-1 text-lg font-semibold">Pro</h3>
                <p className="text-sm text-stone-500">
                  Managed hosting, zero hassle
                </p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold">$8</span>
                <span className="ml-1 text-stone-500">/month</span>
              </div>
              <ul className="mb-8 flex-1 space-y-3">
                {[
                  "Everything in Self-Hosted",
                  "Managed cloud hosting",
                  "Automatic backups",
                  "Custom domain",
                  "Priority email support",
                  "99.9% uptime SLA",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm text-stone-300"
                  >
                    <Check className="mt-0.5 size-4 shrink-0 text-[oklch(0.7_0.15_166)]" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="rounded-xl bg-white py-3 text-center text-sm font-semibold text-black transition-all hover:shadow-[0_0_20px_oklch(0.7_0.12_166/0.2)]"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Team */}
            <div className="flex flex-col rounded-2xl border border-white/5 bg-white/[0.02] p-8">
              <div className="mb-6">
                <h3 className="mb-1 text-lg font-semibold">Team</h3>
                <p className="text-sm text-stone-500">
                  For teams that think together
                </p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold">$6</span>
                <span className="ml-1 text-stone-500">/user/month</span>
              </div>
              <ul className="mb-8 flex-1 space-y-3">
                {[
                  "Everything in Pro",
                  "Shared vaults & workspaces",
                  "Team admin dashboard",
                  "SSO / SAML integration",
                  "Dedicated support",
                  "Volume discounts",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm text-stone-400"
                  >
                    <Check className="mt-0.5 size-4 shrink-0 text-stone-600" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="rounded-xl border border-white/10 py-3 text-center text-sm font-medium transition-all hover:border-white/20 hover:bg-white/5"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────── */}
      <section className="border-t border-white/5 py-24">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <Shield className="mx-auto mb-5 size-10 text-stone-700" />
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to own your notes?
          </h2>
          <p className="mx-auto mb-10 max-w-md text-lg text-stone-400">
            Join thousands of people who switched to a notes app that puts
            privacy first.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-black transition-all hover:shadow-[0_0_24px_oklch(0.7_0.12_166/0.25)]"
            >
              Get Started Free
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/4"
              className="text-sm text-stone-500 underline decoration-stone-800 underline-offset-4 transition-colors hover:text-stone-300 hover:decoration-stone-500"
            >
              Or self-host for free
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 sm:flex-row">
          <div className="flex items-center gap-6">
            <span className="font-mono text-sm font-bold">openvlt</span>
            <span className="text-xs text-stone-700">
              &copy; {new Date().getFullYear()} openvlt. All rights reserved.
            </span>
          </div>
          <div className="flex gap-6 text-xs text-stone-600">
            <Link href="/7" className="transition-colors hover:text-stone-300">
              Privacy
            </Link>
            <Link href="/7" className="transition-colors hover:text-stone-300">
              Terms
            </Link>
            <Link
              href="https://github.com/openvlt/openvlt"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-stone-300"
            >
              GitHub
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
