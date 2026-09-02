import prisma from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "all" } = await searchParams;

  let whereClause: any = {};
  if (tab === "drafts") {
    whereClause = { status: { in: ["IDEATION", "DRAFTING", "DESIGNING"] } };
  } else if (tab === "published") {
    whereClause = { status: "PUBLISHED" };
  } else if (tab === "scheduled") {
    whereClause = { status: "READY" };
  }

  const articles = await prisma.article.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
  });

  const totalCount = await prisma.article.count();
  const draftCount = await prisma.article.count({
    where: { status: { in: ["IDEATION", "DRAFTING", "DESIGNING"] } },
  });
  const publishedCount = await prisma.article.count({
    where: { status: "PUBLISHED" },
  });
  const scheduledCount = await prisma.article.count({
    where: { status: "READY" },
  });

  return (
    <div className="flex-grow p-6 md:p-10 max-w-[1100px] mx-auto w-full">
      {/* Editorial Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e8e7e0] pb-6">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono font-bold tracking-wider text-[#777777] uppercase mb-1">
            <span>EDITORIAL DESK</span>
            <span>/</span>
            <span className="text-[#c8102e]">STORIES</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#191919] tracking-tight font-sans">
            Your Stories
          </h1>
        </div>
        <Link
          href="/dashboard/article/new"
          className="px-4 py-2 bg-[#1a8917] hover:bg-[#156d12] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[16px]">edit_square</span>
          Write a story
        </Link>
      </div>

      {/* Medium-style Tabs */}
      <div className="flex items-center gap-8 border-b border-[#e8e7e0] mb-6 text-sm font-medium">
        <Link
          href="/dashboard/articles?tab=all"
          className={`pb-3 transition-colors relative ${
            tab === "all"
              ? "text-[#191919] font-bold border-b-2 border-[#191919]"
              : "text-[#777777] hover:text-[#191919]"
          }`}
        >
          All Stories <span className="text-xs text-[#888888]">({totalCount})</span>
        </Link>
        <Link
          href="/dashboard/articles?tab=drafts"
          className={`pb-3 transition-colors relative ${
            tab === "drafts"
              ? "text-[#191919] font-bold border-b-2 border-[#191919]"
              : "text-[#777777] hover:text-[#191919]"
          }`}
        >
          Drafts <span className="text-xs text-[#888888]">({draftCount})</span>
        </Link>
        <Link
          href="/dashboard/articles?tab=scheduled"
          className={`pb-3 transition-colors relative ${
            tab === "scheduled"
              ? "text-[#191919] font-bold border-b-2 border-[#191919]"
              : "text-[#777777] hover:text-[#191919]"
          }`}
        >
          Scheduled / Ready <span className="text-xs text-[#888888]">({scheduledCount})</span>
        </Link>
        <Link
          href="/dashboard/articles?tab=published"
          className={`pb-3 transition-colors relative ${
            tab === "published"
              ? "text-[#191919] font-bold border-b-2 border-[#191919]"
              : "text-[#777777] hover:text-[#191919]"
          }`}
        >
          Published <span className="text-xs text-[#888888]">({publishedCount})</span>
        </Link>
      </div>

      {/* Stories Feed */}
      <div className="divide-y divide-[#e8e7e0]">
        {articles.map((article) => {
          const wordCount = article.markdownContent ? article.markdownContent.split(/\s+/).length : 0;
          const readTime = Math.max(1, Math.ceil(wordCount / 200));

          return (
            <div
              key={article.id}
              className="py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 group"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-[#f0eee6] text-[#555555] rounded">
                    {article.contentType}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      article.status === "PUBLISHED"
                        ? "bg-[#1a8917]/10 text-[#1a8917]"
                        : article.status === "READY"
                        ? "bg-[#191919] text-white"
                        : "bg-[#edece7] text-[#666666]"
                    }`}
                  >
                    {article.status}
                  </span>
                  <span className="text-[12px] text-[#888888]">
                    {format(new Date(article.createdAt), "MMM d, yyyy")}
                  </span>
                  <span className="text-[12px] text-[#888888]">·</span>
                  <span className="text-[12px] text-[#888888]">
                    {article.contentType === "PODCAST" ? "Script" : `${readTime} min read`}
                  </span>
                </div>

                <Link
                  href={`/dashboard/article/${article.id}`}
                  className="block group-hover:text-[#1a8917] transition-colors"
                >
                  <h2 className="text-xl font-bold text-[#191919] tracking-tight line-clamp-2 mb-1">
                    {article.title || "Untitled Story"}
                  </h2>
                </Link>

                <p className="text-sm text-[#666666] font-editorial-serif line-clamp-2">
                  {article.notes || "Belum ada ringkasan atau catatan tambahan."}
                </p>

                <div className="flex items-center gap-4 mt-3 text-xs text-[#777777]">
                  {article.author && <span>Penulis: <strong>{article.author}</strong></span>}
                  {article.monetizationValue ? (
                    <span className="font-mono text-[#191919] bg-[#f0eee6] px-2 py-0.5 rounded">
                      Score: {article.monetizationValue}/100
                    </span>
                  ) : null}
                  {article.mediumUrl && (
                    <a
                      href={article.mediumUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#1a8917] hover:underline flex items-center gap-1 font-medium"
                    >
                      <span>View on Medium</span>
                      <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                <Link
                  href={`/dashboard/article/${article.id}`}
                  className="px-3.5 py-1.5 border border-[#d1d0c9] hover:border-[#191919] text-xs font-semibold rounded-lg text-[#191919] hover:bg-[#191919] hover:text-white transition-all flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[15px]">edit</span>
                  Edit Story
                </Link>
              </div>
            </div>
          );
        })}

        {articles.length === 0 && (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-[#f0eee6] text-[#777777] flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-2xl">auto_stories</span>
            </div>
            <h3 className="text-base font-bold text-[#191919]">Belum ada tulisan di tab ini</h3>
            <p className="text-xs text-[#777777] mt-1">Mulai tulis ulasan buku baru dengan klik tombol di bawah.</p>
            <Link
              href="/dashboard/article/new"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#1a8917] text-white text-xs font-semibold rounded-lg hover:bg-[#156d12] transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">edit_square</span>
              Write a story
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
