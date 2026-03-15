import {
  FileText,
  FolderTree,
  Lock,
  Search,
  RefreshCw,
  History,
  Keyboard,
  Palette,
  Download,
  Fingerprint,
  Smartphone,
  Tag,
  ArrowRight,
} from "lucide-react"
import Link from "next/link"

const features = [
  {
    icon: FileText,
    title: "Markdown Native",
    description:
      "Notes stored as plain .md files on disk. Browse them in Finder, edit in any text editor. No proprietary formats.",
    accent: "from-[oklch(0.7_0.15_166)] to-[oklch(0.6_0.12_200)]",
    span: "sm:col-span-2",
  },
  {
    icon: Lock,
    title: "E2E Encryption",
    description:
      "Lock sensitive notes with AES-256-GCM. Keys derived from your password via PBKDF2. Zero-knowledge.",
    accent: "from-[oklch(0.7_0.12_280)] to-[oklch(0.6_0.15_320)]",
    span: "",
  },
  {
    icon: Search,
    title: "Full-Text Search",
    description:
      "SQLite FTS5 powers instant search across all your notes. Find anything in milliseconds.",
    accent: "from-[oklch(0.7_0.15_55)] to-[oklch(0.65_0.12_30)]",
    span: "",
  },
  {
    icon: RefreshCw,
    title: "Hybrid Sync",
    description:
      "Auto-sync when online, queue changes when offline. Three-way merge with vector clocks for conflict resolution.",
    accent: "from-[oklch(0.7_0.15_145)] to-[oklch(0.6_0.12_166)]",
    span: "sm:col-span-2",
  },
  {
    icon: FolderTree,
    title: "Folder Tree",
    description:
      "Organize with nested folders that map directly to directories on disk. Drag and drop to rearrange.",
    accent: "from-[oklch(0.65_0.15_230)] to-[oklch(0.6_0.12_260)]",
    span: "",
  },
  {
    icon: History,
    title: "Version History",
    description:
      "Every save creates a snapshot. Browse, compare, and restore previous versions of any note.",
    accent: "from-[oklch(0.7_0.12_85)] to-[oklch(0.65_0.15_55)]",
    span: "",
  },
  {
    icon: Keyboard,
    title: "Keyboard First",
    description:
      "Command palette, slash commands, and full keyboard navigation. Never leave the keyboard.",
    accent: "from-[oklch(0.7_0.15_166)] to-[oklch(0.65_0.12_200)]",
    span: "",
  },
  {
    icon: Palette,
    title: "Dark & Light",
    description:
      "Beautiful themes that respect your system preference. Press D to toggle instantly.",
    accent: "from-[oklch(0.7_0.12_320)] to-[oklch(0.65_0.15_280)]",
    span: "",
  },
  {
    icon: Tag,
    title: "Tags",
    description:
      "Flexible tagging system for cross-cutting organization beyond folders.",
    accent: "from-[oklch(0.7_0.15_145)] to-[oklch(0.65_0.12_120)]",
    span: "",
  },
  {
    icon: Download,
    title: "Full Export",
    description:
      "Export your entire vault as a ZIP. Your data is always portable and never locked in.",
    accent: "from-[oklch(0.7_0.15_55)] to-[oklch(0.6_0.12_30)]",
    span: "",
  },
  {
    icon: Fingerprint,
    title: "WebAuthn",
    description:
      "Sign in with biometrics. Touch ID, Face ID, Windows Hello. No passwords needed.",
    accent: "from-[oklch(0.65_0.15_230)] to-[oklch(0.6_0.12_260)]",
    span: "",
  },
  {
    icon: Smartphone,
    title: "PWA",
    description:
      "Install on any device. Works like a native app on mobile, tablet, and desktop.",
    accent: "from-[oklch(0.7_0.12_166)] to-[oklch(0.65_0.15_200)]",
    span: "",
  },
]

export default function LandingTwo() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 z-50 flex w-full items-center justify-between border-b border-white/5 px-6 py-4 backdrop-blur-xl">
        <Link href="/1" className="font-mono text-lg font-bold tracking-tight">
          openvlt
        </Link>
        <Link
          href="/register"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Get Started
        </Link>
      </nav>

      {/* Header */}
      <section className="px-6 pt-32 pb-16 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-6xl">
          Everything you need.
          <br />
          <span className="text-muted-foreground">Nothing you don&apos;t.</span>
        </h1>
        <p className="mx-auto max-w-lg text-lg text-muted-foreground">
          Powerful features that stay out of your way. Built for people who
          think in markdown.
        </p>
      </section>

      {/* Bento Grid */}
      <section className="mx-auto max-w-6xl px-6 pb-32">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className={`group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-8 transition-all hover:border-white/10 hover:bg-white/[0.04] ${f.span}`}
            >
              {/* Gradient accent top border */}
              <div
                className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${f.accent} opacity-0 transition-opacity group-hover:opacity-100`}
              />

              <div className="mb-4 flex items-center gap-3">
                <div
                  className={`flex size-10 items-center justify-center rounded-lg bg-gradient-to-br ${f.accent} opacity-80`}
                >
                  <f.icon className="size-5 text-white" />
                </div>
                <h3 className="text-base font-semibold">{f.title}</h3>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/5 py-24 text-center">
        <div className="mx-auto max-w-md px-6">
          <h2 className="mb-4 text-2xl font-bold">Ready to try it?</h2>
          <p className="mb-8 text-muted-foreground">
            Deploy in seconds with Docker. Free and open source forever.
          </p>
          <div className="mb-6 overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]">
            <code className="block px-4 py-3 font-mono text-sm text-primary">
              docker pull openvlt/openvlt && docker run -p 3000:3000
              openvlt/openvlt
            </code>
          </div>
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
