import { NextRequest, NextResponse } from "next/server"
import { getMediumProfile, getMediumPublications } from "@/lib/services/medium"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const urlToken = req.nextUrl.searchParams.get("token")
    const token = urlToken || process.env.MEDIUM_TOKEN

    if (!token) {
      return NextResponse.json({
        configured: false,
        message: "MEDIUM_TOKEN belum dikonfigurasi di server maupun parameter request.",
        profile: null,
        publications: []
      })
    }

    const profile = await getMediumProfile(token)
    const publications = await getMediumPublications(token, profile.id)

    return NextResponse.json({
      configured: true,
      hasEnvToken: Boolean(process.env.MEDIUM_TOKEN),
      profile,
      publications
    })
  } catch (error: any) {
    console.error("GET /api/medium/status Error:", error)
    return NextResponse.json({
      configured: false,
      error: error.message || "Gagal menghubungkan ke Medium API. Periksa token Anda.",
      profile: null,
      publications: []
    }, { status: 200 }) // Return 200 with status info so UI can render connection state gracefully
  }
}
