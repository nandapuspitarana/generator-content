import prisma from "@/lib/prisma"
import Link from "next/link"
import { CrawlerButton } from "@/components/crawler-button"

export default async function DiscoveryPage() {
  const trends = await prisma.socialTrend.findMany({
    orderBy: { engagement: 'desc' }
  });

  return (
    <div className="flex-1 p-6 md:p-10 max-w-[1300px] mx-auto w-full">
      {/* Editorial Header */}
      <div className="mb-8 border-b border-[#e8e7e0] pb-6">
        <div className="flex items-center gap-2 text-[11px] font-mono font-bold tracking-wider text-[#777777] uppercase mb-1">
          <span>MARKET INTELLIGENCE</span>
          <span>/</span>
          <span className="text-[#c8102e]">DISCOVERY</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-[#191919] tracking-tight font-sans">
          Audience Discovery & Content Trends
        </h1>
        <p className="text-xs text-[#666666] mt-1 font-editorial-serif">
          Pantau diskusi dan pertanyaan audiens di komunitas Facebook & LinkedIn untuk menemukan topik ulasan yang diminati pasar.
        </p>
      </div>

      {/* Crawler Engine Control Card */}
      <div className="bg-white p-6 rounded-xl border border-[#e8e7e0] mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        <div className="flex gap-4 items-start">
          <div className="w-10 h-10 rounded-lg bg-[#191919] text-white flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">travel_explore</span>
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#191919]">Social Media Crawler Engine</h2>
            <p className="text-xs text-[#777777] mt-0.5">
              Cari kata kunci buku atau topik bisnis untuk mengekstrak pain point dan minat baca audiens secara real-time.
            </p>
          </div>
        </div>
        <div className="shrink-0">
          <CrawlerButton />
        </div>
      </div>

      {/* Discovered Trends Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {trends.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 px-4 text-center bg-white border border-dashed border-[#d1d0c9] rounded-xl">
            <span className="material-symbols-outlined text-4xl text-[#aaaaaa] mb-3">forum</span>
            <p className="text-sm text-[#191919] font-bold">Belum ada data trend tersimpan</p>
            <p className="text-xs text-[#777777] mt-1">Gunakan tombol "Crawl New Trends" di atas untuk mencari peluang konten baru.</p>
          </div>
        ) : trends.map((trend) => (
          <div key={trend.id} className="bg-white rounded-xl border border-[#e8e7e0] p-6 flex flex-col justify-between shadow-xs hover:border-[#191919] transition-all group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                  trend.platform === 'FACEBOOK' ? 'bg-[#1877F2]/10 text-[#1877F2]' : 'bg-[#0A66C2]/10 text-[#0A66C2]'
                }`}>
                  {trend.platform}
                </span>
                <span className="text-[10px] font-mono font-bold text-[#191919] bg-[#f0eee6] px-2 py-0.5 rounded">
                  {trend.engagement} interactions
                </span>
              </div>
              <p className="text-xs font-bold text-[#191919] mb-2">{trend.author || "Community Post"}</p>
              <blockquote className="text-xs text-[#444444] font-editorial-serif italic line-clamp-4 pl-3 border-l-2 border-[#191919] leading-relaxed">
                "{trend.content}"
              </blockquote>
            </div>
            
            <div className="mt-6 pt-4 border-t border-[#f0eee6]">
              <Link 
                href={`/?notes=${encodeURIComponent("Tolong fokus buat artikel yang menjawab pertanyaan audiens ini: " + trend.content)}`} 
                className="w-full inline-flex justify-center items-center gap-1.5 bg-[#191919] text-white py-2 px-3 rounded-lg text-xs font-semibold hover:bg-[#333333] transition-colors shadow-xs"
              >
                <span className="material-symbols-outlined text-[15px]">auto_stories</span> 
                Create Story for This
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
