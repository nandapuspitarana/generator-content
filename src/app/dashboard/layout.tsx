"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ReactNode } from "react";

function NavLink({
  href,
  icon,
  label,
  exact = false,
}: {
  href: string;
  icon: string;
  label: string;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  return (
    <li>
      <Link
        href={href}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg duration-200 ease-in-out text-sm font-medium transition-all ${
          isActive
            ? "bg-primary-container text-on-primary-container"
            : "text-secondary hover:bg-surface-container-high"
        }`}
      >
        <span className={`material-symbols-outlined ${isActive ? "fill" : ""}`}>{icon}</span>
        {label}
      </Link>
    </li>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-surface text-on-surface min-h-screen flex">
      {/* SideNavBar (Hidden on Mobile, Visible on md+) */}
      <nav className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 border-r border-outline-variant p-6 bg-surface-container-low z-40">
        <div className="mb-10 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 overflow-hidden shrink-0 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined">auto_stories</span>
          </div>
          <div>
            <h1 className="font-semibold text-base text-on-surface m-0 tracking-tight leading-tight">
              AsikReview CMS
            </h1>
            <p className="text-xs text-secondary m-0 mt-0.5">Editorial Dashboard</p>
          </div>
        </div>
        <ul className="flex flex-col gap-1 flex-grow">
          <NavLink href="/dashboard" icon="home" label="Overview" exact />
          <NavLink href="/dashboard/articles" icon="view_list" label="Articles" />
          <NavLink href="/dashboard/discovery" icon="travel_explore" label="Discovery" />
          <NavLink href="/dashboard/canvas" icon="brush" label="Canvas" />
          <NavLink href="/dashboard/knowledge" icon="menu_book" label="Knowledge Base" />
        </ul>
        <div className="mt-auto pt-6 border-t border-outline-variant flex flex-col gap-2">
          <Link
            href="/dashboard/article/new"
            className="w-full py-3 px-4 bg-primary text-on-primary rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-base">edit_document</span>
            Write Article
          </Link>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* TopNavBar (Mobile Only) */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-outline-variant bg-surface-container-low sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 overflow-hidden shrink-0 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-sm">auto_stories</span>
            </div>
            <span className="font-semibold text-on-surface text-sm">AsikReview CMS</span>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/article/new" className="text-primary p-2 rounded-full hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined text-base">edit_document</span>
            </Link>
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}
