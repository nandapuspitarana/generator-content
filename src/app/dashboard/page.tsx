import prisma from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";

export default async function DashboardPage() {
  const articles = await prisma.article.findMany({
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  const totalArticles = await prisma.article.count();
  const publishedArticles = await prisma.article.count({
    where: { status: "PUBLISHED" },
  });
  const scheduledArticles = await prisma.article.count({
    where: { status: "READY" },
  });

  return (
    <div className="flex-grow p-6 md:p-10 max-w-[1300px] mx-auto w-full">
      {/* Editorial Header */}
      <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between border-b border-[#e8e7e0] pb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono font-bold tracking-wider text-[#777777] uppercase mb-1">
            <span>EDITORIAL DESK</span>
            <span>/</span>
            <span className="text-[#c8102e]">OVERVIEW</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-[#191919] tracking-tight font-sans">
            Editorial Overview
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/article/new"
            className="px-4 py-2 bg-[#191919] hover:bg-[#333333] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            New Story
          </Link>
        </div>
      </div>

      {/* Swiss Bento Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Metric Cards (8 cols on lg) */}
        <section className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Content */}
          <div className="bg-white p-6 rounded-xl border border-[#e8e7e0] flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-[#777777]">
              <span className="text-[11px] font-mono font-bold tracking-wider uppercase">
                Total Stories
              </span>
              <span className="material-symbols-outlined text-[18px]">article</span>
            </div>
            <div className="mt-4">
              <span className="text-4xl md:text-5xl font-black text-[#191919] tracking-tight font-sans">
                {totalArticles}
              </span>
              <p className="text-xs text-[#888888] mt-1 font-medium">Articles & Podcasts</p>
            </div>
          </div>

          {/* Published */}
          <div className="bg-white p-6 rounded-xl border border-[#e8e7e0] flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-[#777777]">
              <span className="text-[11px] font-mono font-bold tracking-wider uppercase">
                Published
              </span>
              <span className="w-2 h-2 rounded-full bg-[#1a8917]"></span>
            </div>
            <div className="mt-4">
              <span className="text-4xl md:text-5xl font-black text-[#1a8917] tracking-tight font-sans">
                {publishedArticles}
              </span>
              <p className="text-xs text-[#888888] mt-1 font-medium">Live on Medium / Feed</p>
            </div>
          </div>

          {/* Scheduled / Ready */}
          <div className="bg-white p-6 rounded-xl border border-[#e8e7e0] flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-[#777777]">
              <span className="text-[11px] font-mono font-bold tracking-wider uppercase">
                Ready / Queue
              </span>
              <span className="material-symbols-outlined text-[18px]">schedule</span>
            </div>
            <div className="mt-4">
              <span className="text-4xl md:text-5xl font-black text-[#191919] tracking-tight font-sans">
                {scheduledArticles}
              </span>
              <p className="text-xs text-[#888888] mt-1 font-medium">Ready for broadcast</p>
            </div>
          </div>
        </section>

        {/* Schedule Mini-Panel (4 cols on lg) */}
        <section className="lg:col-span-4 bg-white p-6 rounded-xl border border-[#e8e7e0] flex flex-col shadow-xs row-span-2">
          <div className="flex items-center justify-between border-b border-[#e8e7e0] pb-3 mb-5">
            <h3 className="text-sm font-bold tracking-wide uppercase font-mono text-[#191919] flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-[#c8102e]">calendar_month</span>
              Publication Queue
            </h3>
            <Link
              href="/dashboard/calendar"
              className="text-xs font-semibold text-[#1a8917] hover:underline"
            >
              Full Calendar
            </Link>
          </div>

          <div className="flex-grow flex flex-col gap-4">
            {articles
              .filter((a) => a.status === "READY" || a.status === "PUBLISHED")
              .slice(0, 4)
              .map((article) => (
                <Link
                  key={article.id}
                  href={`/dashboard/article/${article.id}`}
                  className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-[#f4f3ef] transition-colors group"
                >
                  <div className="flex flex-col items-center justify-center w-10 h-10 rounded bg-[#f0eee6] text-[#191919] shrink-0 font-mono">
                    <span className="text-[9px] uppercase font-bold text-[#777777]">
                      {format(new Date(article.createdAt), "MMM")}
                    </span>
                    <span className="text-sm font-bold leading-none">
                      {format(new Date(article.createdAt), "dd")}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-[#191919] line-clamp-1 group-hover:text-[#1a8917] transition-colors">
                      {article.title || "Untitled Story"}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded uppercase ${
                        article.status === "PUBLISHED" 
                          ? "bg-[#1a8917]/10 text-[#1a8917]" 
                          : "bg-[#e8e7e1] text-[#555555]"
                      }`}>
                        {article.status}
                      </span>
                      <span className="text-[10px] text-[#888888] font-mono">
                        {article.contentType}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}

            {articles.filter((a) => a.status === "READY" || a.status === "PUBLISHED").length === 0 && (
              <div className="py-8 text-center text-xs text-[#888888] italic">
                Belum ada antrean jadwal konten.
              </div>
            )}
          </div>

          <Link
            href="/dashboard/calendar"
            className="mt-4 w-full py-2 border border-[#d1d0c9] rounded-lg text-xs font-semibold text-center text-[#191919] hover:bg-[#191919] hover:text-white transition-all block"
          >
            Open Schedule Calendar
          </Link>
        </section>

        {/* Recent Stories (8 cols on lg) */}
        <section className="lg:col-span-8 bg-white p-6 rounded-xl border border-[#e8e7e0] shadow-xs">
          <div className="flex items-center justify-between border-b border-[#e8e7e0] pb-4 mb-4">
            <h3 className="text-sm font-bold tracking-wide uppercase font-mono text-[#191919] flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-[#191919]">auto_stories</span>
              Recent Stories
            </h3>
            <Link
              className="text-xs font-semibold text-[#1a8917] hover:underline flex items-center gap-1"
              href="/dashboard/articles"
            >
              <span>View All</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </div>

          <div className="divide-y divide-[#f0eee6]">
            {articles.map((article) => (
              <Link
                href={`/dashboard/article/${article.id}`}
                key={article.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:bg-[#faf9f6] px-2 rounded-lg transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-[#f0eee6] text-[#555555] rounded">
                      {article.contentType}
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      article.status === 'PUBLISHED' ? 'bg-[#1a8917]/10 text-[#1a8917]' :
                      article.status === 'READY' ? 'bg-[#191919] text-white' : 'bg-[#edece7] text-[#666666]'
                    }`}>
                      {article.status}
                    </span>
                    <span className="text-[11px] text-[#888888]">
                      {format(new Date(article.createdAt), "MMM d, yyyy")}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-[#191919] group-hover:text-[#1a8917] transition-colors leading-snug line-clamp-1">
                    {article.title || "Untitled Story"}
                  </h4>
                  <p className="text-xs text-[#666666] mt-0.5 font-editorial-serif line-clamp-1">
                    {article.author ? `Karya ${article.author}` : "Penulis tidak dicantumkan"}
                  </p>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                  {article.monetizationValue ? (
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-[#f0eee6] text-[#191919]">
                      Score: {article.monetizationValue}/100
                    </span>
                  ) : null}
                  <span className="material-symbols-outlined text-[18px] text-[#aaaaaa] group-hover:text-[#191919] transition-colors">
                    chevron_right
                  </span>
                </div>
              </Link>
            ))}

            {articles.length === 0 && (
              <div className="py-12 text-center text-sm text-[#888888]">
                Belum ada konten dibuat. Mulai dengan membuat artikel pertama Anda.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
