import { NextRequest, NextResponse } from "next/server"
import {
  redeemPairingCode,
  checkPairingCodeRateLimit,
  recordPairingCodeAttempt,
} from "@/lib/sync/peer"

/**
 * Redeem a pairing code. Called by a remote peer's server (no auth required).
 * The 6-digit code is the authentication.
 */
export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown"

    // Rate limit check
    if (!checkPairingCodeRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many failed attempts. Try again later." },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { code, peerId, peerName } = body

    if (!code || !peerId) {
      return NextResponse.json(
        { error: "code and peerId are required" },
        { status: 400 }
      )
    }

    const result = redeemPairingCode(code, peerId, peerName || "")

    if (!result) {
      recordPairingCodeAttempt(ip, false)
      return NextResponse.json(
        { error: "Invalid or expired pairing code" },
        { status: 401 }
      )
    }

    recordPairingCodeAttempt(ip, true)

    return NextResponse.json({
      pairingId: result.pairingId,
      sharedSecret: result.sharedSecret,
      peerId: result.localPeerId,
      peerName: result.localPeerName,
    })
  } catch (error) {
    console.error("[pair/code/redeem]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
