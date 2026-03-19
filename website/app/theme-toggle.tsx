"use client"

import { useEffect, useState } from "react"
import { Sun, Moon, Monitor } from "lucide-react"

type Theme = "light" | "dark" | "auto"

function applyTheme(theme: Theme) {
  const isDark =
    theme === "dark" ||
    (theme === "auto" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)
  document.documentElement.classList.toggle("dark", isDark)
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("auto")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("openvlt-theme") as Theme | null
    if (stored === "light" || stored === "dark") {
      setTheme(stored)
    }
    setMounted(true)

    // Listen for system preference changes when in auto mode
    const mql = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => {
      const current = localStorage.getItem("openvlt-theme") as Theme | null
      if (!current || current === "auto") {
        applyTheme("auto")
      }
    }
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  function cycle() {
    const order: Theme[] = ["auto", "light", "dark"]
    const next = order[(order.indexOf(theme) + 1) % order.length]
    setTheme(next)
    localStorage.setItem("openvlt-theme", next)
    applyTheme(next)
  }

  if (!mounted) {
    return (
      <button className="flex size-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]">
        <Monitor className="size-3.5" />
      </button>
    )
  }

  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor
  const label =
    theme === "light" ? "Light" : theme === "dark" ? "Dark" : "Auto"

  return (
    <button
      onClick={cycle}
      title={`Theme: ${label}`}
      className="flex size-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--card-bg)] hover:text-[var(--text-primary)]"
    >
      <Icon className="size-3.5" />
    </button>
  )
}
