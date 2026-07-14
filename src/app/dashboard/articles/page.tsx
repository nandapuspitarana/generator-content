import prisma from "@/lib/prisma"
import Link from "next/link"
import { format } from "date-fns"

export default async function ArticlesPage() {
  const articles = await prisma.article.findMany({
    orderBy: { createdAt: "desc" }
  })

  return (
    <div className="flex-grow p-5 md:p-10 max-w-[1400px] mx-auto w-full">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-on-surface m-0 tracking-tight">
            Articles
          </h2>
          <p className="mt-2 text-sm text-secondary">Manage and view all your generated articles and podcast scripts.</p>
        </div>
        <Link
          href="/dashboard/article/new"
          className="py-2 px-4 bg-primary text-on-primary rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-base">add</span>
          New Article
        </Link>
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                <th className="py-3 px-6 text-xs font-semibold text-secondary uppercase tracking-wider">Content</th>
                <th className="py-3 px-6 text-xs font-semibold text-secondary uppercase tracking-wider">Type</th>
                <th className="py-3 px-6 text-xs font-semibold text-secondary uppercase tracking-wider">Status</th>
                <th className="py-3 px-6 text-xs font-semibold text-secondary uppercase tracking-wider">Date</th>
                <th className="py-3 px-6 text-xs font-semibold text-secondary uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {articles.map((article) => (
                <tr key={article.id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-on-surface">{article.title || "Untitled"}</span>
                      <span className="text-xs text-secondary mt-1">{article.author || "No author"}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded bg-secondary/10 text-secondary">
                      <span className="material-symbols-outlined text-[14px]">
                        {article.contentType === 'PODCAST' ? 'mic' : 'article'}
                      </span>
                      {article.contentType}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium
                      ${article.status === 'PUBLISHED' ? 'bg-primary/10 text-primary' : 
                        article.status === 'READY' ? 'bg-green-500/10 text-green-600' :
                        'bg-surface-variant text-on-surface-variant'}
                    `}>
                      {article.status}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm text-secondary">
                      {format(new Date(article.createdAt), "dd MMM yyyy")}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <Link
                      href={`/dashboard/article/${article.id}`}
                      className="text-primary hover:underline text-sm font-medium"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
              {articles.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-secondary text-sm">
                    No articles found. Create your first one!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
