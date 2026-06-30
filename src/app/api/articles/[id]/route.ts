import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json()
    const { title, author, markdownContent, notes, affiliateLink, imageUrl, scheduledAt, status } = body

    const updated = await prisma.article.update({
      where: { id },
      data: {
        title,
        author,
        markdownContent,
        notes,
        affiliateLink,
        imageUrl,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        status: status || 'IDEATION'
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
