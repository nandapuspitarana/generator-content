import prisma from "@/lib/prisma"
import { MediumSyncHub } from "@/components/medium-sync-hub"

export const dynamic = "force-dynamic"

export default async function MediumSyncPage() {
  const articles = await prisma.article.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      author: true,
      contentType: true,
      status: true,
      mediumUrl: true,
      createdAt: true,
      publishedAt: true,
      markdownContent: true,
    }
  })

  return <MediumSyncHub initialArticles={articles} />
}
