import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { publishToMedium } from "@/lib/services/medium"
import { MediumSyncSchema } from "@/lib/validation/schemas"

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json()
    const validationResult = MediumSyncSchema.safeParse(rawBody)

    if (!validationResult.success) {
      const errorMsg = validationResult.error.issues.map(i => i.message).join(", ")
      return NextResponse.json({ error: errorMsg, details: validationResult.error.issues }, { status: 400 })
    }

    const { articleId, publishStatus, tags, publicationId, canonicalUrl, token: customToken } = validationResult.data

    const token = customToken || process.env.MEDIUM_TOKEN
    if (!token) {
      return NextResponse.json({ 
        error: "MEDIUM_TOKEN belum diatur. Harap masukkan token di formulir atau konfigurasikan di file .env." 
      }, { status: 400 })
    }

    // 1. Fetch Article from DB
    const article = await prisma.article.findUnique({
      where: { id: articleId }
    })

    if (!article) {
      return NextResponse.json({ error: "Artikel tidak ditemukan di database." }, { status: 404 })
    }

    if (!article.markdownContent) {
      return NextResponse.json({ error: "Artikel belum memiliki naskah markdown untuk dipublikasikan." }, { status: 400 })
    }

    // Default tags if not provided
    const tagsToUse = tags && tags.length > 0 
      ? tags 
      : ["book-review", "asikreview", "reading", "nonfiction"]

    // 2. Publish/Sync to Medium
    const mediumPostUrl = await publishToMedium({
      title: article.title,
      content: article.markdownContent,
      token,
      publishStatus: publishStatus || "draft",
      tags: tagsToUse,
      publicationId: publicationId || undefined,
      canonicalUrl: canonicalUrl || undefined
    })

    // 3. Update Article in DB
    const updatedArticle = await prisma.article.update({
      where: { id: articleId },
      data: {
        status: publishStatus === "public" ? "PUBLISHED" : "READY",
        mediumUrl: mediumPostUrl,
        publishedAt: new Date()
      }
    })

    return NextResponse.json({ 
      success: true, 
      url: mediumPostUrl, 
      publishStatus,
      article: updatedArticle 
    })

  } catch (error: any) {
    console.error("Medium Publish/Sync Error:", error)
    return NextResponse.json({ error: error.message || "Terjadi kesalahan internal saat sinkronisasi ke Medium." }, { status: 500 })
  }
}
