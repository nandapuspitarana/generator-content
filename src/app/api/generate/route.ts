import { NextResponse } from "next/server"
import { generateContent } from "@/lib/services/llm"
import { QuickGenerateSchema } from "@/lib/validation/schemas"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validationResult = QuickGenerateSchema.safeParse(body)

    if (!validationResult.success) {
      const errorMsg = validationResult.error.issues.map(i => i.message).join(", ")
      return NextResponse.json(
        { error: errorMsg, details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { title, author, notes, affiliateLink, imageUrl } = validationResult.data
    const result = await generateContent({ 
      title, 
      author, 
      notes: notes || undefined, 
      affiliateLink: affiliateLink || undefined, 
      imageUrl: imageUrl || undefined 
    })
    
    return NextResponse.json(result)
  } catch (error: any) {
    console.error("API /api/generate Error:", error)
    return NextResponse.json(
      { error: error.message || "Gagal memproses request. Silakan coba lagi." },
      { status: 500 }
    )
  }
}
