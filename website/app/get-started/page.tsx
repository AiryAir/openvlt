import {
  Terminal,
  Container,
  Server,
  FolderTree,
  Database,
  Shield,
  Settings,
  HardDrive,
  ArrowLeft,
  ExternalLink,
} from "lucide-react"
import Link from "next/link"

function CodeBlock({ children, title }: { children: string; title?: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10">
      {title && (
        <div className="border-b border-white/5 bg-white/[0.03] px-4 py-2.5">
          <span className="font-mono text-xs text-stone-500">{title}</span>
        </div>
      )}
      <pre className="overflow-x-auto bg-black/30 p-4 font-mono text-sm leading-relaxed text-stone-300">
        {children}
      </pre>
    </div>
  )
}

function Section({
  id,
  icon: Icon,
  title,
  children,
}: {
  id: string
  icon: React.ElementType
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-white/5">
          <Icon className="size-4.5 text-stone-400" />
        </div>
        <h2 className="text-xl font-bold">{title}</h2>
      </div>
      <div className="space-y-4 text-sm leading-relaxed text-stone-400">
        {children}
      </div>
    </section>
  )
}

const navItems = [
  { id: "quick-install", label: "Quick Install" },
  { id: "docker", label: "Docker" },
  { id: "manual", label: "Manual Setup" },
  { id: "cli", label: "CLI Commands" },
  { id: "configuration", label: "Configuration" },
  { id: "directory-structure", label: "Directory Structure" },
  { id: "database", label: "Database" },
  { id: "security", label: "Security" },
  { id: "reverse-proxy", label: "Reverse Proxy" },
  { id: "backups", label: "Backups" },
  { id: "updating", label: "Updating" },
]

export default function GetStarted() {
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
          <span className="text-sm font-medium">Get Started</span>
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

      <div className="mx-auto flex max-w-6xl gap-12 px-6 pt-24 pb-24">
        {/* Sidebar nav */}
        <aside className="hidden w-52 shrink-0 lg:block">
          <div className="sticky top-24">
            <p className="mb-4 font-mono text-xs tracking-widest text-stone-600 uppercase">
              On this page
            </p>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="block rounded-lg px-3 py-1.5 text-sm text-stone-500 transition-colors hover:bg-white/5 hover:text-white"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1 space-y-16">
          {/* Header */}
          <div>
            <h1 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Self-Host openvlt
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-stone-400">
              Get openvlt running on your own hardware in minutes. Your notes
              stay on your machine as plain markdown files — no cloud, no third
              parties, no subscriptions.
            </p>
          </div>

          {/* Quick Install */}
          <Section id="quick-install" icon={Terminal} title="Quick Install">
            <p>
              The fastest way to get started. Works on macOS and Linux. This
              script installs all dependencies, builds the app, and starts the
              server.
            </p>

            <CodeBlock title="terminal">
              {`curl -fsSL https://openvlt.com/install.sh | bash`}
            </CodeBlock>

            <p>The install script will:</p>
            <ul className="list-inside list-disc space-y-1 pl-1">
              <li>Install Node.js 20+ and bun (if not present)</li>
              <li>
                Clone the repository to{" "}
                <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs text-stone-300">
                  ~/.openvlt/app/
                </code>
              </li>
              <li>Build the application</li>
              <li>
                Start the server on port{" "}
                <strong className="text-stone-300">3456</strong> via pm2
              </li>
              <li>
                Set up the{" "}
                <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs text-stone-300">
                  openvlt
                </code>{" "}
                CLI command
              </li>
            </ul>

            <p>
              Once complete, open{" "}
              <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs text-stone-300">
                http://localhost:3456
              </code>{" "}
              to create your account.
            </p>
          </Section>

          {/* Docker */}
          <Section id="docker" icon={Container} title="Docker">
            <p>
              Recommended for VPS and server deployments. The Docker image uses
              a multi-stage build with{" "}
              <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs text-stone-300">
                node:22-alpine
              </code>{" "}
              and runs as a non-root user.
            </p>

            <CodeBlock title="docker-compose.yml">
              {`services:
  openvlt:
    build: .
    ports:
      - "\${OPENVLT_PORT:-3456}:3456"
    volumes:
      - ./data:/app/data
    environment:
      - NODE_ENV=production
    restart: unless-stopped`}
            </CodeBlock>

            <CodeBlock title="terminal">
              {`# Clone and start
git clone https://github.com/ericvaish/openvlt.git
cd openvlt
docker compose up -d

# Or build and run manually
docker build -t openvlt .
docker run -d -p 3456:3456 -v openvlt_data:/app/data openvlt`}
            </CodeBlock>

            <p>
              The{" "}
              <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs text-stone-300">
                ./data
              </code>{" "}
              volume is critical — it contains your vault files and database.
              Mount it to persist data across container restarts.
            </p>
          </Section>

          {/* Manual */}
          <Section id="manual" icon={Server} title="Manual Setup">
            <p>
              For full control over the setup. Requires Node.js 20+ and bun.
            </p>

            <CodeBlock title="terminal">
              {`git clone https://github.com/ericvaish/openvlt.git
cd openvlt
bun install
bun run build
bun run start`}
            </CodeBlock>

            <p>
              The server starts on port 3456 by default. Set the{" "}
              <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs text-stone-300">
                PORT
              </code>{" "}
              environment variable to change it. For production, use a process
              manager like pm2 to handle restarts.
            </p>

            <CodeBlock title="terminal (pm2)">
              {`# Install pm2
bun add -g pm2

# Start with pm2
PORT=3456 pm2 start node -- .next/standalone/server.js
pm2 save`}
            </CodeBlock>
          </Section>

          {/* CLI */}
          <Section id="cli" icon={Terminal} title="CLI Commands">
            <p>
              If you used the quick install script, the{" "}
              <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs text-stone-300">
                openvlt
              </code>{" "}
              CLI is available globally.
            </p>

            <CodeBlock title="commands">
              {`openvlt start              # Start the server (default port 3456)
openvlt start 8080         # Start on a custom port
openvlt stop               # Stop the server
openvlt restart            # Restart the server
openvlt status             # Show status and check for updates
openvlt update             # Pull latest version, rebuild, restart
openvlt logs               # Show recent logs
openvlt logs -f            # Follow logs in real-time
openvlt uninstall          # Remove openvlt (keeps your data)`}
            </CodeBlock>
          </Section>

          {/* Configuration */}
          <Section id="configuration" icon={Settings} title="Configuration">
            <p>
              openvlt is configured via environment variables. All settings have
              sensible defaults — no configuration file is required.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left">
                    <th className="py-3 pr-4 font-mono text-xs font-medium text-stone-300">
                      Variable
                    </th>
                    <th className="py-3 pr-4 font-medium text-stone-300">
                      Default
                    </th>
                    <th className="py-3 font-medium text-stone-300">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody className="text-stone-500">
                  {[
                    ["PORT", "3456", "Server listening port"],
                    ["HOSTNAME", "0.0.0.0", "Bind address"],
                    [
                      "OPENVLT_DB_PATH",
                      "data/.openvlt/openvlt.db",
                      "SQLite database file path",
                    ],
                    [
                      "WEBAUTHN_ORIGIN",
                      "http://localhost:3456",
                      "WebAuthn origin (must match your domain)",
                    ],
                    [
                      "WEBAUTHN_RP_ID",
                      "localhost",
                      "WebAuthn relying party ID (your domain)",
                    ],
                    [
                      "NODE_ENV",
                      "production",
                      "Set to production for deployments",
                    ],
                  ].map(([variable, def, desc]) => (
                    <tr key={variable} className="border-b border-white/5">
                      <td className="py-3 pr-4 font-mono text-xs text-stone-300">
                        {variable}
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs">{def}</td>
                      <td className="py-3">{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p>
              For WebAuthn (biometric login) to work in production, set{" "}
              <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs text-stone-300">
                WEBAUTHN_ORIGIN
              </code>{" "}
              to your full URL (e.g.{" "}
              <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs text-stone-300">
                https://notes.example.com
              </code>
              ) and{" "}
              <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs text-stone-300">
                WEBAUTHN_RP_ID
              </code>{" "}
              to your domain (e.g.{" "}
              <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs text-stone-300">
                notes.example.com
              </code>
              ).
            </p>
          </Section>

          {/* Directory Structure */}
          <Section
            id="directory-structure"
            icon={FolderTree}
            title="Directory Structure"
          >
            <p>
              All user data lives in the{" "}
              <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs text-stone-300">
                data/
              </code>{" "}
              directory. Notes are plain markdown files — you can browse, edit,
              and back them up with standard tools.
            </p>

            <CodeBlock>
              {`data/
├── vault/
│   └── {userId}/            # Each user gets an isolated directory
│       ├── notes/
│       │   ├── meeting.md   # Plain markdown files
│       │   └── ideas.md
│       └── attachments/
│           └── image.png
└── .openvlt/
    └── openvlt.db           # SQLite metadata & search index`}
            </CodeBlock>

            <p>
              <strong className="text-stone-300">Important:</strong> The
              markdown files on disk are always the source of truth. SQLite
              stores metadata, search indexes, and sync state only — never note
              content.
            </p>
          </Section>

          {/* Database */}
          <Section id="database" icon={Database} title="Database">
            <p>
              openvlt uses SQLite in WAL mode with FTS5 for full-text search.
              The database is created and migrated automatically on first start
              — no manual setup required.
            </p>

            <ul className="list-inside list-disc space-y-1 pl-1">
              <li>Schema is created automatically on first run</li>
              <li>Migrations run automatically on startup</li>
              <li>
                Default location:{" "}
                <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs text-stone-300">
                  data/.openvlt/openvlt.db
                </code>
              </li>
              <li>
                Override with{" "}
                <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs text-stone-300">
                  OPENVLT_DB_PATH
                </code>{" "}
                env variable
              </li>
            </ul>
          </Section>

          {/* Security */}
          <Section id="security" icon={Shield} title="Security">
            <p>
              openvlt is designed for self-hosting with strong security
              defaults.
            </p>

            <div className="space-y-3">
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <p className="mb-1 text-sm font-medium text-stone-300">
                  User Isolation
                </p>
                <p>
                  Each user&apos;s files are scoped to{" "}
                  <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs text-stone-300">
                    data/vault/{"{userId}"}/
                  </code>
                  . The service layer enforces directory boundaries — users
                  cannot access each other&apos;s files through the API.
                </p>
              </div>

              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <p className="mb-1 text-sm font-medium text-stone-300">
                  Authentication
                </p>
                <p>
                  Passwords hashed with bcrypt. Optional WebAuthn for biometric
                  login (Touch ID, Face ID, Windows Hello). 24-word recovery key
                  generated at registration. Sessions stored as httpOnly cookies
                  with signed tokens.
                </p>
              </div>

              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <p className="mb-1 text-sm font-medium text-stone-300">
                  End-to-End Encryption
                </p>
                <p>
                  Lock sensitive notes with AES-256-GCM. The encryption key is
                  derived from your lock password via PBKDF2 (100,000
                  iterations) and never leaves the browser.
                </p>
              </div>

              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <p className="mb-1 text-sm font-medium text-stone-300">
                  Docker
                </p>
                <p>
                  The Docker container runs as a non-root user (
                  <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs text-stone-300">
                    UID 1001
                  </code>
                  ) with minimal permissions.
                </p>
              </div>
            </div>
          </Section>

          {/* Reverse Proxy */}
          <Section id="reverse-proxy" icon={Server} title="Reverse Proxy">
            <p>
              For production, put openvlt behind a reverse proxy with HTTPS.
              Here are example configurations.
            </p>

            <CodeBlock title="Caddy (recommended — automatic HTTPS)">
              {`notes.example.com {
    reverse_proxy localhost:3456
}`}
            </CodeBlock>

            <CodeBlock title="nginx">
              {`server {
    listen 443 ssl http2;
    server_name notes.example.com;

    ssl_certificate     /etc/letsencrypt/live/notes.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/notes.example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3456;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support (for HMR in dev, optional in prod)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}`}
            </CodeBlock>

            <p>
              Remember to set{" "}
              <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs text-stone-300">
                WEBAUTHN_ORIGIN
              </code>{" "}
              and{" "}
              <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs text-stone-300">
                WEBAUTHN_RP_ID
              </code>{" "}
              to match your domain when using a reverse proxy.
            </p>
          </Section>

          {/* Backups */}
          <Section id="backups" icon={HardDrive} title="Backups">
            <p>
              Since notes are plain files, backing up is straightforward. Back
              up two things:
            </p>

            <CodeBlock title="terminal">
              {`# Back up everything
rsync -av data/ /path/to/backup/

# Or just the essentials
cp data/.openvlt/openvlt.db /path/to/backup/
rsync -av data/vault/ /path/to/backup/vault/`}
            </CodeBlock>

            <p>
              You can also use git, Syncthing, or any file sync tool on the{" "}
              <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs text-stone-300">
                data/vault/
              </code>{" "}
              directory since it&apos;s just markdown files.
            </p>
          </Section>

          {/* Updating */}
          <Section id="updating" icon={Settings} title="Updating">
            <p>If you used the quick install script:</p>

            <CodeBlock title="terminal">{`openvlt update`}</CodeBlock>

            <p>For Docker:</p>

            <CodeBlock title="terminal">
              {`git pull
docker compose up -d --build`}
            </CodeBlock>

            <p>For manual installs:</p>

            <CodeBlock title="terminal">
              {`git pull
bun install
bun run build
bun run start  # or: pm2 restart openvlt`}
            </CodeBlock>

            <p>
              Database migrations run automatically on startup — no manual
              migration step needed.
            </p>
          </Section>

          {/* Footer */}
          <div className="border-t border-white/5 pt-12">
            <p className="text-sm text-stone-600">
              Need help?{" "}
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
        </main>
      </div>
    </div>
  )
}
