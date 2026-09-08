import { NextRequest, NextResponse } from "next/server"
import { validateSafeUrl } from "@/lib/security/url-guard"

export async function GET(request: NextRequest) {
  const urlParam = request.nextUrl.searchParams.get("url")
  if (!urlParam) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 })
  }

  try {
    const validation = validateSafeUrl(urlParam)
    if (!validation.isValid) {
      const isForbidden = validation.error?.includes("forbidden") || validation.error?.includes("private")
      return NextResponse.json({ error: validation.error }, { status: isForbidden ? 403 : 400 })
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
