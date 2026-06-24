import { NextResponse } from "next/server"
import { generateContent } from "@/lib/services/llm"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, author, notes, affiliateLink, imageUrl } = body

    if (!title || !author) {
      return NextResponse.json(
        { error: "Judul Buku dan Penulis wajib diisi." },
        { status: 400 }
      )
    }

    const result = await generateContent({ title, author, notes, affiliateLink, imageUrl })
    
    return NextResponse.json(result)
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json(
      { error: "Gagal memproses request. Silakan coba lagi." },
      { status: 500 }
    )
  }
}
