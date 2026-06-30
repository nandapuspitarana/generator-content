import prisma from "@/lib/prisma"
import Link from "next/link"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday } from "date-fns"

export default async function ScheduleCalendarPage() {
  const articles = await prisma.article.findMany({
    orderBy: { createdAt: 'desc' }
  });

  const scheduledArticles = articles.filter(a => a.status === 'READY' || a.status === 'PUBLISHED');
  const unscheduledArticles = articles.filter(a => a.status === 'IDEATION' || a.status === 'DRAFTING' || a.status === 'DESIGNING');

  // Calendar logic
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const startDate = monthStart;
  const endDate = monthEnd;

  const days = eachDayOfInterval({
    start: startDate,
    end: endDate
  });

  const startingDayIndex = getDay(startDate);

  return (
    <div className="flex-1 p-5 md:p-10 max-w-[1400px] mx-auto w-full flex flex-col lg:flex-row gap-6">
      {/* Calendar Section */}
      <section className="flex-1 flex flex-col">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-semibold text-on-surface tracking-tight">{format(today, 'MMMM yyyy')}</h2>
            <p className="text-sm text-secondary mt-1">Content Schedule</p>
          </div>
          <div className="flex gap-2">
            <button className="p-2 border border-outline-variant rounded-lg hover:bg-surface-container transition-colors text-on-surface flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">chevron_left</span>
            </button>
            <button className="p-2 border border-outline-variant rounded-lg hover:bg-surface-container transition-colors text-on-surface flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 flex flex-col bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant shadow-sm">
          {/* Days Header */}
          <div className="grid grid-cols-7 border-b border-outline-variant bg-surface-container-low">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="py-3 text-center text-xs font-semibold text-secondary uppercase tracking-wider">{day}</div>
            ))}
          </div>

          {/* Grid Body */}
          <div className="grid grid-cols-7 gap-px bg-surface-variant border-t border-surface-variant flex-1">
            {Array.from({ length: startingDayIndex }).map((_, index) => (
              <div key={`empty-${index}`} className="bg-surface text-outline min-h-[120px] p-3 flex flex-col"></div>
            ))}

            {days.map((day, dayIdx) => {
              const dayArticles = scheduledArticles.filter(a => {
                // For simplicity, match by created date if scheduledAt is missing
                const dateToUse = a.scheduledAt || a.createdAt;
                return format(new Date(dateToUse), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
              });

              return (
                <div key={day.toString()} className={`bg-surface-container-lowest min-h-[120px] p-3 flex flex-col ${isToday(day) ? 'ring-2 ring-primary ring-inset' : ''}`}>
                  <span className={`text-sm font-medium mb-2 ${isToday(day) ? 'text-primary' : 'text-on-surface'}`}>{format(day, 'd')}</span>
                  <div className="flex flex-col gap-1 overflow-y-auto max-h-[80px] no-scrollbar">
                    {dayArticles.map(article => (
                      <Link 
                        key={article.id} 
                        href={`/dashboard/article/${article.id}`}
                        className={`text-xs px-2 py-1 rounded truncate transition-colors ${
                          article.status === 'PUBLISHED' 
                            ? 'bg-primary/10 text-primary hover:bg-primary/20' 
                            : 'bg-surface-variant text-on-surface-variant hover:bg-surface-container-highest'
                        }`}
                        title={article.title}
                      >
                        {article.title || 'Untitled'}
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Sidebar: Unscheduled Drafts */}
      <aside className="w-full lg:w-80 flex flex-col gap-6">
        <div className="bg-surface-container-lowest rounded-xl p-6 h-full border border-outline-variant shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-on-surface tracking-tight">Drafts</h3>
            <span className="bg-surface-variant text-on-surface-variant px-2.5 py-0.5 rounded-full text-xs font-semibold">
              {unscheduledArticles.length}
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {unscheduledArticles.length === 0 ? (
              <p className="text-sm text-secondary italic">Tidak ada draft yang belum dijadwalkan.</p>
            ) : (
              unscheduledArticles.map(article => (
                <Link 
                  href={`/dashboard/article/${article.id}`}
                  key={article.id}
                  className="block bg-surface p-4 border border-outline-variant rounded-lg hover:border-primary transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-surface-container-high text-secondary px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase">
                      {article.contentType}
                    </span>
                    <span className="bg-tertiary/10 text-tertiary px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase">
                      {article.status}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-on-surface mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {article.title || 'Untitled'}
                  </h4>
                  <div className="flex items-center gap-2 text-secondary">
                    <span className="material-symbols-outlined text-[14px]">person</span>
                    <span className="text-xs">{article.author || 'No Author'}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </aside>
    </div>
  )
}
