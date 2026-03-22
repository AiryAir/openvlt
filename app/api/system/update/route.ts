import { NextResponse } from "next/server"
import { exec, execSync } from "child_process"
import { requireAuth } from "@/lib/auth/middleware"

export async function POST() {
  try {
    await requireAuth()

    const appDir = process.cwd()

    // Verify git installation
    try {
      execSync("git rev-parse --git-dir", { cwd: appDir, encoding: "utf-8" })
    } catch {
      return NextResponse.json(
        { error: "Not a git installation. Cannot update from web." },
        { status: 400 }
      )
    }

    // Check if there are actually updates
    execSync("git fetch --quiet origin", {
      cwd: appDir,
      encoding: "utf-8",
      timeout: 15000,
    })

    const behind =
      parseInt(
        execSync("git rev-list --count HEAD..origin/main", {
          cwd: appDir,
          encoding: "utf-8",
        }).trim(),
        10
      ) || 0

    if (behind === 0) {
      return NextResponse.json({
        message: "Already up to date",
        success: true,
      })
    }

    // Find the openvlt CLI
    let openvltBin = ""
    try {
      openvltBin = execSync("which openvlt", {
        encoding: "utf-8",
        timeout: 5000,
      }).trim()
    } catch {
      // Fallback: check common install locations
      const home = process.env.HOME || process.env.USERPROFILE || ""
      const candidates = [
        `${home}/.openvlt/bin/openvlt`,
        "/usr/local/bin/openvlt",
      ]
      for (const c of candidates) {
        try {
          execSync(`test -x "${c}"`, { encoding: "utf-8" })
          openvltBin = c
          break
        } catch {}
      }
    }

    if (!openvltBin) {
      // Fallback: run the update steps inline
      return fallbackUpdate(appDir)
    }

    // Run `openvlt update` in the background and return immediately.
    // The CLI handles pull, install, build, and restart (via pm2).
    // Once pm2 restarts the server, the frontend will auto-reload.
    exec(`"${openvltBin}" update`, {
      cwd: appDir,
      env: { ...process.env, PATH: process.env.PATH },
    })

    return NextResponse.json({
      success: true,
      message:
        "Update started. The server will restart automatically when complete.",
      logs: [
        `Pulling ${behind} new commit${behind === 1 ? "" : "s"}...`,
        "Running openvlt update in the background...",
        "The page will reload when the server restarts.",
      ],
    })
  } catch {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    )
  }
}

/**
 * Fallback for environments where the openvlt CLI is not installed
 * (e.g. manual git clone deployments).
 */
function fallbackUpdate(appDir: string) {
  const logs: string[] = []

  try {
    logs.push("Pulling latest changes...")
    execSync("git pull --rebase origin main", {
      cwd: appDir,
      encoding: "utf-8",
      timeout: 30000,
    })
    logs.push("Pull complete.")

    logs.push("Installing dependencies...")
    execSync("bun install", {
      cwd: appDir,
      encoding: "utf-8",
      timeout: 120000,
    })
    logs.push("Dependencies installed.")

    logs.push("Building application...")
    execSync("bun run build", {
      cwd: appDir,
      encoding: "utf-8",
      timeout: 300000,
    })
    logs.push("Build complete.")

    // Copy standalone output if it exists
    try {
      execSync(
        'if [ -d ".next/standalone" ]; then cp -r .next/standalone/* . && cp -r .next/static .next/standalone/.next/static 2>/dev/null; cp -r public .next/standalone/public 2>/dev/null; fi',
        { cwd: appDir, encoding: "utf-8" }
      )
    } catch {}

    logs.push("Restarting server...")
    try {
      execSync("pm2 restart openvlt", {
        cwd: appDir,
        encoding: "utf-8",
        timeout: 10000,
      })
      logs.push("Server restarted.")
    } catch {
      logs.push(
        "Could not restart automatically. Please restart manually with: openvlt restart"
      )
    }

    return NextResponse.json({
      success: true,
      message: "Update complete. The page will reload shortly.",
      logs,
    })
  } catch (error: unknown) {
    const execError = error as {
      stderr?: string
      stdout?: string
      message?: string
    }
    const detail =
      execError.stderr?.trim() ||
      execError.stdout?.trim() ||
      execError.message ||
      "Unknown error"
    const lines = detail.split("\n").filter((l: string) => l.trim())
    const summary = lines.slice(-20).join("\n")
    logs.push(`Error:\n${summary}`)
    return NextResponse.json(
      {
        success: false,
        error:
          "Update failed. Run 'openvlt update' from the terminal to recover.",
        logs,
      },
      { status: 500 }
    )
  }
}
