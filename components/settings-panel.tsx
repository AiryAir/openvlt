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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { User } from "@/types"

export function SettingsPanel() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [user, setUser] = React.useState<User | null>(null)
  const [versionRetention, setVersionRetention] = React.useState("365")
  const [attachmentRetention, setAttachmentRetention] = React.useState("7")

  React.useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setUser(data?.user ?? null))
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
    const current = prompt("Current password:")
    if (!current) return
    const newPass = prompt("New password:")
    if (!newPass) return
    const confirm = prompt("Confirm new password:")
    if (newPass !== confirm) {
      alert("Passwords don't match")
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
                    if (
                      !confirm(
                        "Permanently delete ALL trashed notes? This cannot be undone."
                      )
                    )
                      return
                    await fetch("/api/notes?action=purgeTrash", {
                      method: "DELETE",
                    })
                    alert("Trash purged")
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
