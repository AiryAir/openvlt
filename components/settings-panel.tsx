"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import {
  SunIcon,
  MoonIcon,
  MonitorIcon,
  LogOutIcon,
  DownloadIcon,
  TrashIcon,
  UserIcon,
  KeyIcon,
  CloudIcon,
  RefreshCwIcon,
  LinkIcon,
  UnlinkIcon,
  CheckCircleIcon,
  XCircleIcon,
  LoaderIcon,
  PlayIcon,
  ServerIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  LayoutPanelLeftIcon,
  PanelTopIcon,
} from "lucide-react"
import { useSidebarLayout } from "@/hooks/use-sidebar-layout"
import { toast } from "sonner"
import {
  useShortcuts,
  ShortcutKeys,
  eventToBinding,
  bindingToString,
  getConflicts,
  formatShortcut,
  type ShortcutBinding,
} from "@/lib/stores/shortcuts-store"
import { confirmDialog, promptDialog } from "@/lib/dialogs"
import type { User, BackupFrequency, BackupRun, SyncPairing } from "@/types"

export function SettingsPanel() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { layout: sidebarLayout, setLayout: setSidebarLayout } =
    useSidebarLayout()
  const [user, setUser] = React.useState<User | null>(null)
  const [versionRetention, setVersionRetention] = React.useState("365")
  const [attachmentRetention, setAttachmentRetention] = React.useState("7")
  const shortcuts = useShortcuts()
  const [recordingId, setRecordingId] = React.useState<string | null>(null)

  // Listen for key presses while recording a new shortcut
  const [pendingBinding, setPendingBinding] =
    React.useState<ShortcutBinding | null>(null)
  const [pendingConflictMsg, setPendingConflictMsg] = React.useState<
    string | null
  >(null)

  React.useEffect(() => {
    if (!recordingId) return

    function onKeyDown(e: KeyboardEvent) {
      e.preventDefault()
      e.stopPropagation()

      // Escape cancels recording
      if (e.key === "Escape") {
        setRecordingId(null)
        setPendingBinding(null)
        setPendingConflictMsg(null)
        return
      }

      const binding = eventToBinding(e)
      if (!binding) return

      // Check for internal conflicts (already used by another openvlt action)
      for (const def of shortcuts.definitions) {
        if (def.id === recordingId) continue
        const existing = shortcuts.getBinding(def.id)
        if (
          existing &&
          bindingToString(existing) === bindingToString(binding)
        ) {
          toast.error(
            `Already used by "${def.label}". Choose a different shortcut.`
          )
          return
        }
      }

      // Check for external conflicts (browser, Excalidraw, tldraw)
      const conflicts = getConflicts(binding)
      if (conflicts.length > 0) {
        const unoverridable = conflicts.find((c) => c.unoverridable)
        if (unoverridable) {
          toast.error(
            `${formatShortcut(binding)} is reserved by your browser (${unoverridable.action}) and cannot be intercepted.`
          )
          return
        }
        // Show warning but let user confirm
        const lines = conflicts.map(
          (c) =>
            `${c.app === "browser" ? "Browser" : c.app === "excalidraw" ? "Excalidraw" : "tldraw"}: ${c.action}`
        )
        setPendingBinding(binding)
        setPendingConflictMsg(lines.join(", "))
        return
      }

      // No conflicts, save directly
      shortcuts.setOverride(recordingId!, binding)
      setRecordingId(null)
      setPendingBinding(null)
      setPendingConflictMsg(null)
    }

    window.addEventListener("keydown", onKeyDown, true)
    return () => window.removeEventListener("keydown", onKeyDown, true)
  }, [recordingId, shortcuts])

  function confirmPendingShortcut() {
    if (pendingBinding && recordingId) {
      shortcuts.setOverride(recordingId, pendingBinding)
    }
    setRecordingId(null)
    setPendingBinding(null)
    setPendingConflictMsg(null)
  }

  function cancelPendingShortcut() {
    setPendingBinding(null)
    setPendingConflictMsg(null)
  }

  // Cloud Backup state
  const [backupProvider, setBackupProvider] = React.useState<{
    id: string
    provider: string
    displayName: string | null
  } | null>(null)
  const [backupConfig, setBackupConfig] = React.useState<{
    id: string
    enabled: boolean
    frequency: BackupFrequency
    maxVersions: number
  } | null>(null)
  const [backupHistory, setBackupHistory] = React.useState<BackupRun[]>([])
  const [backupLoading, setBackupLoading] = React.useState(false)
  const [backupPassword, setBackupPassword] = React.useState("")
  const [backupFrequency, setBackupFrequency] =
    React.useState<BackupFrequency>("daily")
  const [backupMaxVersions, setBackupMaxVersions] = React.useState("10")

  // Peer Sync state
  const [syncPeer, setSyncPeer] = React.useState<{
    id: string
    displayName: string
  } | null>(null)
  const [syncPairings, setSyncPairings] = React.useState<SyncPairing[]>([])
  const [pairUrl, setPairUrl] = React.useState("")
  const [pairUsername, setPairUsername] = React.useState("")
  const [pairPassword, setPairPassword] = React.useState("")
  const [pairingLoading, setPairingLoading] = React.useState(false)

  React.useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setUser(data?.user ?? null))
      .catch(() => {})
  }, [])

  // Load backup state
  React.useEffect(() => {
    fetch("/api/backup/providers")
      .then((r) => (r.ok ? r.json() : []))
      .then((providers: { id: string; provider: string; displayName: string | null }[]) => {
        if (providers.length > 0) setBackupProvider(providers[0])
      })
      .catch(() => {})

    fetch("/api/backup/config")
      .then((r) => (r.ok ? r.json() : null))
      .then((config: { id: string; enabled: boolean; frequency: BackupFrequency; maxVersions: number } | null) => {
        if (config) {
          setBackupConfig(config)
          setBackupFrequency(config.frequency)
          setBackupMaxVersions(String(config.maxVersions))
        }
      })
      .catch(() => {})

    fetch("/api/backup/history")
      .then((r) => (r.ok ? r.json() : []))
      .then(setBackupHistory)
      .catch(() => {})
  }, [])

  // Load sync state
  React.useEffect(() => {
    fetch("/api/sync/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { peer: { id: string; displayName: string }; pairings: SyncPairing[] } | null) => {
        if (data) {
          setSyncPeer(data.peer)
          setSyncPairings(data.pairings)
        }
      })
      .catch(() => {})
  }, [])

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
  }

  async function handleExport() {
    window.location.href = "/api/export"
  }

  async function handleChangePassword() {
    const current = await promptDialog({ title: "Change password", description: "Current password:", type: "password" })
    if (!current) return
    const newPass = await promptDialog({ title: "Change password", description: "New password:", type: "password" })
    if (!newPass) return
    const confirmPass = await promptDialog({ title: "Change password", description: "Confirm new password:", type: "password" })
    if (newPass !== confirmPass) {
      toast.error("Passwords don't match")
      return
    }
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: current, newPassword: newPass }),
    })
    if (res.ok) {
      alert("Password changed successfully")
    } else {
      const data = await res.json().catch(() => ({}))
      alert(data.error || "Failed to change password")
    }
  }

  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl space-y-8 p-6">
          {/* Account */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Account</h2>
            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                  <UserIcon className="size-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {user?.displayName || user?.username || "Loading..."}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    @{user?.username || "..."}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleChangePassword}
                >
                  <KeyIcon className="mr-2 size-3.5" />
                  Change Password
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                >
                  <LogOutIcon className="mr-2 size-3.5" />
                  Log Out
                </Button>
              </div>
            </div>
          </section>

          {/* Appearance */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Appearance</h2>
            <div className="space-y-3 rounded-lg border p-4">
              <label className="text-sm text-muted-foreground">Theme</label>
              <div className="flex gap-2">
                {(
                  [
                    { value: "light", icon: SunIcon, label: "Light" },
                    { value: "dark", icon: MoonIcon, label: "Dark" },
                    { value: "system", icon: MonitorIcon, label: "System" },
                  ] as const
                ).map((opt) => (
                  <Button
                    key={opt.value}
                    variant={theme === opt.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme(opt.value)}
                  >
                    <opt.icon className="mr-2 size-3.5" />
                    {opt.label}
                  </Button>
                ))}
              </div>
              <label className="text-sm text-muted-foreground">
                Sidebar Layout
              </label>
              <div className="flex gap-2">
                <Button
                  variant={sidebarLayout === "rail" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSidebarLayout("rail")}
                >
                  <LayoutPanelLeftIcon className="mr-2 size-3.5" />
                  Rail
                </Button>
                <Button
                  variant={sidebarLayout === "horizontal" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSidebarLayout("horizontal")}
                >
                  <PanelTopIcon className="mr-2 size-3.5" />
                  Horizontal
                </Button>
              </div>
            </div>
          </section>

          {/* Editor */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Editor</h2>
            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">
                    Version History Retention
                  </label>
                  <p className="text-sm text-muted-foreground">
                    How long to keep note version history
                  </p>
                </div>
                <select
                  value={versionRetention}
                  onChange={(e) => setVersionRetention(e.target.value)}
                  className="h-8 rounded-md border bg-background px-2 text-sm"
                >
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                  <option value="180">180 days</option>
                  <option value="365">365 days</option>
                  <option value="0">Forever</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">
                    Attachment Version Retention
                  </label>
                  <p className="text-sm text-muted-foreground">
                    How long to keep old attachment versions
                  </p>
                </div>
                <select
                  value={attachmentRetention}
                  onChange={(e) => setAttachmentRetention(e.target.value)}
                  className="h-8 rounded-md border bg-background px-2 text-sm"
                >
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                  <option value="365">365 days</option>
                  <option value="0">Forever</option>
                </select>
              </div>
            </div>
          </section>

          {/* Keyboard Shortcuts */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
            <div className="space-y-1 rounded-lg border p-4">
              {(["general", "navigation", "editor"] as const).map((category) => {
                const defs = shortcuts.definitions.filter(
                  (d) => d.category === category
                )
                if (defs.length === 0) return null
                return (
                  <div key={category} className="space-y-0.5 first:pt-0 [&:not(:first-child)]:pt-1">
                    <h3 className="flex items-center gap-2 pb-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                      {category}
                      <span className="h-px flex-1 bg-border" />
                    </h3>
                    {defs.map((def) => {
                      const binding = shortcuts.getBinding(def.id)
                      const isOverridden = def.id in shortcuts.overrides
                      const isRecording = recordingId === def.id
                      const showConflictWarning =
                        isRecording && pendingBinding && pendingConflictMsg
                      // Show existing conflict indicator for current binding
                      const existingConflicts = binding
                        ? getConflicts(binding)
                        : []

                      return (
                        <div key={def.id} className="space-y-1">
                          <div className="flex items-center justify-between rounded-md px-2 py-1.5">
                            <span className="text-sm">{def.label}</span>
                            <div className="flex items-center gap-2">
                              {isRecording ? (
                                showConflictWarning ? (
                                  <div className="flex items-center gap-2">
                                    <span className="rounded border border-yellow-500/50 bg-yellow-500/10 px-2.5 py-1 font-mono text-xs text-yellow-500">
                                      <ShortcutKeys
                                        binding={pendingBinding}
                                      />
                                    </span>
                                    <button
                                      onClick={confirmPendingShortcut}
                                      className="rounded bg-yellow-600 px-2 py-1 text-xs font-medium text-white hover:bg-yellow-500"
                                    >
                                      Use anyway
                                    </button>
                                    <button
                                      onClick={cancelPendingShortcut}
                                      className="text-xs text-muted-foreground hover:text-foreground"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <span className="animate-pulse rounded border border-primary bg-primary/5 px-2.5 py-1 font-mono text-xs text-primary">
                                    Press shortcut...
                                  </span>
                                )
                              ) : (
                                <button
                                  onClick={() => {
                                    setRecordingId(def.id)
                                    setPendingBinding(null)
                                    setPendingConflictMsg(null)
                                  }}
                                  className={`rounded border px-2.5 py-1 font-mono text-xs transition-colors hover:bg-accent ${
                                    existingConflicts.length > 0
                                      ? "border-yellow-500/30 bg-yellow-500/5"
                                      : "bg-muted"
                                  }`}
                                  title={
                                    existingConflicts.length > 0
                                      ? `Conflicts with: ${existingConflicts.map((c) => `${c.app} (${c.action})`).join(", ")}`
                                      : "Click to change shortcut"
                                  }
                                >
                                  {binding ? (
                                    <ShortcutKeys binding={binding} />
                                  ) : (
                                    "Not set"
                                  )}
                                </button>
                              )}
                              {isOverridden && !isRecording && (
                                <button
                                  onClick={() =>
                                    shortcuts.resetOverride(def.id)
                                  }
                                  className="text-xs text-muted-foreground hover:text-foreground"
                                  title="Reset to default"
                                >
                                  Reset
                                </button>
                              )}
                            </div>
                          </div>
                          {/* Conflict warning banner */}
                          {isRecording &&
                            showConflictWarning &&
                            pendingConflictMsg && (
                              <div className="mx-2 rounded border border-yellow-500/30 bg-yellow-500/5 px-3 py-2 text-xs text-yellow-600 dark:text-yellow-400">
                                This shortcut conflicts with:{" "}
                                {pendingConflictMsg}. It will be overridden when
                                those editors are open.
                              </div>
                            )}
                          {/* Existing conflict indicator */}
                          {!isRecording && existingConflicts.length > 0 && (
                            <div className="mx-2 rounded border border-yellow-500/20 bg-yellow-500/5 px-3 py-1.5 text-xs text-yellow-600 dark:text-yellow-400">
                              Also used by{" "}
                              {existingConflicts
                                .map(
                                  (c) =>
                                    `${c.app === "browser" ? "Browser" : c.app === "excalidraw" ? "Excalidraw" : "tldraw"} (${c.action})`
                                )
                                .join(", ")}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
              {Object.keys(shortcuts.overrides).length > 0 && (
                <div className="border-t pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={shortcuts.resetAll}
                  >
                    Reset All to Defaults
                  </Button>
                </div>
              )}
            </div>
          </section>

          {/* Data */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Data</h2>
            <div className="space-y-3 rounded-lg border p-4">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <DownloadIcon className="mr-2 size-3.5" />
                Export All Notes (ZIP)
              </Button>
            </div>
          </section>

          {/* Cloud Backup */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Cloud Backup</h2>
            <div className="space-y-4 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                    <CloudIcon className="size-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Google Drive</p>
                    <p className="text-sm text-muted-foreground">
                      {backupProvider ? "Connected" : "Not connected"}
                    </p>
                  </div>
                </div>
                {backupProvider ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      await fetch(`/api/backup/providers/${backupProvider.id}`, { method: "DELETE" })
                      setBackupProvider(null)
                      setBackupConfig(null)
                    }}
                  >
                    <UnlinkIcon className="mr-2 size-3.5" />
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const res = await fetch("/api/backup/providers", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ provider: "google_drive" }),
                      })
                      if (res.ok) {
                        const { authUrl } = await res.json()
                        window.location.href = authUrl
                      }
                    }}
                  >
                    <LinkIcon className="mr-2 size-3.5" />
                    Connect Google Drive
                  </Button>
                )}
              </div>

              {backupProvider && !backupConfig && (
                <div className="space-y-3 border-t pt-4">
                  <p className="text-sm font-medium">Set up automatic backups</p>
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-muted-foreground">Frequency</label>
                    <select
                      value={backupFrequency}
                      onChange={(e) => setBackupFrequency(e.target.value as BackupFrequency)}
                      className="h-8 rounded-md border bg-background px-2 text-sm"
                    >
                      <option value="hourly">Every hour</option>
                      <option value="every_6h">Every 6 hours</option>
                      <option value="every_12h">Every 12 hours</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-muted-foreground">History versions to keep</label>
                    <select
                      value={backupMaxVersions}
                      onChange={(e) => setBackupMaxVersions(e.target.value)}
                      className="h-8 rounded-md border bg-background px-2 text-sm"
                    >
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">
                      Backup password (needed to restore)
                    </label>
                    <input
                      type="password"
                      value={backupPassword}
                      onChange={(e) => setBackupPassword(e.target.value)}
                      placeholder="Enter a backup password"
                      className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      All backups are encrypted. You will need this password to restore notes.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    disabled={!backupPassword}
                    onClick={async () => {
                      const res = await fetch("/api/backup/config", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          providerId: backupProvider.id,
                          frequency: backupFrequency,
                          backupPassword,
                          maxVersions: parseInt(backupMaxVersions, 10),
                        }),
                      })
                      if (res.ok) {
                        const config = await res.json()
                        setBackupConfig(config)
                        setBackupPassword("")
                      }
                    }}
                  >
                    Enable Backup
                  </Button>
                </div>
              )}

              {backupProvider && backupConfig && (
                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      Automatic backups{" "}
                      <span className={backupConfig.enabled ? "text-green-600" : "text-muted-foreground"}>
                        {backupConfig.enabled ? "enabled" : "paused"}
                      </span>
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        const res = await fetch("/api/backup/config", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ enabled: !backupConfig.enabled }),
                        })
                        if (res.ok) {
                          setBackupConfig({ ...backupConfig, enabled: !backupConfig.enabled })
                        }
                      }}
                    >
                      {backupConfig.enabled ? "Pause" : "Resume"}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-muted-foreground">Frequency</label>
                    <select
                      value={backupConfig.frequency}
                      onChange={async (e) => {
                        const freq = e.target.value as BackupFrequency
                        await fetch("/api/backup/config", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ frequency: freq }),
                        })
                        setBackupConfig({ ...backupConfig, frequency: freq })
                      }}
                      className="h-8 rounded-md border bg-background px-2 text-sm"
                    >
                      <option value="hourly">Every hour</option>
                      <option value="every_6h">Every 6 hours</option>
                      <option value="every_12h">Every 12 hours</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={backupLoading}
                    onClick={async () => {
                      setBackupLoading(true)
                      try {
                        await fetch("/api/backup/run", { method: "POST" })
                        const histRes = await fetch("/api/backup/history")
                        if (histRes.ok) setBackupHistory(await histRes.json())
                      } finally {
                        setBackupLoading(false)
                      }
                    }}
                  >
                    {backupLoading ? (
                      <LoaderIcon className="mr-2 size-3.5 animate-spin" />
                    ) : (
                      <PlayIcon className="mr-2 size-3.5" />
                    )}
                    Backup Now
                  </Button>
                  {backupHistory.length > 0 && (
                    <div className="space-y-2 border-t pt-3">
                      <p className="text-sm font-medium">Recent backups</p>
                      <div className="space-y-1">
                        {backupHistory.slice(0, 5).map((run) => (
                          <div key={run.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              {run.status === "completed" ? (
                                <CheckCircleIcon className="size-3.5 text-green-600" />
                              ) : run.status === "failed" ? (
                                <XCircleIcon className="size-3.5 text-destructive" />
                              ) : (
                                <LoaderIcon className="size-3.5 animate-spin text-muted-foreground" />
                              )}
                              <span className="text-muted-foreground">
                                {new Date(run.startedAt).toLocaleDateString()}{" "}
                                {new Date(run.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">{run.filesUploaded} files</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Peer Sync */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Peer Sync</h2>
            <div className="space-y-4 rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                  <ServerIcon className="size-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{syncPeer?.displayName || "This instance"}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {syncPeer?.id ? `ID: ${syncPeer.id.slice(0, 12)}...` : "Loading..."}
                  </p>
                </div>
              </div>

              {syncPairings.length > 0 && (
                <div className="space-y-2 border-t pt-3">
                  <p className="text-sm font-medium">Paired instances</p>
                  {syncPairings.map((pairing) => (
                    <div key={pairing.id} className="flex items-center justify-between rounded-md border p-3">
                      <div>
                        <p className="text-sm font-medium">{pairing.remoteUrl}</p>
                        <p className="text-xs text-muted-foreground">
                          <span className={pairing.isActive ? "text-green-600" : "text-muted-foreground"}>
                            {pairing.isActive ? "Active" : "Inactive"}
                          </span>
                          {pairing.lastSyncAt && (
                            <> -- Last sync: {new Date(pairing.lastSyncAt).toLocaleString()}</>
                          )}
                          {" "}-- Mode: {pairing.syncMode}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          await fetch("/api/sync/settings", {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ revokePairingId: pairing.id }),
                          })
                          setSyncPairings(syncPairings.filter((p) => p.id !== pairing.id))
                        }}
                      >
                        <UnlinkIcon className="mr-2 size-3.5" />
                        Unpair
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-3 border-t pt-3">
                <p className="text-sm font-medium">Pair with another instance</p>
                <p className="text-sm text-muted-foreground">
                  Enter the URL and credentials of the remote openvlt instance to sync with.
                </p>
                <div className="space-y-2">
                  <input
                    type="url"
                    value={pairUrl}
                    onChange={(e) => setPairUrl(e.target.value)}
                    placeholder="https://other-instance.example.com:3456"
                    className="h-9 w-full rounded-md border bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={pairUsername}
                      onChange={(e) => setPairUsername(e.target.value)}
                      placeholder="Username on remote"
                      className="h-9 flex-1 rounded-md border bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                    />
                    <input
                      type="password"
                      value={pairPassword}
                      onChange={(e) => setPairPassword(e.target.value)}
                      placeholder="Password on remote"
                      className="h-9 flex-1 rounded-md border bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                    />
                  </div>
                </div>
                <Button
                  size="sm"
                  disabled={!pairUrl || !pairUsername || !pairPassword || pairingLoading}
                  onClick={async () => {
                    setPairingLoading(true)
                    try {
                      const loginRes = await fetch(`${pairUrl}/api/auth/login`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ username: pairUsername, password: pairPassword }),
                        credentials: "include",
                      })
                      if (!loginRes.ok) {
                        alert("Failed to authenticate with remote instance")
                        return
                      }
                      const reqRes = await fetch(`${pairUrl}/api/sync/pair/request`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          peerName: syncPeer?.displayName || "Unknown",
                          peerId: syncPeer?.id || "",
                          vaultName: "Vault",
                        }),
                        credentials: "include",
                      })
                      if (!reqRes.ok) {
                        alert("Pairing request failed")
                        return
                      }
                      const { pairingId } = await reqRes.json()
                      alert(`Pairing established! ID: ${pairingId.slice(0, 8)}...`)
                      const settingsRes = await fetch("/api/sync/settings")
                      if (settingsRes.ok) {
                        const data = await settingsRes.json()
                        setSyncPairings(data.pairings)
                      }
                      setPairUrl("")
                      setPairUsername("")
                      setPairPassword("")
                    } catch (err) {
                      alert(`Failed to pair: ${err instanceof Error ? err.message : "Unknown error"}`)
                    } finally {
                      setPairingLoading(false)
                    }
                  }}
                >
                  {pairingLoading ? (
                    <LoaderIcon className="mr-2 size-3.5 animate-spin" />
                  ) : (
                    <RefreshCwIcon className="mr-2 size-3.5" />
                  )}
                  Start Pairing
                </Button>
              </div>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-destructive">
              Danger Zone
            </h2>
            <div className="space-y-3 rounded-lg border border-destructive/30 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Purge Trash</label>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete all trashed notes
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={async () => {
                    const ok = await confirmDialog({
                      title: "Purge trash",
                      description: "Permanently delete ALL trashed notes? This cannot be undone.",
                      confirmLabel: "Delete all",
                      destructive: true,
                    })
                    if (!ok) return
                    await fetch("/api/notes?action=purgeTrash", {
                      method: "DELETE",
                    })
                    toast.success("Trash purged")
                  }}
                >
                  <TrashIcon className="mr-2 size-3.5" />
                  Purge Trash
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
