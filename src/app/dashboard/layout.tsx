"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ReactNode } from "react";

function NavLink({
  href,
  icon,
  label,
  badge,
  exact = false,
}: {
  href: string;
  icon: string;
  label: string;
  badge?: string;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  return (
    <li>
      <Link
        href={href}
        className={`group flex items-center justify-between px-3 py-2.5 rounded-lg text-[13.5px] font-medium transition-all duration-150 ${
          isActive
            ? "bg-[#191919] text-white shadow-sm"
            : "text-[#555555] hover:text-[#191919] hover:bg-[#f0eee6]"
        }`}
      >
        <div className="flex items-center gap-3">
          <span className={`material-symbols-outlined text-[19px] ${isActive ? "text-white" : "text-[#777777] group-hover:text-[#191919]"}`}>
            {icon}
          </span>
          <span>{label}</span>
        </div>
        {badge && (
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
            isActive ? "bg-white/20 text-white" : "bg-[#e8e7e1] text-[#666666]"
          }`}>
            {badge}
          </span>
        )}
      </Link>
    </li>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-[#faf9f6] text-[#191919] min-h-screen flex">
      {/* SideNavBar (Desktop md+) */}
      <nav className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 border-r border-[#e8e7e0] p-5 bg-[#faf9f6] z-40">
        {/* Brand Header */}
        <div className="mb-8 pt-1">
          <Link href="/dashboard" className="inline-flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-md bg-[#191919] text-white flex items-center justify-center font-bold text-sm tracking-tighter">
              AR
            </div>
            <div>
              <h1 className="font-bold text-[15px] text-[#191919] m-0 tracking-tight leading-none flex items-center gap-1">
                AsikReview<span className="text-[#c8102e] font-black text-xs">●</span>
              </h1>
              <p className="text-[11px] text-[#777777] m-0 mt-0.5 uppercase tracking-wider font-semibold">
                Editorial Studio
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation Sections */}
        <div className="flex-grow overflow-y-auto custom-scrollbar flex flex-col gap-6 pr-1">
          <div>
            <div className="text-[10.5px] font-bold uppercase tracking-wider text-[#999999] px-3 mb-2">
              Content & Studio
            </div>
            <ul className="flex flex-col gap-1">
              <NavLink href="/dashboard" icon="dashboard" label="Overview" exact />
              <NavLink href="/dashboard/articles" icon="article" label="Articles" />
              <NavLink href="/dashboard/podcast" icon="mic" label="AI Podcast" />
              <NavLink href="/dashboard/canvas" icon="brush" label="Canvas Studio" />
              <NavLink href="/dashboard/medium-sync" icon="sync_alt" label="Medium Sync" badge="Live" />
            </ul>
          </div>

          <div>
            <div className="text-[10.5px] font-bold uppercase tracking-wider text-[#999999] px-3 mb-2">
              Research & Plan
            </div>
            <ul className="flex flex-col gap-1">
              <NavLink href="/dashboard/knowledge" icon="menu_book" label="Knowledge Base" />
              <NavLink href="/dashboard/discovery" icon="travel_explore" label="Discovery" />
              <NavLink href="/dashboard/calendar" icon="calendar_today" label="Calendar" />
              <NavLink href="/dashboard/analytics" icon="analytics" label="Monetization" />
            </ul>
          </div>
        </div>

        {/* Bottom CTA Button */}
        <div className="mt-auto pt-4 border-t border-[#e8e7e0] flex flex-col gap-2">
          <Link
            href="/dashboard/article/new"
            className="w-full py-2.5 px-4 bg-[#1a8917] hover:bg-[#156d12] text-white rounded-lg text-[13px] font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs"
          >
            <span className="material-symbols-outlined text-[17px]">edit_square</span>
            Write New Story
          </Link>
          <div className="flex items-center justify-between px-2 pt-1 text-[11px] text-[#888888]">
            <span>v2.0 Swiss Editorial</span>
            <span className="text-[#1a8917] font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1a8917]"></span> Online
            </span>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* TopNavBar (Mobile Only) */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-[#e8e7e0] bg-[#faf9f6] sticky top-0 z-30">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#191919] text-white flex items-center justify-center font-bold text-xs">
              AR
            </div>
            <span className="font-bold text-[#191919] text-sm">AsikReview</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/medium-sync"
              className="text-xs bg-[#191919] text-white px-2.5 py-1 rounded font-medium flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">sync_alt</span>
              <span>Medium</span>
            </Link>
            <Link 
              href="/dashboard/article/new" 
              className="bg-[#1a8917] text-white p-1.5 rounded-md hover:bg-[#156d12] transition-colors flex items-center"
              title="Write Story"
            >
              <span className="material-symbols-outlined text-base">edit_square</span>
            </Link>
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}
