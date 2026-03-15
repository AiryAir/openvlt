import {
  FileText,
  Lock,
  RefreshCw,
  WifiOff,
  ArrowRight,
  Terminal,
  Shield,
} from "lucide-react"
import Link from "next/link"

export default function LandingOne() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 z-50 flex w-full items-center justify-between border-b border-white/5 px-6 py-4 backdrop-blur-xl">
        <span className="font-mono text-lg font-bold tracking-tight">
          openvlt
        </span>
        <div className="flex items-center gap-6">
          <Link
            href="/2"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Features
          </Link>
          <Link
            href="/3"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Security
          </Link>
          <Link
            href="/4"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Open Source
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute top-1/4 h-[600px] w-[600px] rounded-full bg-[oklch(0.5_0.12_166/0.08)] blur-[120px]" />
        <div className="pointer-events-none absolute right-1/4 bottom-1/4 h-[400px] w-[400px] rounded-full bg-[oklch(0.5_0.12_280/0.06)] blur-[100px]" />

        <div className="relative z-10 max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-1.5 font-mono text-xs tracking-wider text-primary">
            <Terminal className="size-3.5" />
            SELF-HOSTED &middot; ENCRYPTED &middot; OPEN SOURCE
          </div>

          <h1 className="mb-6 text-5xl leading-tight font-bold tracking-tight sm:text-7xl">
            Your notes.
            <br />
            <span className="bg-gradient-to-r from-[oklch(0.7_0.15_166)] to-[oklch(0.65_0.15_230)] bg-clip-text text-transparent">
              Your server.
            </span>
          </h1>

          <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-muted-foreground">
            A beautiful, open-source notes app that stores your thoughts as
            plain markdown files on your own hardware. End-to-end encrypted.
            Works offline. No cloud required.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 font-medium text-primary-foreground transition-all hover:brightness-110"
            >
              Start Writing
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/4"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-8 py-3.5 font-medium transition-all hover:border-white/20 hover:bg-white/5"
            >
              View Source
            </Link>
          </div>
        </div>

        {/* Mock editor window */}
        <div className="relative z-10 mx-auto mt-20 w-full max-w-4xl">
          <div className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-black/40">
            <div className="flex items-center gap-2 border-b border-white/5 bg-white/5 px-4 py-3">
              <div className="size-3 rounded-full bg-white/10" />
              <div className="size-3 rounded-full bg-white/10" />
              <div className="size-3 rounded-full bg-white/10" />
              <span className="ml-3 font-mono text-xs text-muted-foreground">
                meeting-notes.md
              </span>
            </div>
            <div className="bg-card p-8 font-mono text-sm leading-relaxed">
              <p className="mb-4 text-muted-foreground opacity-50"># </p>
              <p className="mb-6 text-2xl font-bold">
                Q1 Planning &mdash; Product Roadmap
              </p>
              <p className="mb-4 text-muted-foreground opacity-50">## </p>
              <p className="mb-3 text-lg font-semibold">Key Decisions</p>
              <p className="mb-1 text-muted-foreground">
                - Ship v2 of the API by end of March
              </p>
              <p className="mb-1 text-muted-foreground">
                - Migrate auth to passkeys (WebAuthn)
              </p>
              <p className="mb-4 text-muted-foreground">
                - Launch self-hosted Docker image
              </p>
              <p className="text-muted-foreground opacity-50">
                &gt; &quot;The best tool is the one you actually own.&quot;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature pills */}
      <section className="border-t border-white/5 py-32">
        <div className="mx-auto grid max-w-5xl gap-6 px-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: FileText,
              label: "Markdown Files",
              desc: "Plain .md files on your disk",
            },
            {
              icon: Lock,
              label: "E2E Encrypted",
              desc: "AES-256-GCM locked notes",
            },
            {
              icon: RefreshCw,
              label: "Hybrid Sync",
              desc: "Online auto-sync, offline queue",
            },
            {
              icon: WifiOff,
              label: "Works Offline",
              desc: "PWA with full offline support",
            },
          ].map((f) => (
            <div
              key={f.label}
              className="group rounded-xl border border-white/5 bg-white/[0.02] p-6 transition-all hover:border-white/10 hover:bg-white/[0.04]"
            >
              <f.icon className="mb-3 size-5 text-primary" />
              <p className="mb-1 text-sm font-semibold">{f.label}</p>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-white/5 py-24 text-center">
        <div className="mx-auto max-w-xl px-6">
          <Shield className="mx-auto mb-4 size-8 text-primary" />
          <h2 className="mb-4 text-3xl font-bold">Own your notes forever</h2>
          <p className="mb-8 text-lg text-muted-foreground">
            No vendor lock-in. No subscription. Your markdown files, your
            server, your rules.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 font-medium text-primary-foreground transition-all hover:brightness-110"
          >
            Get Started Free
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center">
        <p className="font-mono text-xs text-muted-foreground">
          openvlt &mdash; open source, self-hosted notes
        </p>
      </footer>
    </div>
  )
}
