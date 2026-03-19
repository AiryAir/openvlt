"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  ArrowLeft,
  CopyIcon,
  CheckIcon,
  Plus,
  X,
  Eye,
  EyeOff,
} from "lucide-react"
import Image from "next/image"

const TOTAL_STEPS = 5

interface AdditionalUser {
  username: string
  password: string
  displayName: string
}

export default function SetupPage() {
  const router = useRouter()
  const [step, setStep] = React.useState(1)
  const [loading, setLoading] = React.useState(false)
  const [checkingStatus, setCheckingStatus] = React.useState(true)
  const [error, setError] = React.useState("")

  // Step 2: Admin account
  const [adminDisplayName, setAdminDisplayName] = React.useState("")
  const [adminUsername, setAdminUsername] = React.useState("")
  const [adminPassword, setAdminPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [recoveryKey, setRecoveryKey] = React.useState("")
  const [copied, setCopied] = React.useState(false)

  // Step 3: Server config
  const [domain, setDomain] = React.useState("")
  const [port, setPort] = React.useState("3456")
  const [registrationOpen, setRegistrationOpen] = React.useState(false)

  // Step 4: Additional users
  const [additionalUsers, setAdditionalUsers] = React.useState<
    AdditionalUser[]
  >([])
  const [newUsername, setNewUsername] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [newDisplayName, setNewDisplayName] = React.useState("")

  // Step 5: Results
  const [configChanged, setConfigChanged] = React.useState(false)

  // Check if setup is already complete
  React.useEffect(() => {
    fetch("/api/admin/setup-status")
      .then((r) => r.json())
      .then((data) => {
        if (data.setupComplete) {
          router.replace("/login")
        } else {
          setCheckingStatus(false)
        }
      })
      .catch(() => setCheckingStatus(false))
  }, [router])

  async function handleCopy() {
    await navigator.clipboard.writeText(recoveryKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function addUser() {
    if (!newUsername.trim() || !newPassword || newPassword.length < 8) return
    setAdditionalUsers((prev) => [
      ...prev,
      {
        username: newUsername.trim(),
        password: newPassword,
        displayName: newDisplayName.trim() || newUsername.trim(),
      },
    ])
    setNewUsername("")
    setNewPassword("")
    setNewDisplayName("")
  }

  function removeUser(index: number) {
    setAdditionalUsers((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSetup() {
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/admin/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin: {
            username: adminUsername,
            password: adminPassword,
            displayName: adminDisplayName,
          },
          config: {
            domain: domain || undefined,
            port: port !== "3456" ? port : undefined,
            registrationOpen,
          },
          additionalUsers:
            additionalUsers.length > 0 ? additionalUsers : undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Setup failed")
        setLoading(false)
        return
      }

      setRecoveryKey(data.recoveryKey)
      setConfigChanged(!!(domain || port !== "3456"))
      setStep(5)
    } catch {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  function handleNext() {
    setError("")

    if (step === 2) {
      if (!adminDisplayName.trim()) {
        setError("Display name is required")
        return
      }
      if (!adminUsername.trim()) {
        setError("Username is required")
        return
      }
      if (!adminPassword || adminPassword.length < 8) {
        setError("Password must be at least 8 characters")
        return
      }
    }

    if (step === 4) {
      handleSetup()
      return
    }

    setStep((s) => Math.min(s + 1, TOTAL_STEPS))
  }

  function handleBack() {
    setError("")
    setStep((s) => Math.max(s - 1, 1))
  }

  if (checkingStatus) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <div className="size-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Progress indicator */}
      {step < 6 && (
        <div className="flex items-center justify-center gap-1.5">
          {Array.from({ length: TOTAL_STEPS - 1 }, (_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all ${
                i + 1 <= step
                  ? "w-8 bg-primary"
                  : "w-4 bg-muted-foreground/20"
              }`}
            />
          ))}
        </div>
      )}

      {/* Step 1: Welcome */}
      {step === 1 && (
        <div className="flex flex-col items-center gap-6">
          <Image
            src="/logo.svg"
            alt="openvlt"
            width={80}
            height={80}
            className="size-20"
            priority
          />
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-2xl font-semibold">Welcome to openvlt</h1>
            <p className="text-center text-sm text-muted-foreground">
              Let&apos;s set up your instance. This will only take a minute.
              You&apos;ll create your admin account, configure your vault, and
              choose your server settings.
            </p>
          </div>
          <button
            onClick={handleNext}
            className="group inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Get Started
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      )}

      {/* Step 2: Admin Account */}
      {step === 2 && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <Image
              src="/auth.svg"
              alt="openvlt"
              width={80}
              height={80}
              className="size-20"
              priority
            />
            <h1 className="text-2xl font-semibold">Create admin account</h1>
            <p className="text-center text-sm text-muted-foreground">
              This will be the administrator account for your instance.
            </p>
          </div>

          {error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="displayName" className="text-sm font-medium">
                Display name
              </label>
              <input
                id="displayName"
                type="text"
                value={adminDisplayName}
                onChange={(e) => setAdminDisplayName(e.target.value)}
                required
                className="h-9 rounded-md border bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Your Name"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="username" className="text-sm font-medium">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                required
                autoComplete="username"
                className="h-9 rounded-md border bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="admin"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="h-9 w-full rounded-md border bg-background px-3 pr-9 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Server Configuration */}
      {step === 3 && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-2xl font-semibold">Server configuration</h1>
            <p className="text-center text-sm text-muted-foreground">
              Configure your instance settings. These are all optional.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="domain" className="text-sm font-medium">
                Domain
              </label>
              <input
                id="domain"
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="h-9 rounded-md border bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="https://notes.example.com"
              />
              <p className="text-xs text-muted-foreground">
                If you&apos;re using a custom domain or reverse proxy, enter it
                here. Used for WebAuthn and link generation.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="port" className="text-sm font-medium">
                Port
              </label>
              <input
                id="port"
                type="text"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                className="h-9 rounded-md border bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="3456"
              />
            </div>

            <div className="flex items-center justify-between rounded-md border px-4 py-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">Open registration</span>
                <span className="text-xs text-muted-foreground">
                  Allow anyone to create an account on this instance
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={registrationOpen}
                onClick={() => setRegistrationOpen(!registrationOpen)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                  registrationOpen ? "bg-primary" : "bg-muted-foreground/30"
                }`}
              >
                <span
                  className={`inline-block size-4 rounded-full bg-white shadow-sm transition-transform ${
                    registrationOpen ? "translate-x-[18px]" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Changes to port or domain require a server restart to take effect.
            </p>
          </div>
        </div>
      )}

      {/* Step 4: Additional Users */}
      {step === 4 && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-2xl font-semibold">Invite users</h1>
            <p className="text-center text-sm text-muted-foreground">
              Add users now, or skip and do this later from Settings.
            </p>
          </div>

          {error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Existing list */}
          {additionalUsers.length > 0 && (
            <div className="flex flex-col gap-2">
              {additionalUsers.map((u, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {u.displayName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      @{u.username}
                    </span>
                  </div>
                  <button
                    onClick={() => removeUser(i)}
                    className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add user form */}
          <div className="flex flex-col gap-3 rounded-md border p-3">
            <input
              type="text"
              value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
              className="h-8 rounded-md border bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Display name"
            />
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="h-8 rounded-md border bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Username"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="h-8 rounded-md border bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Password (min 8 chars)"
            />
            <button
              type="button"
              onClick={addUser}
              disabled={
                !newUsername.trim() || !newPassword || newPassword.length < 8
              }
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border bg-background px-3 text-sm font-medium hover:bg-muted disabled:opacity-40"
            >
              <Plus className="size-3.5" />
              Add user
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Complete */}
      {step === 5 && (
        <div className="flex flex-col items-center gap-6">
          <Image
            src="/unlocked.svg"
            alt="openvlt"
            width={80}
            height={80}
            className="size-20"
            priority
          />
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-2xl font-semibold">You&apos;re all set</h1>
            <p className="text-center text-sm text-muted-foreground">
              Your openvlt instance is ready to use.
            </p>
          </div>

          {/* Recovery key */}
          {recoveryKey && (
            <div className="w-full">
              <p className="mb-2 text-sm font-medium">
                Save your recovery key
              </p>
              <p className="mb-3 text-xs text-muted-foreground">
                Store this key somewhere safe. You will need it to recover your
                account if you forget your password.
              </p>
              <div className="relative rounded-md border bg-muted p-4 pr-12">
                <code className="break-all text-sm">{recoveryKey}</code>
                <button
                  onClick={handleCopy}
                  className="absolute right-2 top-2 rounded-md p-1.5 hover:bg-background"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <CheckIcon className="size-4 text-green-600" />
                  ) : (
                    <CopyIcon className="size-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
          )}

          {configChanged && (
            <div className="w-full rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                You changed the port or domain. Restart the server for changes
                to take effect.
              </p>
            </div>
          )}

          <button
            onClick={() => router.push("/notes")}
            className="group inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Go to openvlt
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      )}

      {/* Navigation buttons (steps 2-5) */}
      {step >= 2 && step <= 4 && (
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading
              ? "Setting up..."
              : step === 4
                ? "Complete setup"
                : "Continue"}
            {!loading && <ArrowRight className="size-4" />}
          </button>
        </div>
      )}
    </div>
  )
}
