import {
  ArrowRight,
  Quote,
  Sparkles,
  Zap,
  Heart,
  Globe,
  Moon,
  type LucideIcon,
} from "lucide-react"
import Link from "next/link"

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-4xl font-bold text-transparent sm:text-5xl">
        {value}
      </div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  )
}

function Principle({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon
  title: string
  description: string
}) {
  return (
    <div className="flex gap-4">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/5 bg-white/[0.03]">
        <Icon className="size-5 text-primary" />
      </div>
      <div>
        <h3 className="mb-1 text-base font-semibold">{title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  )
}

export default function LandingFive() {
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
            href="/3"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Security
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero — manifesto style */}
      <section className="relative px-6 pt-32 pb-24 text-center">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-[oklch(0.5_0.1_166/0.05)] blur-[150px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-2xl">
          <Sparkles className="mx-auto mb-6 size-8 text-primary" />

          <h1 className="mb-8 text-4xl leading-tight font-bold tracking-tight sm:text-6xl">
            Notes should be
            <br />
            <span className="bg-gradient-to-r from-[oklch(0.7_0.15_166)] via-[oklch(0.65_0.12_230)] to-[oklch(0.7_0.12_280)] bg-clip-text text-transparent">
              simple, private, and yours.
            </span>
          </h1>

          <p className="mx-auto max-w-lg text-lg leading-relaxed text-muted-foreground">
            We built openvlt because we believe note-taking apps got complicated
            for the wrong reasons. Your thoughts deserve better than a
            subscription service that holds your data hostage.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-white/5 py-16">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-12 px-6 sm:gap-20">
          <Stat value="0" label="Monthly cost" />
          <Stat value=".md" label="File format" />
          <Stat value="E2E" label="Encryption" />
          <Stat value="MIT" label="License" />
        </div>
      </section>

      {/* Principles */}
      <section className="py-24">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="mb-12 text-center text-2xl font-bold">
            What we believe
          </h2>

          <div className="grid gap-8 sm:grid-cols-2">
            <Principle
              icon={Heart}
              title="Simplicity over features"
              description="Every feature must earn its place. We'd rather do fewer things well than overwhelm you with options you'll never use."
            />
            <Principle
              icon={Globe}
              title="Open over proprietary"
              description="Your notes in plain markdown. Our code on GitHub. No lock-in, no walled gardens, no artificial barriers."
            />
            <Principle
              icon={Zap}
              title="Speed over spectacle"
              description="A note app should open instantly and get out of your way. Performance is a feature we will never compromise on."
            />
            <Principle
              icon={Moon}
              title="Privacy by default"
              description="Self-hosted. E2E encrypted. No telemetry. We don't want your data — we want to help you protect it."
            />
          </div>
        </div>
      </section>

      {/* Testimonial-style quotes */}
      <section className="border-t border-white/5 py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid gap-6 sm:grid-cols-2">
            {[
              {
                quote:
                  "Finally, a notes app that treats my files as files. I can grep my notes. I can version them with git. They're just markdown.",
                author: "The Developer",
              },
              {
                quote:
                  "I switched from Notion because I wanted to own my data. openvlt gives me a beautiful editor without the vendor lock-in.",
                author: "The Privacy Advocate",
              },
              {
                quote:
                  "The offline support is incredible. I write on the plane, and everything syncs when I land. No more lost notes.",
                author: "The Traveler",
              },
              {
                quote:
                  "I self-host everything. openvlt was the easiest Docker deployment I've done. One command, one volume, done.",
                author: "The Self-Hoster",
              },
            ].map((t) => (
              <div
                key={t.author}
                className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition-all hover:border-white/10"
              >
                <Quote className="mb-3 size-5 text-primary/30" />
                <p className="mb-4 text-sm leading-relaxed">{t.quote}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  &mdash; {t.author}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-white/5 py-24 text-center">
        <div className="mx-auto max-w-lg px-6">
          <h2 className="mb-4 text-3xl font-bold">Start writing today</h2>
          <p className="mb-8 text-lg text-muted-foreground">
            Free. Open source. Self-hosted. No credit card. No catch.
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 font-medium text-primary-foreground transition-all hover:brightness-110"
            >
              Create Your Vault
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/1"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Learn more
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <p className="mt-12 font-mono text-xs text-muted-foreground">
            docker run -p 3000:3000 openvlt/openvlt
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-6 px-6">
          <Link
            href="/1"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Home
          </Link>
          <Link
            href="/2"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Features
          </Link>
          <Link
            href="/3"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Security
          </Link>
          <Link
            href="/4"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Open Source
          </Link>
          <span className="font-mono text-xs text-muted-foreground">
            &copy; openvlt
          </span>
        </div>
      </footer>
    </div>
  )
}
