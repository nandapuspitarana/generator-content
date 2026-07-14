import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")
  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 })
  }

  try {
    const res = await fetch(url)
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch image" }, { status: res.status })
    }

    const contentType = res.headers.get("content-type") || "image/jpeg"
    const buffer = await res.arrayBuffer()

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch" }, { status: 500 })
  }
}
