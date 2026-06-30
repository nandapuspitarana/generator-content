import prisma from "@/lib/prisma"
import Link from "next/link"
import { CrawlerButton } from "@/components/crawler-button"

export default async function DiscoveryPage() {
  const trends = await prisma.socialTrend.findMany({
    orderBy: { engagement: 'desc' }
  });

  return (
    <div className="flex-1 p-5 md:p-10 max-w-[1400px] mx-auto w-full">
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-on-surface m-0 tracking-tight">Discovery & Peluang Monetisasi</h2>
        <p className="text-sm text-secondary mt-1">Cari tahu audiens yang sedang mencari rekomendasi buku di Facebook Group dan LinkedIn.</p>
      </div>

      <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex gap-4 items-start">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">travel_explore</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-on-surface">Social Media Crawler Engine</h3>
            <p className="text-sm text-secondary mt-1">Terintegrasi dengan Apify API. Cari berdasarkan topik (contoh: bisnis, novel).</p>
          </div>
        </div>
        <div className="shrink-0">
          <CrawlerButton />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {trends.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 px-4 text-center bg-surface-container-lowest border border-dashed border-outline-variant rounded-xl">
            <span className="material-symbols-outlined text-5xl text-secondary opacity-30 mb-4">group</span>
            <p className="text-sm text-on-surface font-medium">Belum ada data hasil crawling.</p>
            <p className="text-xs text-secondary mt-1">Silakan masukkan kata kunci dan mulai crawling di atas.</p>
          </div>
        ) : trends.map((trend) => (
          <div key={trend.id} className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 flex flex-col justify-between group hover:border-primary transition-colors">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 ${
                  trend.platform === 'FACEBOOK' ? 'bg-[#1877F2]/10 text-[#1877F2]' : 'bg-[#0A66C2]/10 text-[#0A66C2]'
                }`}>
                  <span className="material-symbols-outlined text-[14px]">
                    {trend.platform === 'FACEBOOK' ? 'groups' : 'work'}
                  </span>
                  {trend.platform}
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-tertiary bg-tertiary/10 px-2.5 py-1 rounded-md">
                  <span className="material-symbols-outlined text-[14px]">trending_up</span>
                  {trend.engagement} Interaksi
                </div>
              </div>
              <p className="text-sm font-semibold text-on-surface mb-2">{trend.author || "Anonymous"}</p>
              <p className="text-sm text-on-surface-variant italic line-clamp-4 relative pl-3 border-l-2 border-outline-variant">
                "{trend.content}"
              </p>
            </div>
            
            <div className="mt-6 pt-4 border-t border-outline-variant">
              <Link href={`/?notes=${encodeURIComponent("Tolong fokus buat artikel yang menjawab pertanyaan audiens ini: " + trend.content)}`} 
                    className="w-full inline-flex justify-center items-center gap-2 bg-surface text-on-surface border border-outline-variant py-2.5 px-4 rounded-lg text-sm font-semibold hover:bg-surface-container transition-colors">
                <span className="material-symbols-outlined text-base text-primary">bolt</span> 
                Buat Artikel untuk Ini
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
