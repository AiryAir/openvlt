"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ArrowRightIcon, LoaderIcon } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [focused, setFocused] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Login failed")
        return
      }

      setSuccess(true)
      router.push("/notes")
    } catch {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header with mascot */}
      <div className="flex items-center justify-center gap-4">
        <div className={`shrink-0 transition-transform duration-300 ${error ? "animate-[shake_0.5s_ease-in-out]" : ""}`}>
          <Image
            src={success ? "/unlocked.svg" : error ? "/incorrect.svg" : "/auth.svg"}
            alt="openvlt"
            width={72}
            height={72}
            className="size-[72px] drop-shadow-[0_0_20px_rgba(var(--primary),0.15)]"
            priority
          />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Sign in to{" "}
            <span className="text-primary">openvlt</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your credentials to continue
          </p>
        </div>
      </div>

      {/* Card */}
      <div className="rounded-xl border bg-card/50 p-6 shadow-lg shadow-black/5 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
              <span className="size-1.5 shrink-0 rounded-full bg-destructive" />
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="username"
              className={`text-sm font-medium transition-colors ${focused === "username" ? "text-primary" : ""}`}
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onFocus={() => setFocused("username")}
              onBlur={() => setFocused(null)}
              required
              autoComplete="username"
              className="h-10 rounded-lg border bg-background/50 px-3 text-sm transition-all placeholder:text-muted-foreground/50 focus-visible:border-primary/50 focus-visible:bg-background focus-visible:shadow-[0_0_0_3px] focus-visible:shadow-primary/10 focus-visible:outline-none"
              placeholder="username"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className={`text-sm font-medium transition-colors ${focused === "password" ? "text-primary" : ""}`}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocused("password")}
              onBlur={() => setFocused(null)}
              required
              autoComplete="current-password"
              className="h-10 rounded-lg border bg-background/50 px-3 text-sm transition-all placeholder:text-muted-foreground/50 focus-visible:border-primary/50 focus-visible:bg-background focus-visible:shadow-[0_0_0_3px] focus-visible:shadow-primary/10 focus-visible:outline-none"
              placeholder="********"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative mt-1 flex h-10 items-center justify-center gap-2 overflow-hidden rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:shadow-lg hover:shadow-primary/30 hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
          >
            {loading ? (
              <>
                <LoaderIcon className="size-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign in
                <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </form>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <a
          href="/register"
          className="font-medium text-primary transition-colors hover:text-primary/80 hover:underline hover:underline-offset-4"
        >
          Register
        </a>
      </p>
    </div>
  )
}
