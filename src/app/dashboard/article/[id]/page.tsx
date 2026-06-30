import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"
import { ArticleEditor } from "@/components/article-editor"

export default async function ArticleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const article = await prisma.article.findUnique({
    where: { id },
    include: { assets: true }
  })

  if (!article) return notFound()

  return <ArticleEditor initialArticle={article} />
}
