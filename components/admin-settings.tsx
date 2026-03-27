"use client"

import * as React from "react"
import {
  UserPlusIcon,
  TrashIcon,
  ShieldCheckIcon,
  ShieldOffIcon,
  KeyIcon,
  CopyIcon,
  UsersIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { confirmDialog, promptDialog } from "@/lib/dialogs"
import type { User } from "@/types"

interface AdminUser extends User {
  vaultCount?: number
}

export function AdminSettingsTab() {
  const [users, setUsers] = React.useState<AdminUser[]>([])
  const [loading, setLoading] = React.useState(true)
  const [creating, setCreating] = React.useState(false)

  // New user form
  const [showForm, setShowForm] = React.useState(false)
  const [username, setUsername] = React.useState("")
  const [displayName, setDisplayName] = React.useState("")
  const [password, setPassword] = React.useState("")

  async function fetchUsers() {
    try {
      const res = await fetch("/api/admin/users")
      if (!res.ok) throw new Error("Failed to fetch users")
      const data = await res.json()
      setUsers(data.users)
    } catch {
      toast.error("Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchUsers()
  }, [])

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
          password,
          displayName: displayName.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to create user")
        return
      }
      toast.success(`User "${data.user.username}" created`)
      if (data.recoveryKey) {
        toast.info("Recovery key copied to clipboard", { duration: 5000 })
        navigator.clipboard.writeText(data.recoveryKey).catch(() => {})
      }
      setUsername("")
      setDisplayName("")
      setPassword("")
      setShowForm(false)
      fetchUsers()
    } catch {
      toast.error("Failed to create user")
    } finally {
      setCreating(false)
    }
  }

  async function handleDeleteUser(user: AdminUser) {
    const confirmed = await confirmDialog({
      title: "Delete user",
      description: `Permanently delete "${user.displayName}" (@${user.username})? This will remove all their data, vaults, and sessions.`,
      confirmLabel: "Delete",
      destructive: true,
    })
    if (!confirmed) return
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || "Failed to delete user")
        return
      }
      toast.success(`User "${user.username}" deleted`)
      fetchUsers()
    } catch {
      toast.error("Failed to delete user")
    }
  }

  async function handleToggleAdmin(user: AdminUser) {
    const action = user.isAdmin ? "remove admin from" : "make admin"
    const confirmed = await confirmDialog({
      title: user.isAdmin ? "Remove admin" : "Make admin",
      description: `${user.isAdmin ? "Remove admin privileges from" : "Grant admin privileges to"} "${user.displayName}"?`,
      confirmLabel: user.isAdmin ? "Remove" : "Grant",
      destructive: user.isAdmin,
    })
    if (!confirmed) return
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAdmin: !user.isAdmin }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || `Failed to ${action}`)
        return
      }
      toast.success(
        `${user.displayName} is ${user.isAdmin ? "no longer" : "now"} an admin`
      )
      fetchUsers()
    } catch {
      toast.error(`Failed to ${action}`)
    }
  }

  async function handleResetPassword(user: AdminUser) {
    const newPassword = await promptDialog({
      title: "Reset password",
      description: `Set a new password for "${user.displayName}" (@${user.username}). This will log them out of all sessions.`,
      placeholder: "New password (min 8 characters)",
      confirmLabel: "Reset",
      type: "password",
      validate: (v) =>
        v.length < 8 ? "Password must be at least 8 characters" : null,
    })
    if (!newPassword) return
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || "Failed to reset password")
        return
      }
      toast.success(`Password reset for ${user.username}`)
    } catch {
      toast.error("Failed to reset password")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        Loading users...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Users section */}
      <section className="space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
            <UsersIcon className="size-4 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold">Users</h3>
            <p className="text-xs text-muted-foreground">
              {users.length} user{users.length !== 1 ? "s" : ""} registered
            </p>
          </div>
          <Button
            size="sm"
            variant={showForm ? "outline" : "default"}
            onClick={() => setShowForm(!showForm)}
          >
            <UserPlusIcon className="mr-2 size-3.5" />
            {showForm ? "Cancel" : "Add User"}
          </Button>
        </div>

        {/* Create user form */}
        {showForm && (
          <div className="rounded-lg border p-4">
            <form onSubmit={handleCreateUser} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Username
                  </label>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="johndoe"
                    required
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Display Name
                  </label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Password
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                  minLength={8}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" size="sm" disabled={creating}>
                  {creating ? "Creating..." : "Create User"}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* User list */}
        <div className="rounded-lg border">
          <div className="divide-y">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-3 px-4 py-3"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium uppercase text-muted-foreground">
                  {u.displayName.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">
                      {u.displayName}
                    </p>
                    {u.isAdmin && (
                      <Badge
                        variant="secondary"
                        className="shrink-0 text-[10px] px-1.5 py-0"
                      >
                        Admin
                      </Badge>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    @{u.username} · Joined{" "}
                    {new Date(u.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => handleToggleAdmin(u)}
                    title={u.isAdmin ? "Remove admin" : "Make admin"}
                  >
                    {u.isAdmin ? (
                      <ShieldOffIcon className="size-3.5" />
                    ) : (
                      <ShieldCheckIcon className="size-3.5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => handleResetPassword(u)}
                    title="Reset password"
                  >
                    <KeyIcon className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive hover:text-destructive"
                    onClick={() => handleDeleteUser(u)}
                    title="Delete user"
                  >
                    <TrashIcon className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
