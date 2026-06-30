import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const banner = await prisma.banner.findUnique({ where: { id } })
    if (!banner) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(banner)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const banner = await prisma.banner.update({
      where: { id },
      data: {
        name: body.name,
        format: body.format,
        template: body.template,
        title: body.title,
        author: body.author,
        genre: body.genre,
        badgeText: body.badgeText,
        tags: body.tags,
        imageUrl: body.imageUrl,
        elements: body.elements,
        backgroundColor: body.backgroundColor,
      },
    })
    return NextResponse.json(banner)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.banner.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
