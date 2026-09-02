import prisma from "@/lib/prisma"
import Link from "next/link"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday } from "date-fns"

export default async function ScheduleCalendarPage() {
  const articles = await prisma.article.findMany({
    orderBy: { createdAt: 'desc' }
  });

  const scheduledArticles = articles.filter(a => a.status === 'READY' || a.status === 'PUBLISHED');
  const unscheduledArticles = articles.filter(a => a.status === 'IDEATION' || a.status === 'DRAFTING' || a.status === 'DESIGNING');

  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  const days = eachDayOfInterval({
    start: monthStart,
    end: monthEnd
  });

  const startingDayIndex = getDay(monthStart);

  return (
    <div className="flex-1 p-6 md:p-10 max-w-[1300px] mx-auto w-full flex flex-col lg:flex-row gap-8">
      {/* Calendar Section */}
      <section className="flex-1 flex flex-col">
        <div className="flex justify-between items-end mb-8 border-b border-[#e8e7e0] pb-6">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-mono font-bold tracking-wider text-[#777777] uppercase mb-1">
              <span>PLANNING & SCHEDULE</span>
              <span>/</span>
              <span className="text-[#c8102e]">CALENDAR</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#191919] tracking-tight font-sans">
              {format(today, 'MMMM yyyy')}
            </h1>
          </div>
          <div className="text-xs font-mono font-bold text-[#888888] bg-[#f0eee6] px-3 py-1.5 rounded">
            {scheduledArticles.length} SCHEDULED
          </div>
        </div>

        {/* Swiss Calendar Grid */}
        <div className="flex-1 flex flex-col bg-white rounded-xl overflow-hidden border border-[#e8e7e0] shadow-xs">
          {/* Days Header */}
          <div className="grid grid-cols-7 border-b border-[#e8e7e0] bg-[#faf9f6]">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
              <div key={day} className="py-3 text-center text-[10px] font-mono font-bold text-[#777777] tracking-wider">
                {day}
              </div>
            ))}
          </div>

          {/* Grid Body */}
          <div className="grid grid-cols-7 gap-px bg-[#e8e7e0] flex-1">
            {Array.from({ length: startingDayIndex }).map((_, index) => (
              <div key={`empty-${index}`} className="bg-[#faf9f6]/50 min-h-[110px] p-2"></div>
            ))}

            {days.map((day) => {
              const dayArticles = scheduledArticles.filter(a => {
                const dateToUse = a.scheduledAt || a.createdAt;
                return format(new Date(dateToUse), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
              });

              const isCurrentDay = isToday(day);

              return (
                <div 
                  key={day.toString()} 
                  className={`bg-white min-h-[110px] p-2.5 flex flex-col transition-colors ${
                    isCurrentDay ? 'ring-2 ring-[#191919] ring-inset z-10' : ''
                  }`}
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <span className={`text-xs font-mono font-bold ${
                      isCurrentDay ? 'bg-[#191919] text-white w-5 h-5 rounded-full flex items-center justify-center' : 'text-[#555555]'
                    }`}>
                      {format(day, 'd')}
                    </span>
                    {dayArticles.length > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1a8917]"></span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1 overflow-y-auto max-h-[70px] no-scrollbar">
                    {dayArticles.map(article => (
                      <Link 
                        key={article.id} 
                        href={`/dashboard/article/${article.id}`}
                        className={`text-[10px] font-semibold px-2 py-1 rounded truncate transition-colors leading-tight ${
                          article.status === 'PUBLISHED' 
                            ? 'bg-[#1a8917]/10 text-[#1a8917] hover:bg-[#1a8917]/20' 
                            : 'bg-[#f0eee6] text-[#191919] hover:bg-[#191919] hover:text-white'
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
      <aside className="w-full lg:w-80 flex flex-col">
        <div className="bg-white rounded-xl p-6 border border-[#e8e7e0] shadow-xs flex flex-col h-full">
          <div className="flex items-center justify-between border-b border-[#e8e7e0] pb-3 mb-4">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#191919] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#777777]">draft</span>
              Unscheduled Drafts
            </h2>
            <span className="bg-[#f0eee6] text-[#191919] px-2 py-0.5 rounded text-[10px] font-mono font-bold">
              {unscheduledArticles.length}
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar max-h-[550px]">
            {unscheduledArticles.length === 0 ? (
              <p className="text-xs text-[#888888] italic py-8 text-center">
                Semua artikel sudah terjadwal atau dipublikasikan.
              </p>
            ) : (
              unscheduledArticles.map(article => (
                <Link 
                  href={`/dashboard/article/${article.id}`}
                  key={article.id}
                  className="block bg-[#faf9f6] p-3.5 border border-[#e8e7e0] rounded-lg hover:border-[#191919] transition-all group"
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="bg-[#e8e7e1] text-[#555555] px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase">
                      {article.contentType}
                    </span>
                    <span className="text-[10px] text-[#888888] font-mono">
                      {format(new Date(article.createdAt), "MMM d")}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-[#191919] group-hover:text-[#1a8917] transition-colors line-clamp-2">
                    {article.title || 'Untitled Story'}
                  </h3>
                  <p className="text-[11px] text-[#777777] mt-1 line-clamp-1 font-editorial-serif">
                    {article.author ? `Oleh ${article.author}` : "Tanpa nama penulis"}
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>
      </aside>
    </div>
  )
}
