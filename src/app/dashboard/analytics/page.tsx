import prisma from "@/lib/prisma"
import Link from "next/link"

export default async function AnalyticsPage() {
  const articles = await prisma.article.findMany({
    where: { monetizationValue: { gt: 0 } },
    orderBy: { monetizationValue: 'desc' }
  });

  const avgScore = articles.length > 0 
    ? articles.reduce((acc, a) => acc + (a.monetizationValue || 0), 0) / articles.length 
    : 0;

  return (
    <div className="flex-1 p-6 md:p-10 max-w-[1200px] mx-auto w-full">
      {/* Editorial Header */}
      <div className="mb-8 border-b border-[#e8e7e0] pb-6">
        <div className="flex items-center gap-2 text-[11px] font-mono font-bold tracking-wider text-[#777777] uppercase mb-1">
          <span>INTELLIGENCE & REVENUE</span>
          <span>/</span>
          <span className="text-[#c8102e]">MONETIZATION</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-[#191919] tracking-tight font-sans">
          Monetization Analytics
        </h1>
        <p className="text-xs text-[#666666] mt-1 font-editorial-serif">
          Skor konversi afiliasi dan rekomendasi Call-to-Action yang dievaluasi otomatis oleh AI Evaluator Agent.
        </p>
      </div>

      {/* Swiss Metric Scorecards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="bg-white p-6 rounded-xl border border-[#e8e7e0] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#777777]">
            <span className="text-[11px] font-mono font-bold tracking-wider uppercase">Average Score</span>
            <span className="material-symbols-outlined text-[18px]">analytics</span>
          </div>
          <div className="mt-4">
            <span className="text-4xl md:text-5xl font-black text-[#191919] tracking-tight font-sans">
              {Math.round(avgScore)}
            </span>
            <span className="text-sm font-mono text-[#888888]">/100</span>
            <p className="text-xs text-[#888888] mt-1">Average conversion potential</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-[#e8e7e0] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#777777]">
            <span className="text-[11px] font-mono font-bold tracking-wider uppercase">Evaluated Stories</span>
            <span className="material-symbols-outlined text-[18px]">verified</span>
          </div>
          <div className="mt-4">
            <span className="text-4xl md:text-5xl font-black text-[#1a8917] tracking-tight font-sans">
              {articles.length}
            </span>
            <p className="text-xs text-[#888888] mt-1">Articles analyzed by Evaluator</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-[#e8e7e0] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#777777]">
            <span className="text-[11px] font-mono font-bold tracking-wider uppercase">Top Opportunity</span>
            <span className="material-symbols-outlined text-[18px] text-[#c8102e]">trending_up</span>
          </div>
          <div className="mt-4 min-w-0">
            <p className="text-base font-bold text-[#191919] truncate leading-tight">
              {articles[0]?.title || "-"}
            </p>
            <p className="text-xs text-[#888888] mt-1 font-mono">
              {articles[0]?.monetizationValue ? `Score: ${articles[0].monetizationValue}/100` : "No articles yet"}
            </p>
          </div>
        </div>
      </div>

      {/* Evaluation Table */}
      <div className="bg-white rounded-xl border border-[#e8e7e0] overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-[#e8e7e0] bg-[#faf9f6]">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#191919]">
            AI Feedback & Conversion Audit
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#e8e7e0] text-[#777777] font-mono font-bold uppercase">
                <th className="px-6 py-3">Story Title</th>
                <th className="px-6 py-3">Score</th>
                <th className="px-6 py-3">AI Evaluator Suggestion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0eee6]">
              {articles.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-xs text-[#888888] italic">
                    Belum ada artikel yang dievaluasi. Jalankan AI Workflow pada artikel untuk mendapatkan audit skor.
                  </td>
                </tr>
              ) : articles.map((article) => {
                const suggestion = article.notes && article.notes.includes('[AI Evaluator Suggestion]:') 
                  ? article.notes.split('[AI Evaluator Suggestion]:')[1] 
                  : '-';
                return (
                  <tr key={article.id} className="hover:bg-[#faf9f6] transition-colors">
                    <td className="px-6 py-4 max-w-[280px]">
                      <Link href={`/dashboard/article/${article.id}`} className="font-bold text-[#191919] hover:text-[#1a8917] transition-colors line-clamp-2">
                        {article.title}
                      </Link>
                      <span className="text-[10px] text-[#888888] mt-0.5 block">{article.author || "No author"}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-mono font-bold rounded ${
                        (article.monetizationValue || 0) >= 80 ? 'bg-[#1a8917]/10 text-[#1a8917]' :
                        (article.monetizationValue || 0) >= 60 ? 'bg-[#191919] text-white' : 'bg-[#ffdad6] text-[#ba1a1a]'
                      }`}>
                        {article.monetizationValue}/100
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[#555555] font-editorial-serif leading-relaxed max-w-lg">
                      {suggestion}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
