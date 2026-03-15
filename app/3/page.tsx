import {
  Shield,
  Lock,
  Server,
  EyeOff,
  Key,
  Fingerprint,
  ArrowRight,
  Check,
} from "lucide-react"
import Link from "next/link"

export default function LandingThree() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 z-50 flex w-full items-center justify-between border-b border-white/5 px-6 py-4 backdrop-blur-xl">
        <Link href="/1" className="font-mono text-lg font-bold tracking-tight">
          openvlt
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/2"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Features
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
      <section className="relative px-6 pt-32 pb-20 text-center">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-1/3 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[oklch(0.5_0.12_280/0.06)] blur-[120px]" />
        </div>

        <div className="relative z-10">
          <div className="mx-auto mb-8 flex size-20 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
            <Shield className="size-10 text-[oklch(0.7_0.12_280)]" />
          </div>

          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl">
            Security isn&apos;t a feature.
            <br />
            <span className="bg-gradient-to-r from-[oklch(0.7_0.12_280)] to-[oklch(0.7_0.15_230)] bg-clip-text text-transparent">
              It&apos;s the foundation.
            </span>
          </h1>

          <p className="mx-auto max-w-xl text-lg leading-relaxed text-muted-foreground">
            Your notes contain your most private thoughts. openvlt is built from
            the ground up so that only you can read them.
          </p>
        </div>
      </section>

      {/* Security pillars */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-2">
          {/* E2E Encryption */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8">
            <Lock className="mb-4 size-6 text-[oklch(0.7_0.12_280)]" />
            <h3 className="mb-2 text-xl font-bold">End-to-End Encryption</h3>
            <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
              Locked notes are encrypted with AES-256-GCM before they ever touch
              disk. Your encryption key is derived from your password using
              PBKDF2 with 100,000 iterations. The server never sees your
              plaintext.
            </p>
            <div className="overflow-hidden rounded-lg border border-white/5 bg-black/20 p-4 font-mono text-xs">
              <p className="text-muted-foreground">
                <span className="text-[oklch(0.7_0.12_280)]">algorithm</span>:
                AES-256-GCM
              </p>
              <p className="text-muted-foreground">
                <span className="text-[oklch(0.7_0.12_280)]">kdf</span>:
                PBKDF2-SHA256
              </p>
              <p className="text-muted-foreground">
                <span className="text-[oklch(0.7_0.12_280)]">iterations</span>:
                100,000
              </p>
              <p className="text-muted-foreground">
                <span className="text-[oklch(0.7_0.12_280)]">key_length</span>:
                256 bits
              </p>
            </div>
          </div>

          {/* Self-hosted */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8">
            <Server className="mb-4 size-6 text-[oklch(0.7_0.15_166)]" />
            <h3 className="mb-2 text-xl font-bold">Your Server, Your Data</h3>
            <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
              openvlt runs on your own hardware. Your notes never leave your
              network unless you want them to. No third-party cloud. No data
              harvesting. No terms of service changes.
            </p>
            <div className="space-y-2">
              {[
                "Data stays on your hardware",
                "No telemetry or analytics",
                "No third-party dependencies",
                "Full audit trail in git",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm">
                  <Check className="size-4 shrink-0 text-[oklch(0.7_0.15_145)]" />
                  <span className="text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Zero knowledge */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8">
            <EyeOff className="mb-4 size-6 text-[oklch(0.7_0.15_55)]" />
            <h3 className="mb-2 text-xl font-bold">Zero Knowledge</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Even if someone gains access to your server, locked notes remain
              encrypted. The encryption key exists only in your browser session
              and is never stored on disk or transmitted to the server.
            </p>
          </div>

          {/* Auth options */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8">
            <Fingerprint className="mb-4 size-6 text-[oklch(0.65_0.15_230)]" />
            <h3 className="mb-2 text-xl font-bold">Modern Authentication</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Passwords hashed with bcrypt. Optional WebAuthn for biometric
              login (Touch ID, Face ID, Windows Hello). 24-word recovery key
              generated at signup. httpOnly session cookies with signed tokens.
            </p>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="border-t border-white/5 py-24">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="mb-12 text-center text-3xl font-bold">
            How openvlt compares
          </h2>
          <div className="overflow-hidden rounded-2xl border border-white/5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.03]">
                  <th className="px-6 py-4 text-left font-medium"></th>
                  <th className="px-6 py-4 text-center font-semibold text-primary">
                    openvlt
                  </th>
                  <th className="px-6 py-4 text-center font-medium text-muted-foreground">
                    Cloud Apps
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Data location", "Your server", "Their servers"],
                  ["Encryption", "E2E (AES-256)", "At rest only"],
                  ["File format", "Plain markdown", "Proprietary"],
                  ["Offline access", "Full PWA", "Limited"],
                  ["Source code", "Open source", "Closed"],
                  ["Price", "Free forever", "$5-15/mo"],
                ].map(([label, good, bad]) => (
                  <tr
                    key={label}
                    className="border-b border-white/5 last:border-0"
                  >
                    <td className="px-6 py-3.5 text-muted-foreground">
                      {label}
                    </td>
                    <td className="px-6 py-3.5 text-center font-medium">
                      {good}
                    </td>
                    <td className="px-6 py-3.5 text-center text-muted-foreground">
                      {bad}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/5 py-24 text-center">
        <div className="mx-auto max-w-md px-6">
          <Key className="mx-auto mb-4 size-8 text-primary" />
          <h2 className="mb-4 text-2xl font-bold">Take back your privacy</h2>
          <p className="mb-8 text-muted-foreground">
            Deploy openvlt on your own server in under a minute.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 font-medium text-primary-foreground transition-all hover:brightness-110"
          >
            Get Started
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
