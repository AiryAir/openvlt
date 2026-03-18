import Link from "next/link"
import { ArrowLeft, ExternalLink, HelpCircle } from "lucide-react"

function Question({
  question,
  children,
}: {
  question: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
      <h3 className="mb-3 text-base font-semibold text-stone-200">
        {question}
      </h3>
      <div className="space-y-3 text-sm leading-relaxed text-stone-400">
        {children}
      </div>
    </div>
  )
}

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Nav */}
      <nav className="fixed top-0 z-50 flex w-full items-center justify-between border-b border-white/5 bg-[#0a0a0a]/80 px-6 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 font-mono text-sm text-stone-500 transition-colors hover:text-white"
          >
            <ArrowLeft className="size-3.5" />
            openvlt
          </Link>
          <span className="text-stone-800">/</span>
          <Link
            href="/docs"
            className="text-sm text-stone-500 transition-colors hover:text-white"
          >
            Docs
          </Link>
          <span className="text-stone-800">/</span>
          <span className="text-sm font-medium">FAQ</span>
        </div>
        <a
          href="https://github.com/ericvaish/openvlt"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm text-stone-500 transition-colors hover:text-white"
        >
          GitHub
          <ExternalLink className="size-3" />
        </a>
      </nav>

      <div className="mx-auto max-w-3xl px-6 pt-24 pb-24">
        {/* Header */}
        <div className="mb-12">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-white/5">
              <HelpCircle className="size-4.5 text-stone-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              FAQ
            </h1>
          </div>
          <p className="max-w-xl text-lg leading-relaxed text-stone-400">
            Common questions about how openvlt works.
          </p>
        </div>

        {/* Questions */}
        <div className="space-y-4">
          <Question question="Why doesn't openvlt sync instantly like Google Docs?">
            <p>
              This is an intentional architectural decision. Sync in openvlt is{" "}
              <strong className="text-stone-300">
                peer-to-peer between self-hosted instances
              </strong>
              , not client-to-centralized-server like Google Docs.
            </p>

            <p className="font-medium text-stone-300">How sync works</p>
            <ol className="list-inside list-decimal space-y-1 text-stone-500">
              <li>
                The editor waits 800ms after your last keystroke, then saves the
                note
              </li>
              <li>
                The save writes the{" "}
                <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs text-stone-300">
                  .md
                </code>{" "}
                file to disk and appends an entry to the sync log
              </li>
              <li>
                A file watcher detects the change and broadcasts it via SSE to
                connected peers
              </li>
              <li>
                The remote peer receives the event, pulls the changes, and
                applies them with a three-way merge
              </li>
            </ol>
            <p>
              Total propagation latency is roughly 1.3 to 2 seconds from
              keystroke to remote peer.
            </p>

            <p className="font-medium text-stone-300">
              Why it&apos;s different from Google Docs
            </p>
            <p>
              Google Docs uses Operational Transform (OT) with a centralized
              server, where every keystroke is sent as a micro-operation and
              merged in real-time. That requires a central server mediating all
              edits, character-level conflict resolution, and an always-online
              assumption.
            </p>
            <p>
              openvlt&apos;s architecture is closer to Git: document-level
              snapshots synced between peers. This is intentional because:
            </p>
            <ul className="list-inside list-disc space-y-1 text-stone-500">
              <li>
                <strong className="text-stone-300">
                  Files on disk are the source of truth.
                </strong>{" "}
                Your notes are browseable{" "}
                <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs text-stone-300">
                  .md
                </code>{" "}
                files, not entries in a proprietary database.
              </li>
              <li>
                <strong className="text-stone-300">Offline-first.</strong> You
                keep working without a connection. Changes sync when peers
                reconnect.
              </li>
              <li>
                <strong className="text-stone-300">Privacy.</strong> No central
                server ever sees your content. Sync is peer-to-peer with
                HMAC-signed requests.
              </li>
              <li>
                <strong className="text-stone-300">Simplicity.</strong> OT/CRDT
                at the character level is enormously complex to implement and
                maintain correctly.
              </li>
            </ul>

            <p className="font-medium text-stone-300">The tradeoff</p>
            <p>
              We sacrifice keystroke-level collaboration (two people editing the
              same note simultaneously) in exchange for privacy, offline support,
              and the open{" "}
              <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs text-stone-300">
                .md
              </code>{" "}
              file format. If two peers edit the same note at the same time,
              conflicts are resolved via three-way merge or a{" "}
              <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs text-stone-300">
                .conflict.md
              </code>{" "}
              file the user can review.
            </p>
            <p>
              openvlt is more like{" "}
              <strong className="text-stone-300">Obsidian Sync</strong>{" "}
              (document-level, async) than{" "}
              <strong className="text-stone-300">Google Docs</strong>{" "}
              (character-level, real-time), and that&apos;s by design.
            </p>
          </Question>
        </div>

        {/* Footer */}
        <div className="mt-16 border-t border-white/5 pt-12">
          <p className="text-sm text-stone-600">
            Have a question not listed here?{" "}
            <a
              href="mailto:hi@ericvaish.com"
              className="text-stone-400 underline decoration-stone-800 underline-offset-4 transition-colors hover:text-white"
            >
              hi@ericvaish.com
            </a>{" "}
            &middot;{" "}
            <a
              href="https://github.com/ericvaish/openvlt/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-stone-400 underline decoration-stone-800 underline-offset-4 transition-colors hover:text-white"
            >
              Open an issue on GitHub
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
