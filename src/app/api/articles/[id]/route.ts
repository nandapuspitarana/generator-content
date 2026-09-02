import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { ArticleInputSchema } from "@/lib/validation/schemas"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json()
    const validationResult = ArticleInputSchema.partial().safeParse(body)

    if (!validationResult.success) {
      const errorMsg = validationResult.error.issues.map(i => i.message).join(", ")
      return NextResponse.json({ error: errorMsg, details: validationResult.error.issues }, { status: 400 })
    }

    const { title, author, markdownContent, notes, affiliateLink, imageUrl, scheduledAt, status, knowledgeTagSlug } = validationResult.data

    const updated = await prisma.article.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(author !== undefined && { author }),
        ...(markdownContent !== undefined && { markdownContent }),
        ...(notes !== undefined && { notes }),
        ...(affiliateLink !== undefined && { affiliateLink }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(knowledgeTagSlug !== undefined && { knowledgeTagSlug }),
        ...(scheduledAt !== undefined && { scheduledAt: scheduledAt ? new Date(scheduledAt) : null }),
        ...(status !== undefined && { status: status || 'IDEATION' })
      }
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error("PUT /api/articles/[id] Error:", error)
    return NextResponse.json(
      { error: "Gagal menyimpan artikel: " + error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.article.delete({
      where: { id }
    })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: "Gagal menghapus artikel: " + error.message },
      { status: 500 }
    )
  }
}
