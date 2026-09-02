import { NextRequest, NextResponse } from "next/server"

function isPrivateIpOrHost(hostname: string): boolean {
  const lower = hostname.toLowerCase()
  if (lower === "localhost" || lower === "127.0.0.1" || lower === "0.0.0.0" || lower === "::1") return true
  if (lower === "169.254.169.254" || lower === "metadata.google.internal") return true // Cloud metadata endpoints
  
  // Private IPv4 ranges
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(lower)) return true
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(lower)) return true
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(lower)) return true

  return false
}

export async function GET(request: NextRequest) {
  const urlParam = request.nextUrl.searchParams.get("url")
  if (!urlParam) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 })
  }

  try {
    const parsed = new URL(urlParam)
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return NextResponse.json({ error: "Invalid protocol. Only http and https are allowed." }, { status: 400 })
    }

    if (isPrivateIpOrHost(parsed.hostname)) {
      return NextResponse.json({ error: "Access to private or internal addresses is forbidden." }, { status: 403 })
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    const res = await fetch(urlParam, { 
      signal: controller.signal,
      headers: {
        "User-Agent": "AsikReview-Proxy/2.0"
      }
    })
    clearTimeout(timeoutId)

    if (!res.ok) {
      return NextResponse.json({ error: `Remote server responded with ${res.status}` }, { status: res.status })
    }

    const contentType = res.headers.get("content-type") || ""
    if (!contentType.startsWith("image/") && !contentType.startsWith("application/octet-stream")) {
      return NextResponse.json({ error: "Remote resource is not a valid image format." }, { status: 415 })
    }

    const buffer = await res.arrayBuffer()

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType || "image/jpeg",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (error: any) {
    if (error.name === "AbortError") {
      return NextResponse.json({ error: "Image fetch request timed out." }, { status: 504 })
    }
    return NextResponse.json({ error: error.message || "Failed to fetch image" }, { status: 500 })
  }
}
