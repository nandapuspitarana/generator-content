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
    <div className="flex-1 p-5 md:p-10 max-w-[1400px] mx-auto w-full">
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-on-surface m-0 tracking-tight">Analytics</h2>
        <p className="text-sm text-secondary mt-1">Evaluasi performa konversi afiliasi konten Anda yang dianalisis oleh AI.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">monetization_on</span>
          </div>
          <div>
            <p className="text-sm font-medium text-secondary">Rata-rata Skor Afiliasi</p>
            <p className="text-3xl font-semibold text-on-surface tracking-tight mt-1">
              {Math.round(avgScore)}<span className="text-lg text-secondary font-medium">/100</span>
            </p>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-tertiary/10 text-tertiary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">analytics</span>
          </div>
          <div>
            <p className="text-sm font-medium text-secondary">Artikel Dievaluasi</p>
            <p className="text-3xl font-semibold text-on-surface tracking-tight mt-1">{articles.length}</p>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#1c1c1c]/10 text-[#1c1c1c] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">trending_up</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-secondary">Artikel Paling Potensial</p>
            <p className="text-lg font-semibold text-on-surface mt-1 truncate">{articles[0]?.title || "-"}</p>
          </div>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant">
          <h3 className="text-lg font-semibold text-on-surface">Detail Evaluasi AI</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                <th className="px-6 py-3 text-xs font-semibold text-secondary uppercase tracking-wider">Judul Buku</th>
                <th className="px-6 py-3 text-xs font-semibold text-secondary uppercase tracking-wider">Skor Afiliasi</th>
                <th className="px-6 py-3 text-xs font-semibold text-secondary uppercase tracking-wider">Saran AI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {articles.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-sm text-secondary">
                    Belum ada artikel yang dievaluasi. Generate artikel terlebih dahulu.
                  </td>
                </tr>
              ) : articles.map((article) => {
                const suggestion = article.notes && article.notes.includes('[AI Evaluator Suggestion]:') 
                  ? article.notes.split('[AI Evaluator Suggestion]:')[1] 
                  : '-';
                return (
                  <tr key={article.id} className="hover:bg-surface-container-lowest/50 transition-colors">
                    <td className="px-6 py-4 max-w-[250px]">
                      <Link href={`/dashboard/article/${article.id}`} className="text-sm font-semibold text-primary hover:underline line-clamp-2">
                        {article.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-md ${
                        (article.monetizationValue || 0) >= 80 ? 'bg-primary/10 text-primary' :
                        (article.monetizationValue || 0) >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {article.monetizationValue}/100
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant max-w-md truncate">
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
