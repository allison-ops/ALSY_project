"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SITE, TOOLS } from "@/lib/site";
import { Logo } from "./Logo";

/** 全站共用的 header（首頁與各工具頁一致） */
export function TopNav() {
  const pathname = usePathname();
  return (
    <header className="z-30 flex h-14 shrink-0 items-center gap-3 border-b border-slate-200/70 bg-white/75 px-4 backdrop-blur-xl sm:px-6">
      <Link href="/" className="flex shrink-0 items-center gap-2.5">
        <Logo size="sm" />
        {/* 手機寬度只留 logo，讓分頁有空間 */}
        <span className="hidden leading-tight sm:block">
          <span className="block font-black text-slate-800">{SITE.name}</span>
          <span className="block text-[9px] font-semibold uppercase tracking-[0.25em] text-slate-400">{SITE.nameEn}</span>
        </span>
      </Link>
      <nav className="ml-auto flex min-w-0 items-center gap-1 overflow-x-auto">
        {TOOLS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition sm:px-4 ${
                active
                  ? "bg-slate-900 font-medium text-white"
                  : "text-slate-600 hover:bg-slate-900/5 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
