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
        ...(body.name !== undefined && { name: body.name }),
        ...(body.format !== undefined && { format: body.format }),
        ...(body.template !== undefined && { template: body.template }),
        ...(body.title !== undefined && { title: body.title }),
        ...(body.author !== undefined && { author: body.author }),
        ...(body.genre !== undefined && { genre: body.genre }),
        ...(body.badgeText !== undefined && { badgeText: body.badgeText }),
        ...(body.tags !== undefined && { tags: body.tags }),
        ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl }),
        ...(body.elements !== undefined && { elements: body.elements }),
        ...(body.backgroundColor !== undefined && { backgroundColor: body.backgroundColor }),
        ...(body.backgroundImage !== undefined && { backgroundImage: body.backgroundImage }),
        ...(body.backgroundImageOpacity !== undefined && { backgroundImageOpacity: body.backgroundImageOpacity }),
        ...(body.backgroundBlendMode !== undefined && { backgroundBlendMode: body.backgroundBlendMode }),
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
