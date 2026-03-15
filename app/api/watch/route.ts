import { NextRequest } from "next/server"
import { getSession } from "@/lib/auth/middleware"
import { getActiveVault } from "@/lib/vaults/service"
import { onVaultChange, startWatchingAllVaults } from "@/lib/watcher"

// Ensure watchers are started when this module loads
let watchersStarted = false

function ensureWatchers() {
  if (!watchersStarted) {
    watchersStarted = true
    try {
      startWatchingAllVaults()
    } catch (err) {
      console.error("[watch] failed to start watchers:", err)
      watchersStarted = false
    }
  }
}

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return new Response("Unauthorized", { status: 401 })
  }

  const vault = getActiveVault(session.user.id)
  if (!vault) {
    return new Response("No active vault", { status: 400 })
  }

  ensureWatchers()

  const encoder = new TextEncoder()
  const vaultId = vault.id

  const stream = new ReadableStream({
    start(controller) {
      // Send initial heartbeat so client knows connection is live
      controller.enqueue(encoder.encode("data: connected\n\n"))

      // Listen for changes to this user's vault
      const unsubscribe = onVaultChange((changedVaultId) => {
        if (changedVaultId === vaultId) {
          try {
            controller.enqueue(encoder.encode("data: changed\n\n"))
          } catch {
            // Stream closed
            unsubscribe()
          }
        }
      })

      // Heartbeat every 30s to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"))
        } catch {
          clearInterval(heartbeat)
          unsubscribe()
        }
      }, 30000)

      // Cleanup when client disconnects
      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat)
        unsubscribe()
        try {
          controller.close()
        } catch {
          // Already closed
        }
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}
