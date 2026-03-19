"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { CopyIcon, CheckIcon } from "lucide-react"
import Image from "next/image"

export default function RegisterPage() {
  const router = useRouter()
  const [username, setUsername] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [displayName, setDisplayName] = React.useState("")
  const [error, setError] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [recoveryKey, setRecoveryKey] = React.useState("")
  const [copied, setCopied] = React.useState(false)
  const [blocked, setBlocked] = React.useState(false)
  const [checking, setChecking] = React.useState(true)

  // Check setup status and registration policy
  React.useEffect(() => {
    fetch("/api/admin/setup-status")
      .then((r) => r.json())
      .then((data) => {
        if (!data.setupComplete) {
          router.replace("/setup")
          return
        }
        if (!data.registrationOpen) {
          setBlocked(true)
        }
        setChecking(false)
      })
      .catch(() => setChecking(false))
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, displayName }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Registration failed")
        return
      }

      setRecoveryKey(data.recoveryKey)
    } catch {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(recoveryKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleContinue() {
    router.push("/login")
  }

  if (checking) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <div className="size-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
      </div>
    )
  }

  if (blocked) {
    return (
      <div className="flex flex-col items-center gap-6">
        <Image
          src="/incorrect.svg"
          alt="openvlt"
          width={80}
          height={80}
          className="size-20"
          priority
        />
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-2xl font-semibold">Registration disabled</h1>
          <p className="text-center text-sm text-muted-foreground">
            Registration is not available on this instance. Contact your
            administrator to get an account.
          </p>
        </div>
        <a
          href="/login"
          className="h-9 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Go to login
        </a>
      </div>
    )
  }

  if (recoveryKey) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2">
          <Image
            src="/unlocked.svg"
            alt="openvlt"
            width={80}
            height={80}
            className="size-20"
            priority
          />
          <h1 className="text-2xl font-semibold">Save your recovery key</h1>
          <p className="text-center text-sm text-muted-foreground">
            Store this key somewhere safe. You will need it to recover your
            account if you forget your password.
          </p>
        </div>

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

        <button
          onClick={handleContinue}
          className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          I&apos;ve saved my key — continue to login
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2">
        <Image
          src={error ? "/incorrect.svg" : "/auth.svg"}
          alt="openvlt"
          width={80}
          height={80}
          className="size-20"
          priority
        />
        <h1 className="text-2xl font-semibold">Create your account</h1>
        <p className="text-sm text-muted-foreground">
          Set up your openvlt vault
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label htmlFor="displayName" className="text-sm font-medium">
            Display name
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
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
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            className="h-9 rounded-md border bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder="username"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="h-9 rounded-md border bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder="At least 8 characters"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <a href="/login" className="text-primary underline-offset-4 hover:underline">
          Sign in
        </a>
      </p>
    </div>
  )
}
