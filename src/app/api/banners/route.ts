import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const banners = await prisma.banner.findMany({
      orderBy: { updatedAt: "desc" },
    })
    return NextResponse.json(banners)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const banner = await prisma.banner.create({
      data: {
        name: body.name || "Untitled Banner",
        format: body.format || "MEDIUM",
        template: body.template || "classic",
        title: body.title || "",
        author: body.author || "",
        genre: body.genre || "",
        badgeText: body.badgeText || "",
        tags: body.tags || "",
        imageUrl: body.imageUrl || "",
      },
    })
    return NextResponse.json(banner, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
