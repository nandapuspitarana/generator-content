import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { publishToMedium } from "@/lib/services/medium"
import { MediumBatchSyncSchema } from "@/lib/validation/schemas"

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json()
    const validationResult = MediumBatchSyncSchema.safeParse(rawBody)

    if (!validationResult.success) {
      const errorMsg = validationResult.error.issues.map(i => i.message).join(", ")
      return NextResponse.json({ error: errorMsg, details: validationResult.error.issues }, { status: 400 })
    }

    const { articleIds, publishStatus, tags, token: customToken } = validationResult.data
    const token = customToken || process.env.MEDIUM_TOKEN

    if (!token) {
      return NextResponse.json({ 
        error: "MEDIUM_TOKEN belum diatur. Harap masukkan token di formulir atau konfigurasikan di file .env." 
      }, { status: 400 })
    }

    const articles = await prisma.article.findMany({
      where: {
        id: { in: articleIds },
        markdownContent: { not: null }
      }
    })

    if (articles.length === 0) {
      return NextResponse.json({ error: "Tidak ada artikel dengan konten naskah valid yang ditemukan." }, { status: 404 })
    }

    const results: Array<{ id: string; title: string; success: boolean; url?: string; error?: string }> = []

    for (const article of articles) {
      try {
        const mediumUrl = await publishToMedium({
          title: article.title,
          content: article.markdownContent!,
          token,
          publishStatus,
          tags: tags || ["book-review", "asikreview"]
        })

        await prisma.article.update({
          where: { id: article.id },
          data: {
            status: publishStatus === "public" ? "PUBLISHED" : "READY",
            mediumUrl,
            publishedAt: new Date()
          }
        })

        results.push({ id: article.id, title: article.title, success: true, url: mediumUrl })
      } catch (err: any) {
        results.push({ id: article.id, title: article.title, success: false, error: err.message })
      }
    }

    const successCount = results.filter(r => r.success).length
    return NextResponse.json({
      success: true,
      total: articles.length,
      successCount,
      failedCount: articles.length - successCount,
      results
    })
  } catch (error: any) {
    console.error("Medium Batch Sync Error:", error)
    return NextResponse.json({ error: error.message || "Gagal memproses batch sync ke Medium" }, { status: 500 })
  }
}
