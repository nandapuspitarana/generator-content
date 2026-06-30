import prisma from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";

export default async function DashboardPage() {
  const articles = await prisma.article.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const totalArticles = await prisma.article.count();
  const publishedArticles = await prisma.article.count({
    where: { status: "PUBLISHED" },
  });
  const scheduledArticles = await prisma.article.count({
    where: { status: "READY" },
  });

  return (
    <div className="flex-grow p-5 md:p-10 max-w-[1400px] mx-auto w-full">
      <div className="md:hidden mb-8">
        <h2 className="text-3xl font-semibold text-on-surface m-0 tracking-tight">
          Overview
        </h2>
      </div>

      <div className="hidden md:flex items-center mb-8">
        <h2 className="text-3xl font-semibold text-on-surface m-0 tracking-tight">
          Overview
        </h2>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Metrics (Spans 8 cols on lg) */}
        <section className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-2 h-fit">
          {/* Metric Card 1 */}
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant flex flex-col justify-between min-h-[140px]">
            <div className="flex items-center gap-2 text-secondary mb-2">
              <span className="material-symbols-outlined text-[20px]">
                article
              </span>
              <span className="text-sm font-medium tracking-wide">
                Total Content
              </span>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-5xl font-semibold text-on-surface tracking-tight">
                {totalArticles}
              </span>
            </div>
          </div>
          {/* Metric Card 2 */}
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant flex flex-col justify-between min-h-[140px]">
            <div className="flex items-center gap-2 text-secondary mb-2">
              <span className="material-symbols-outlined text-[20px]">
                publish
              </span>
              <span className="text-sm font-medium tracking-wide">
                Published
              </span>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-5xl font-semibold text-on-surface tracking-tight">
                {publishedArticles}
              </span>
            </div>
          </div>
          {/* Metric Card 3 */}
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant flex flex-col justify-between min-h-[140px]">
            <div className="flex items-center gap-2 text-secondary mb-2">
              <span className="material-symbols-outlined text-[20px]">
                schedule
              </span>
              <span className="text-sm font-medium tracking-wide">
                Scheduled
              </span>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-5xl font-semibold text-on-surface tracking-tight">
                {scheduledArticles}
              </span>
            </div>
          </div>
        </section>

        {/* Upcoming Schedule (Spans 4 cols on lg) */}
        <section className="lg:col-span-4 bg-surface-container-low p-6 rounded-xl row-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-medium text-on-surface m-0">
              Schedule
            </h3>
            <Link
              href="/dashboard/calendar"
              className="text-secondary hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined">more_horiz</span>
            </Link>
          </div>
          <div className="flex-grow flex flex-col gap-6">
            {articles
              .filter((a) => a.status === "READY" || a.status === "PUBLISHED")
              .slice(0, 3)
              .map((article) => (
                <div key={article.id} className="flex gap-4 group cursor-pointer">
                  <div className="flex flex-col items-center min-w-[40px]">
                    <span className="text-sm font-medium text-secondary">
                      {format(new Date(article.createdAt), "MMM")}
                    </span>
                    <span className="text-2xl font-medium text-on-surface leading-none mt-1">
                      {format(new Date(article.createdAt), "dd")}
                    </span>
                  </div>
                  <div className="flex-grow border-l-2 border-primary pl-4 py-1">
                    <h4 className="text-sm font-medium text-on-surface mb-1 group-hover:text-primary transition-colors">
                      {article.title || "Untitled Article"}
                    </h4>
                    <p className="text-xs text-secondary">
                      {article.status === "PUBLISHED" ? "Published" : "Scheduled"}
                    </p>
                  </div>
                </div>
              ))}
            {articles.filter((a) => a.status === "READY" || a.status === "PUBLISHED").length === 0 && (
              <p className="text-sm text-secondary italic">No upcoming scheduled items.</p>
            )}
          </div>
          <Link
            href="/dashboard/calendar"
            className="mt-6 w-full py-2 px-4 border border-outline-variant rounded-lg text-sm font-medium text-center text-on-surface hover:bg-surface-container transition-colors block"
          >
            View Full Calendar
          </Link>
        </section>

        {/* Recent Drafts (Spans 8 cols on lg) */}
        <section className="lg:col-span-8 mt-8 lg:mt-0">
          <div className="flex items-center justify-between mb-6 border-b border-outline-variant pb-4">
            <h3 className="text-2xl font-medium text-on-surface m-0">
              Recent Content
            </h3>
            <Link
              className="text-sm font-medium text-primary hover:underline"
              href="/dashboard/calendar"
            >
              View All
            </Link>
          </div>
          <div className="flex flex-col gap-4">
            {articles.map((article) => (
              <Link
                href={`/dashboard/article/${article.id}`}
                key={article.id}
                className="flex gap-4 p-4 rounded-xl hover:bg-surface-container-lowest transition-colors group cursor-pointer border border-transparent hover:border-outline-variant"
              >
                <div className="w-24 h-24 rounded-lg bg-surface-variant overflow-hidden shrink-0 hidden sm:flex items-center justify-center text-secondary group-hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-4xl">
                    {article.contentType === "PODCAST" ? "mic" : "article"}
                  </span>
                </div>
                <div className="flex flex-col justify-center flex-grow">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-surface-container text-on-surface text-xs rounded-md font-medium">
                      {article.status}
                    </span>
                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md font-medium">
                      {article.contentType}
                    </span>
                    <span className="text-xs text-secondary">
                      {format(new Date(article.createdAt), "MMM d, yyyy")}
                    </span>
                  </div>
                  <h4 className="text-xl font-medium text-on-surface mb-1 group-hover:text-primary transition-colors">
                    {article.title || "Untitled"}
                  </h4>
                  <p className="text-sm text-secondary line-clamp-1">
                    {article.author ? `By ${article.author}` : "No author specified"}
                  </p>
                </div>
              </Link>
            ))}
            {articles.length === 0 && (
              <p className="text-sm text-secondary italic">No content generated yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
