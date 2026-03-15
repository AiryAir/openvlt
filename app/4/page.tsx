import {
  Github,
  FileCode2,
  Database,
  GitBranch,
  Terminal,
  Layers,
  ArrowRight,
  Container,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function LandingFour() {
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
          <div className="absolute top-1/4 left-1/3 h-[400px] w-[400px] rounded-full bg-[oklch(0.5_0.15_145/0.06)] blur-[120px]" />
          <div className="absolute right-1/4 bottom-1/4 h-[300px] w-[300px] rounded-full bg-[oklch(0.5_0.12_55/0.05)] blur-[100px]" />
        </div>

        <div className="relative z-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-1.5 font-mono text-xs tracking-wider">
            <Github className="size-3.5" />
            <span className="text-[oklch(0.7_0.15_145)]">MIT LICENSE</span>
          </div>

          <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-7xl">
            <span className="bg-gradient-to-r from-[oklch(0.7_0.15_145)] to-[oklch(0.65_0.15_85)] bg-clip-text text-transparent">
              openvlt
            </span>
          </h1>

          <p className="mx-auto mb-4 max-w-md text-xl leading-snug font-medium">
            Built in the open. For the open.
          </p>

          <p className="mx-auto max-w-xl text-lg leading-relaxed text-muted-foreground">
            Fully open source. Read the code, audit the security, fork it,
            self-host it. Your notes deserve software you can trust because you
            can verify it.
          </p>

          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 font-medium text-primary-foreground transition-all hover:brightness-110"
            >
              Get Started
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="https://github.com/openvlt/openvlt"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-8 py-3.5 font-medium transition-all hover:border-white/20 hover:bg-white/5"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="size-4" />
              Source Code
            </Link>
          </div>
        </div>
      </section>

      {/* Screenshot */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="overflow-hidden rounded-2xl shadow-2xl shadow-black/40">
          <Image
            src="/openvlt_demo.webp"
            alt="openvlt app interface"
            width={1920}
            height={1080}
            className="w-full"
            priority
          />
        </div>
      </section>

      {/* Tech stack */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <h2 className="mb-12 text-center text-2xl font-bold">
          Simple architecture. No magic.
        </h2>

        {/* Tech cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: FileCode2,
              title: "Markdown on Disk",
              desc: "Notes are .md files at data/vault/{userId}/. Browse in Finder, edit in vim, back up with rsync. The file is always the source of truth.",
              color: "text-[oklch(0.7_0.15_166)]",
            },
            {
              icon: Database,
              title: "SQLite Metadata",
              desc: "WAL mode SQLite for metadata, search indexes (FTS5), and sync state. Never the source of truth for content.",
              color: "text-[oklch(0.7_0.15_55)]",
            },
            {
              icon: Layers,
              title: "Next.js App Router",
              desc: "React 19 with Server Components. API routes call service files. No business logic in routes. Clean separation.",
              color: "text-[oklch(0.65_0.15_230)]",
            },
            {
              icon: GitBranch,
              title: "Vector Clocks",
              desc: "Conflict resolution using vector clocks for causality tracking. Three-way merge when conflicts are detected.",
              color: "text-[oklch(0.7_0.12_280)]",
            },
            {
              icon: Container,
              title: "Docker Ready",
              desc: "Single Dockerfile. Mount a volume for data persistence. Environment variables for configuration. That's it.",
              color: "text-[oklch(0.7_0.15_145)]",
            },
            {
              icon: Terminal,
              title: "Developer First",
              desc: "TypeScript end-to-end. Prettier + ESLint. shadcn/ui components. TipTap editor. bun for speed.",
              color: "text-[oklch(0.7_0.12_85)]",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="group rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition-all hover:border-white/10 hover:bg-white/[0.04]"
            >
              <card.icon className={`mb-3 size-5 ${card.color}`} />
              <h3 className="mb-2 text-base font-semibold">{card.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Code block: docker */}
      <section className="border-t border-white/5 py-24">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="mb-4 text-center text-2xl font-bold">
            Deploy in 30 seconds
          </h2>
          <p className="mb-8 text-center text-muted-foreground">
            One command. No configuration required.
          </p>

          <div className="overflow-hidden rounded-2xl border border-white/5">
            <div className="flex items-center gap-2 border-b border-white/5 bg-white/[0.03] px-4 py-3">
              <div className="size-3 rounded-full bg-[oklch(0.7_0.2_15/0.8)]" />
              <div className="size-3 rounded-full bg-[oklch(0.8_0.15_85/0.8)]" />
              <div className="size-3 rounded-full bg-[oklch(0.7_0.15_145/0.8)]" />
              <span className="ml-3 font-mono text-xs text-muted-foreground">
                terminal
              </span>
            </div>
            <div className="bg-black/30 p-6 font-mono text-sm leading-loose">
              <p>
                <span className="text-[oklch(0.7_0.15_145)]">$</span>{" "}
                <span className="text-foreground">
                  docker pull openvlt/openvlt
                </span>
              </p>
              <p className="text-muted-foreground">
                Pulling from openvlt/openvlt... done
              </p>
              <p className="mt-2">
                <span className="text-[oklch(0.7_0.15_145)]">$</span>{" "}
                <span className="text-foreground">
                  docker run -d -p 3000:3000 -v openvlt_data:/app/data
                  openvlt/openvlt
                </span>
              </p>
              <p className="text-muted-foreground">
                Container started: a7f3b2c1d4e5
              </p>
              <p className="mt-2">
                <span className="text-[oklch(0.7_0.15_145)]">$</span>{" "}
                <span className="text-foreground">
                  open http://localhost:3000
                </span>
              </p>
              <p className="text-[oklch(0.7_0.15_166)]">
                {"\u2713"} openvlt is running
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contribute CTA */}
      <section className="border-t border-white/5 py-24 text-center">
        <div className="mx-auto max-w-md px-6">
          <Github className="mx-auto mb-4 size-8 text-foreground" />
          <h2 className="mb-4 text-2xl font-bold">Contribute</h2>
          <p className="mb-8 text-muted-foreground">
            openvlt is MIT licensed. PRs welcome. Star us on GitHub.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 font-medium text-primary-foreground transition-all hover:brightness-110"
            >
              Try It
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="https://github.com/openvlt/openvlt"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-8 py-3.5 font-medium transition-all hover:border-white/20 hover:bg-white/5"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="size-4" />
              GitHub
            </Link>
          </div>
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
