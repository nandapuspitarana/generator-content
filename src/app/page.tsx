import Link from "next/link"

const FEATURES = [
  {
    index: "01",
    icon: "auto_awesome",
    title: "Multi-Agent AI Pipeline",
    desc: "Five specialized AI agents collaborate — Researcher, Outliner, Writer, Critic, and Editor — to produce publication-ready book reviews with editorial depth.",
  },
  {
    index: "02",
    icon: "article",
    title: "Swiss Editorial Studio",
    desc: "Distraction-free Markdown editor with live banner preview. Dual-panel layout inspired by Medium's reading experience and Swiss grid typography.",
  },
  {
    index: "03",
    icon: "mic",
    title: "AI Podcast Generator",
    desc: "Convert any book review into a structured podcast script. Choose episode length, tone, and format — then export for your preferred hosting platform.",
  },
  {
    index: "04",
    icon: "sync_alt",
    title: "Medium Sync Engine",
    desc: "Publish directly to Medium from your editorial dashboard. One-click sync with full content preservation, tags, and canonical URL management.",
  },
  {
    index: "05",
    icon: "travel_explore",
    title: "Trend Discovery",
    desc: "Monitor social media trends and viral book discussions. Crawl signals, score engagement, and generate timely content briefs from what's happening now.",
  },
  {
    index: "06",
    icon: "menu_book",
    title: "Knowledge Base",
    desc: "Upload PDF books and build a semantic knowledge archive. The AI indexes chapters for precise, citation-aware content generation.",
  },
]

const WORKFLOW_STEPS = [
  { num: "01", label: "Input", desc: "Add book title, author, and editorial notes." },
  { num: "02", label: "Generate", desc: "5 AI agents draft, critique, and refine the review." },
  { num: "03", label: "Design", desc: "Live banner rendered in Medium 16:9 and Instagram 1:1." },
  { num: "04", label: "Publish", desc: "Sync to Medium or export as Markdown + podcast script." },
]

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#faf9f6] text-[#191919] font-sans antialiased">
      {/* ─── Sticky Nav ─── */}
      <header className="sticky top-0 z-50 bg-[#faf9f6]/90 backdrop-blur-sm border-b border-[#e8e7e0]">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-[#191919] text-white flex items-center justify-center font-bold text-sm tracking-tight">
              AR
            </div>
            <div className="leading-none">
              <span className="font-bold text-[15px] text-[#191919] tracking-tight flex items-center gap-1">
                AsikReview<span className="text-[#c8102e] font-black text-[10px]">●</span>
              </span>
              <span className="text-[10px] text-[#888888] uppercase tracking-wider font-semibold">Editorial Studio</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-[13px] text-[#555555] font-medium">
            <a href="#features" className="hover:text-[#191919] transition-colors">Features</a>
            <a href="#workflow" className="hover:text-[#191919] transition-colors">How It Works</a>
            <Link
              href="/dashboard"
              className="ml-2 px-4 py-2 bg-[#191919] hover:bg-[#333333] text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[15px]">login</span>
              Open Dashboard
            </Link>
          </nav>

          <Link
            href="/dashboard"
            className="md:hidden px-3 py-1.5 bg-[#191919] text-white rounded-md text-xs font-semibold"
          >
            Dashboard →
          </Link>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24 md:pt-28 md:pb-32">
        <div className="grid md:grid-cols-12 gap-10 items-center">
          {/* Left: Copy */}
          <div className="md:col-span-7">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f0eee6] border border-[#e2e0d8] text-[11px] font-mono font-semibold text-[#555555] mb-6">
              <span className="w-2 h-2 rounded-full bg-[#c8102e] animate-pulse"></span>
              SWISS EDITORIAL SYSTEM · AI CONTENT ENGINE
            </div>
            <h1 className="text-5xl md:text-[3.75rem] font-bold tracking-[-0.03em] text-[#191919] leading-[1.08] font-sans mb-5">
              The editorial studio<br />
              for book reviewers.
            </h1>
            <p className="text-[1.075rem] text-[#555555] leading-[1.75] max-w-xl font-editorial-serif mb-8">
              Multi-agent AI drafts your review, designs the banner, and syncs it to Medium — 
              while you focus on having a distinctive point of view.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard"
                className="px-6 py-3 bg-[#191919] hover:bg-[#333333] text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">dashboard</span>
                Enter Dashboard
              </Link>
              <Link
                href="/dashboard/article/new"
                className="px-6 py-3 bg-white hover:bg-[#f4f3ef] text-[#191919] rounded-lg text-sm font-semibold border border-[#d1d0c9] transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">edit_square</span>
                Write a Review
              </Link>
            </div>
            <p className="mt-5 text-[11.5px] text-[#999999] font-mono">
              No account required · Local-first · AI-powered
            </p>
          </div>

          {/* Right: Visual accent - Swiss editorial card */}
          <div className="md:col-span-5 hidden md:block">
            <div className="bg-white border border-[#e8e7e0] rounded-2xl p-6 shadow-sm relative overflow-hidden">
              {/* Swiss red accent bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#c8102e]" />
              
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded bg-[#191919] text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-[15px]">auto_awesome</span>
                </div>
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-wider text-[#888888]">AI Agents · Status</p>
                  <p className="text-[13px] font-bold text-[#191919]">5 Agents Active</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5 text-[11px] text-[#1a8917] font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#1a8917]"></span>
                  Online
                </div>
              </div>

              {[
                { name: "01 · Researcher", status: "✓ Complete", color: "#1a8917" },
                { name: "02 · Outliner", status: "✓ Complete", color: "#1a8917" },
                { name: "03 · Writer", status: "↻ Running", color: "#191919" },
                { name: "04 · Critic", status: "⋯ Waiting", color: "#999999" },
                { name: "05 · Editor", status: "⋯ Waiting", color: "#999999" },
              ].map((agent) => (
                <div key={agent.name} className="flex items-center justify-between py-2.5 border-b border-[#f0eee6] last:border-none">
                  <span className="text-[12.5px] font-mono text-[#444444]">{agent.name}</span>
                  <span className="text-[11px] font-semibold" style={{ color: agent.color }}>{agent.status}</span>
                </div>
              ))}

              <div className="mt-5 pt-4 border-t border-[#e8e7e0]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-mono text-[#888888] uppercase tracking-wide">Progress</span>
                  <span className="text-[11px] font-bold text-[#191919]">48%</span>
                </div>
                <div className="h-1.5 bg-[#f0eee6] rounded-full overflow-hidden">
                  <div className="h-full bg-[#191919] rounded-full" style={{ width: "48%" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Hairline Divider ─── */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="border-t border-[#e8e7e0]" />
      </div>

      {/* ─── Features Grid ─── */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20 md:py-28">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#c8102e] mb-2">CAPABILITIES</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#191919] tracking-tight">
              Everything in one studio.
            </h2>
          </div>
          <Link
            href="/dashboard"
            className="hidden md:flex items-center gap-1.5 text-[13px] font-semibold text-[#191919] hover:text-[#c8102e] transition-colors"
          >
            Explore →
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[#e8e7e0] border border-[#e8e7e0] rounded-xl overflow-hidden">
          {FEATURES.map((f) => (
            <div key={f.index} className="bg-[#faf9f6] p-6 flex flex-col gap-3 hover:bg-white transition-colors">
              <div className="flex items-start justify-between">
                <div className="w-9 h-9 rounded-lg bg-[#f0eee6] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[19px] text-[#444444]">{f.icon}</span>
                </div>
                <span className="text-[11px] font-mono font-bold text-[#c8102e]">{f.index}</span>
              </div>
              <h3 className="text-[15px] font-bold text-[#191919] tracking-tight leading-snug">{f.title}</h3>
              <p className="text-[13px] text-[#666666] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Workflow ─── */}
      <section id="workflow" className="bg-[#191919] py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-12">
            <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#c8102e] mb-2">HOW IT WORKS</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              From idea to publication<br className="hidden md:block" /> in four steps.
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WORKFLOW_STEPS.map((step, i) => (
              <div key={step.num} className="relative">
                {i < WORKFLOW_STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-5 left-full w-full h-px bg-[#333333] z-0" style={{ width: "calc(100% + 24px)", left: "calc(100% - 12px)" }} />
                )}
                <div className="relative z-10">
                  <div className="w-10 h-10 rounded-full bg-[#c8102e] text-white flex items-center justify-center font-bold text-xs font-mono mb-4">
                    {step.num}
                  </div>
                  <h3 className="text-[15px] font-bold text-white mb-1.5 tracking-tight">{step.label}</h3>
                  <p className="text-[13px] text-[#888888] leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-14 pt-10 border-t border-[#2a2a2a] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <p className="text-white font-bold text-lg tracking-tight">Ready to start writing?</p>
              <p className="text-[#888888] text-sm mt-1">Open your editorial dashboard and start your first review.</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="px-5 py-2.5 bg-white hover:bg-[#f0eee6] text-[#191919] rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[17px]">dashboard</span>
                Open Dashboard
              </Link>
              <Link
                href="/dashboard/article/new"
                className="px-5 py-2.5 bg-[#c8102e] hover:bg-[#a30d26] text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[17px]">edit_square</span>
                Write Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats Bar ─── */}
      <section className="border-y border-[#e8e7e0] py-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "5", label: "AI Agents" },
              { value: "16:9", label: "Banner Formats" },
              { value: "1-click", label: "Medium Sync" },
              { value: "∞", label: "Stories" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-4xl font-bold text-[#191919] tracking-tight font-sans">{stat.value}</p>
                <p className="text-[12px] text-[#888888] font-mono uppercase tracking-wider mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded bg-[#191919] text-white flex items-center justify-center font-bold text-[10px]">
            AR
          </div>
          <span className="text-[12px] text-[#888888]">© 2026 AsikReview Editorial Studio</span>
        </div>
        <div className="flex items-center gap-5 text-[12px] text-[#888888] font-medium">
          <Link href="/dashboard" className="hover:text-[#191919] transition-colors">Dashboard</Link>
          <Link href="/dashboard/articles" className="hover:text-[#191919] transition-colors">Articles</Link>
          <Link href="/dashboard/medium-sync" className="hover:text-[#191919] transition-colors">Medium Sync</Link>
          <Link href="/dashboard/knowledge" className="hover:text-[#191919] transition-colors">Knowledge Base</Link>
        </div>
      </footer>
    </main>
  )
}
