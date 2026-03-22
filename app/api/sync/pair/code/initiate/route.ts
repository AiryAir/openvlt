import { NextRequest, NextResponse } from "next/server"
import { AuthError, requireAuthWithVault } from "@/lib/auth/middleware"
import { getLocalPeer, storePairing } from "@/lib/sync/peer"

/**
 * Server-side proxy for code-based peer sync pairing.
 * Local instance calls this, which redeems the code on the remote instance.
 *
 * POST body: { remoteUrl, code }
 */
export async function POST(request: NextRequest) {
  try {
    const { vaultId } = await requireAuthWithVault()
    const body = await request.json()
    const { remoteUrl: rawUrl, code } = body

    if (!rawUrl || !code) {
      return NextResponse.json(
        { error: "remoteUrl and code are required" },
        { status: 400 }
      )
    }

    // Normalize URL: extract origin only
    let remoteUrl: string
    try {
      const parsed = new URL(rawUrl)
      remoteUrl = parsed.origin
    } catch {
      return NextResponse.json(
        { error: "Invalid URL" },
        { status: 400 }
      )
    }

    const localPeer = getLocalPeer()

    // Redeem the code on the remote instance
    let redeemRes: Response
    try {
      redeemRes = await fetch(`${remoteUrl}/api/sync/pair/code/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          peerId: localPeer.id,
          peerName: localPeer.displayName,
        }),
      })
    } catch (err) {
      return NextResponse.json(
        {
          error: `Could not reach remote instance: ${err instanceof Error ? err.message : "Connection failed"}`,
        },
        { status: 502 }
      )
    }

    const data = await redeemRes.json()

    if (!redeemRes.ok) {
      return NextResponse.json(
        { error: data.error || `Pairing failed (${redeemRes.status})` },
        { status: redeemRes.status }
      )
    }

    // Store the pairing locally
    try {
      storePairing(
        data.pairingId,
        vaultId,
        data.peerId,
        remoteUrl,
        data.sharedSecret,
        "all"
      )
    } catch (err) {
      console.error("[pair/code/initiate] Failed to store pairing:", err)
      return NextResponse.json(
        { error: "Pairing succeeded on remote but failed to save locally" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      pairingId: data.pairingId,
      remotePeerName: data.peerName,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      )
    }
    console.error("[pair/code/initiate]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
