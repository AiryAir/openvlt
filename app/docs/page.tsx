"use client"

import { useRouter } from "next/navigation"
import { ArrowLeftIcon } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs">
      {children}
    </kbd>
  )
}

function Bullet({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <li className="flex gap-2">
      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-foreground/40" />
      <span>
        <strong className="text-foreground">{title}</strong> &mdash; {children}
      </span>
    </li>
  )
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-muted px-1 py-0.5 text-xs">{children}</code>
  )
}

/* ────────────────────────────────────────────────────────────────────── */
/*  Tab content components                                               */
/* ────────────────────────────────────────────────────────────────────── */

function OverviewTab() {
  return (
    <div className="space-y-10">
      <section>
        <h2 className="mb-3 text-lg font-medium">The Note Bundle</h2>
        <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
          Every note in openvlt is a{" "}
          <strong className="text-foreground">directory</strong> (folder) on
          disk. Inside that directory lives the note&apos;s Markdown file
          alongside any attachments &mdash; images, PDFs, videos, or any other
          file you add.
        </p>
        <div className="mb-3 rounded-lg border bg-muted/50 p-4 font-mono text-xs leading-relaxed">
          <div className="text-muted-foreground">vault/</div>
          <div className="pl-4 text-muted-foreground">my-note/</div>
          <div className="pl-8">note.md</div>
          <div className="pl-8 text-muted-foreground">photo.jpg</div>
          <div className="pl-8 text-muted-foreground">document.pdf</div>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          This is a standard directory structure. You can browse it in Finder,
          back it up with any tool, or move it to another app. Nothing is hidden
          in a database.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Simple vs Advanced View</h2>
        <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
          The toggle in the sidebar switches how the file tree is displayed. The
          underlying files are identical in both modes &mdash; only the
          presentation changes.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border p-4">
            <h3 className="mb-1.5 text-sm font-medium">Simple</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Each note bundle appears as a single item. Attachments are hidden
              from the tree. You see a clean list of notes and folders, similar
              to Apple Notes. Ideal for writing without distractions.
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="mb-1.5 text-sm font-medium">Advanced</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              The raw file system is shown as-is. You can see every file inside
              each note bundle &mdash; the Markdown file, images, PDFs, and any
              other attachment. Like browsing in Finder or VS Code.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Open Standard, No Lock-in</h2>
        <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
          openvlt is designed around open, widely-adopted formats:
        </p>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <Bullet title="Markdown">
            Notes are plain <Code>.md</Code> files. Compatible with Obsidian,
            Typora, VS Code, or any text editor.
          </Bullet>
          <Bullet title="Directories as bundles">
            A folder groups a note with its attachments. No proprietary
            container format. Works with any file manager.
          </Bullet>
          <Bullet title="SQLite for metadata only">
            The database indexes your notes for fast search and sync. It never
            stores note content. Delete the database, and your notes are still
            intact on disk.
          </Bullet>
          <Bullet title="No proprietary sync protocol">
            Sync works over standard HTTP. Conflict resolution uses vector
            clocks and three-way merge &mdash; well-understood algorithms, not
            custom magic.
          </Bullet>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Your Data, Your Files</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Everything openvlt creates lives in your vault directory. You can open
          it in Finder, sync it with any cloud service, back it up with Time
          Machine, or copy it to a USB drive. If you ever stop using openvlt,
          your notes are still plain Markdown files in folders &mdash; ready for
          whatever comes next.
        </p>
      </section>
    </div>
  )
}

function EditorTab() {
  return (
    <div className="space-y-10">
      <section>
        <h2 className="mb-3 text-lg font-medium">Editor &amp; Formatting</h2>
        <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
          openvlt uses a hybrid editor that renders rich text while preserving
          Markdown under the hood. You can write Markdown directly or use the
          formatting toolbar &mdash; the result is always a
          standard <Code>.md</Code> file.
        </p>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <Bullet title="Rich formatting">
            Bold, italic, underline, strikethrough, inline code, and links via
            toolbar or standard keyboard shortcuts.
          </Bullet>
          <Bullet title="Headings">
            Three levels (H1, H2, H3). Type <Code>#</Code> at the start of a
            line, or use the toolbar.
          </Bullet>
          <Bullet title="Lists">
            Bullet lists, numbered lists, and task lists with checkboxes.
          </Bullet>
          <Bullet title="Code blocks">
            Fenced code blocks with syntax highlighting for dozens of languages.
          </Bullet>
          <Bullet title="Tables">
            Insert and edit tables with an overlay for adding and removing rows
            and columns.
          </Bullet>
          <Bullet title="Callouts">
            Info, tip, warning, and danger callout blocks for highlighting
            important content.
          </Bullet>
          <Bullet title="Toggle blocks">
            Collapsible sections that expand and collapse on click.
          </Bullet>
          <Bullet title="Excalidraw diagrams">
            Embedded whiteboard for sketches and diagrams, saved directly inside
            the note.
          </Bullet>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Slash Commands</h2>
        <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
          Type <Code>/</Code> anywhere in the editor to open a quick-insert
          menu. Search by name to find the block you need:
        </p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 rounded-lg border bg-muted/50 p-4 text-sm text-muted-foreground">
          <span>Heading 1 / 2 / 3</span>
          <span>Blockquote</span>
          <span>Bullet list</span>
          <span>Code block</span>
          <span>Numbered list</span>
          <span>Table</span>
          <span>Task list</span>
          <span>Horizontal rule</span>
          <span>Callout (info, tip, warning, danger)</span>
          <span>Toggle block</span>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Attachments</h2>
        <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
          Drop any file into the editor to attach it. Attachments are stored
          alongside the note&apos;s Markdown file in the same directory &mdash;
          no separate media library, no cloud dependency.
        </p>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <Bullet title="Images">
            Displayed inline with a lightbox viewer for full-size previews.
          </Bullet>
          <Bullet title="PDFs">
            Embedded viewer with page navigation, right inside the note.
          </Bullet>
          <Bullet title="Word documents">
            Preview DOCX files in an embedded viewer modal.
          </Bullet>
          <Bullet title="Other files">
            Any file type can be attached. Non-previewable files appear as
            download links.
          </Bullet>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">
          Split View &amp; Tabs
        </h2>
        <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
          Open multiple notes as tabs, just like a browser. Drag tabs to reorder
          them, middle-click to close, or use the tab bar to switch between open
          notes quickly.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Open two notes side by side for reference or comparison. Use the split
          view action from any note&apos;s menu to open it in a second pane
          alongside your current note.
        </p>
      </section>
    </div>
  )
}

function OrganizationTab() {
  return (
    <div className="space-y-10">
      <section>
        <h2 className="mb-3 text-lg font-medium">Tags &amp; Favorites</h2>
        <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
          Organize notes beyond the folder hierarchy with tags and favorites.
        </p>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <Bullet title="Tags">
            Create custom tags and assign multiple tags to any note. Filter by
            tag in search to find related content across folders.
          </Bullet>
          <Bullet title="Favorites">
            Star notes you access frequently. Favorited notes appear in a
            dedicated section for quick access.
          </Bullet>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Bookmarks</h2>
        <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
          Bookmarks let you pin quick links in the sidebar for instant access.
          You can bookmark three types of items:
        </p>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <Bullet title="Notes">
            Pin frequently used notes to the bookmark panel.
          </Bullet>
          <Bullet title="Headings">
            Bookmark a specific heading within a note to jump directly to that
            section.
          </Bullet>
          <Bullet title="Searches">
            Save a search query as a bookmark so you can re-run it with one
            click.
          </Bullet>
        </ul>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Bookmarks are reorderable &mdash; drag them to arrange however you
          like.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Search</h2>
        <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
          openvlt provides two layers of search:
        </p>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <Bullet title="Full-text search">
            Powered by SQLite FTS5, searches the content of every note
            instantly. Results include title, last-updated time, tags, and lock
            status.
          </Bullet>
          <Bullet title="Fuzzy search">
            The command palette (<Kbd>Cmd+K</Kbd>) uses fuzzy matching with
            weighted title scoring, so you can find notes even with partial or
            misspelled queries.
          </Bullet>
          <Bullet title="Filters">
            Narrow results by favorites, locked status, or tag membership.
          </Bullet>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">
          Wiki Links &amp; Graph View
        </h2>
        <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
          Link between notes using wiki-style
          syntax: <Code>[[Note Title]]</Code>. openvlt tracks these connections
          and displays them in two ways:
        </p>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <Bullet title="Backlinks panel">
            See all notes that link to the current note. Includes both explicit
            links (linked references) and text mentions (unlinked references).
          </Bullet>
          <Bullet title="Graph view">
            A visual map of how your notes are connected. Each node is a note;
            each edge is a wiki link. Helps you discover unexpected connections
            and navigate your knowledge base spatially.
          </Bullet>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Templates</h2>
        <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
          Start new notes from a template instead of a blank page. openvlt
          includes built-in templates and supports custom ones.
        </p>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <Bullet title="Built-in templates">
            Daily journal, meeting notes, and project brief &mdash; ready to use
            out of the box.
          </Bullet>
          <Bullet title="Custom templates">
            Create your own templates with any content. They appear in the
            template picker when you create a new note.
          </Bullet>
          <Bullet title="Variables">
            Templates support <Code>{"{{date}}"}</Code>,{" "}
            <Code>{"{{time}}"}</Code>, and <Code>{"{{iso}}"}</Code> placeholders
            that auto-fill when the note is created.
          </Bullet>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Daily Notes</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Create a daily journal entry with one click. openvlt generates a note
          titled with today&apos;s date using the daily journal template. If a
          note for today already exists, it opens it instead. Access daily notes
          from the sidebar or the command palette.
        </p>
      </section>
    </div>
  )
}

function HistoryTab() {
  return (
    <div className="space-y-10">
      <section>
        <h2 className="mb-3 text-lg font-medium">
          Version History
        </h2>
        <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
          Every edit is tracked. openvlt automatically saves version snapshots as
          you work &mdash; on autosave, when you stop typing, when you navigate
          away, and on explicit save.
        </p>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <Bullet title="Version timeline">
            Browse every saved version of a note, grouped by editing session.
            Preview any version or restore it with one click.
          </Bullet>
          <Bullet title="Retention policy">
            Configure how long versions are kept in Settings: 30, 90, 180, or
            365 days &mdash; or keep them forever.
          </Bullet>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Time Machine</h2>
        <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
          A vault-wide history view. Scrub through a timeline to see the state
          of your entire vault &mdash; notes, folders, and attachments &mdash;
          at any point in time.
        </p>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <Bullet title="Note history">
            See every version of a single note across its lifetime.
          </Bullet>
          <Bullet title="Folder history">
            Track how a folder&apos;s contents changed over time.
          </Bullet>
          <Bullet title="Vault history">
            Browse snapshots of your entire vault at specific timestamps.
          </Bullet>
          <Bullet title="Structure events">
            Tracks creates, moves, renames, and deletes &mdash; not just
            content changes.
          </Bullet>
          <Bullet title="Attachment history">
            See when files were uploaded, updated, or removed from a note.
          </Bullet>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Trash &amp; Recovery</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Deleted notes are moved to the trash, not permanently removed. Browse
          the trash panel to see deleted notes, restore any of them with one
          click, or purge the trash to permanently delete everything in it.
        </p>
      </section>
    </div>
  )
}

function SecurityTab() {
  return (
    <div className="space-y-10">
      <section>
        <h2 className="mb-3 text-lg font-medium">Locked Notes</h2>
        <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
          Any note can be locked with a password. Locked notes are encrypted
          end-to-end using{" "}
          <strong className="text-foreground">AES-256-GCM</strong> with a key
          derived from your lock password via PBKDF2. The server never sees the
          plaintext.
        </p>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <Bullet title="Per-note passwords">
            Each note can have its own lock password, independent of your
            account password.
          </Bullet>
          <Bullet title="Peek without unlocking">
            Temporarily decrypt a note to view it without permanently removing
            the lock.
          </Bullet>
          <Bullet title="Lock indicator">
            Locked notes are visually marked in search results, the sidebar, and
            the note header.
          </Bullet>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Authentication</h2>
        <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
          openvlt supports multiple authentication methods and isolates each
          user&apos;s data completely.
        </p>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <Bullet title="Password login">
            Passwords are hashed with bcrypt. Sessions use signed, httpOnly
            cookies.
          </Bullet>
          <Bullet title="WebAuthn (biometric)">
            Register a fingerprint or face recognition device for passwordless
            login.
          </Bullet>
          <Bullet title="Recovery key">
            A 24-word mnemonic is generated at registration. Store it
            safely &mdash; it&apos;s the only way to recover your account if you
            lose your password.
          </Bullet>
          <Bullet title="User isolation">
            Each user has their own vault directory. The server enforces strict
            boundaries &mdash; users cannot access each other&apos;s files.
          </Bullet>
        </ul>
      </section>
    </div>
  )
}

function SettingsTab() {
  return (
    <div className="space-y-10">
      <section>
        <h2 className="mb-3 text-lg font-medium">
          Settings &amp; Customization
        </h2>
        <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
          Access settings from the sidebar or with <Kbd>Cmd+,</Kbd>.
        </p>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <Bullet title="Account">
            View your username and display name, change your password, or log
            out.
          </Bullet>
          <Bullet title="Appearance">
            Switch between light, dark, and system theme.
          </Bullet>
          <Bullet title="Custom CSS">
            Inject your own CSS to customize the look and feel. Write styles in
            the editor, apply them instantly, and clear them if needed.
          </Bullet>
          <Bullet title="Editor">
            Set the version history retention period (30 / 90 / 180 / 365 days,
            or forever).
          </Bullet>
          <Bullet title="Data">
            Export all notes as a ZIP archive.
          </Bullet>
          <Bullet title="Danger zone">
            Purge the trash to permanently delete all trashed notes.
          </Bullet>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Export</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Export your entire vault as a ZIP file. The export preserves your
          folder hierarchy and includes all attachments alongside their notes.
          The file is named <Code>openvlt-export-YYYY-MM-DD.zip</Code> for easy
          versioning.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Command Palette</h2>
        <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
          Press <Kbd>Cmd+K</Kbd> (or <Kbd>Ctrl+K</Kbd>) to open the command
          palette. From here you can:
        </p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 rounded-lg border bg-muted/50 p-4 text-sm text-muted-foreground">
          <span>Search notes (fuzzy)</span>
          <span>Toggle sidebar</span>
          <span>Create a new note</span>
          <span>Export all notes</span>
          <span>Create a new folder</span>
          <span>Open settings</span>
          <span>Open graph view</span>
          <span>Switch theme</span>
          <span>Open daily note</span>
          <span>Jump to random note</span>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Keyboard Shortcuts</h2>
        <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
          Navigate and control openvlt entirely from the keyboard.
        </p>
        <div className="space-y-1 rounded-lg border bg-muted/50 p-4 text-sm">
          {[
            ["Cmd+K", "Command palette"],
            ["Cmd+B", "Toggle sidebar"],
            ["Cmd+O / Cmd+,", "Open settings"],
            ["Cmd+Shift+H", "Toggle history panel"],
            ["Ctrl+N / Cmd+N", "New note"],
            ["Cmd+Z", "Undo"],
            ["Cmd+Y", "Redo"],
          ].map(([key, desc]) => (
            <div key={key} className="flex items-center justify-between py-1">
              <span className="text-muted-foreground">{desc}</span>
              <Kbd>{key}</Kbd>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          On Windows and Linux, substitute <Kbd>Ctrl</Kbd> for <Kbd>Cmd</Kbd>.
        </p>
      </section>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────── */
/*  Main page                                                            */
/* ────────────────────────────────────────────────────────────────────── */

export default function DocsPage() {
  const router = useRouter()

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <button
        onClick={() => router.back()}
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeftIcon className="size-3.5" />
        Back
      </button>

      <h1 className="mb-2 text-2xl font-semibold tracking-tight">
        How openvlt Works
      </h1>
      <p className="mb-8 text-muted-foreground">
        openvlt stores your notes as standard Markdown files on disk. No
        proprietary formats, no lock-in. Your data is always yours.
      </p>

      <Tabs defaultValue="overview">
        <TabsList className="mb-8 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>
        <TabsContent value="editor">
          <EditorTab />
        </TabsContent>
        <TabsContent value="organization">
          <OrganizationTab />
        </TabsContent>
        <TabsContent value="history">
          <HistoryTab />
        </TabsContent>
        <TabsContent value="security">
          <SecurityTab />
        </TabsContent>
        <TabsContent value="settings">
          <SettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
