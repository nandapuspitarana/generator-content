import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const token = process.env.MEDIUM_TOKEN
    if (!token) {
      return NextResponse.json({ error: "MEDIUM_TOKEN is not configured in the server." }, { status: 500 })
    }

    const body = await req.json()
    const { articleId } = body

    if (!articleId) {
      return NextResponse.json({ error: "articleId is required." }, { status: 400 })
    }

    // 1. Fetch Article from DB
    const article = await prisma.article.findUnique({
      where: { id: articleId }
    })

    if (!article) {
      return NextResponse.json({ error: "Article not found." }, { status: 404 })
    }

    if (!article.markdownContent) {
      return NextResponse.json({ error: "Article has no markdown content to publish." }, { status: 400 })
    }

    // 2. Fetch Medium User Details
    const meRes = await fetch("https://api.medium.com/v1/me", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      }
    })

    if (!meRes.ok) {
      const err = await meRes.text()
      console.error("Medium API /me Error:", err)
      return NextResponse.json({ error: "Failed to authenticate with Medium. Check your integration token." }, { status: 500 })
    }

    const meData = await meRes.json()
    const authorId = meData.data.id

    // 3. Publish to Medium
    const postPayload = {
      title: article.title,
      contentFormat: "markdown",
      content: article.markdownContent,
      publishStatus: "draft"
    }

    const postRes = await fetch(`https://api.medium.com/v1/users/${authorId}/posts`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(postPayload)
    })

    if (!postRes.ok) {
      const err = await postRes.text()
      console.error("Medium API /posts Error:", err)
      return NextResponse.json({ error: "Failed to publish post to Medium." }, { status: 500 })
    }

    const postData = await postRes.json()
    const mediumUrl = postData.data.url

    // 4. Update Article in DB
    const updatedArticle = await prisma.article.update({
      where: { id: articleId },
      data: {
        status: "PUBLISHED",
        mediumUrl: mediumUrl,
        publishedAt: new Date()
      }
    })

    return NextResponse.json({ success: true, url: mediumUrl, article: updatedArticle })

  } catch (error: any) {
    console.error("Medium Publish Error:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}
