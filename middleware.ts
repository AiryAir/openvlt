import { NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  // In production, reject plain HTTP requests (require HTTPS)
  if (process.env.NODE_ENV === "production") {
    const proto = request.headers.get("x-forwarded-proto") || "https"
    if (proto === "http") {
      // Redirect to HTTPS
      const httpsUrl = request.nextUrl.clone()
      httpsUrl.protocol = "https:"
      return NextResponse.redirect(httpsUrl, 301)
    }

    // Add HSTS header to all production responses
    const response = NextResponse.next()
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    )
    return response
  }

  return NextResponse.next()
}

export const config = {
  // Run on all routes except static files and Next.js internals
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|fonts|sw.js|manifest.json).*)"],
}
