import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { SITE } from "@/lib/site";

const TOOL_CARDS: { href: string; title: string; en: string; desc: string; gradient: string; icon: ReactNode }[] = [
  {
    href: "/tasks",
    title: "個人任務",
    en: "Tasks",
    desc: "收集、排序、追蹤每天的待辦。",
    gradient: "from-sky-400 to-blue-400",
    icon: <ChecklistIcon />,
  },
  {
    href: "/pomodoro",
    title: "番茄時鐘",
    en: "Pomodoro",
    desc: "25 分鐘專注，5 分鐘休息。",
    gradient: "from-sky-400 to-pink-400",
    icon: <TimerIcon />,
  },
  {
    href: "/fortune",
    title: "好運抽籤",
    en: "Fortune",
    desc: "搖一支籤，看看今日運勢。",
    gradient: "from-pink-400 to-rose-400",
    icon: <StickIcon />,
  },
];

export function Landing() {
  return (
    <div className="relative min-h-0 flex-1 overflow-y-auto bg-linear-to-br from-sky-100 via-white to-pink-100">
      <Backdrop />

      <div className="relative flex min-h-full flex-col">
        <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 py-14 sm:px-6">
          <section className="text-center">
            <h1 className="text-5xl font-black tracking-tight sm:text-7xl">
              <span className="bg-linear-to-r from-sky-500 to-pink-400 bg-clip-text text-transparent">
                {SITE.name}
              </span>
            </h1>
            <p className="mt-3 text-sm font-semibold uppercase tracking-[0.4em] text-slate-400">{SITE.nameEn}</p>
            <p className="mx-auto mt-5 max-w-md text-lg text-slate-600">{SITE.tagline}</p>
          </section>

          <section className="mt-12 grid gap-4 sm:grid-cols-3 sm:gap-5">
            {TOOL_CARDS.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="glass group flex items-center gap-4 rounded-3xl p-5 transition duration-300 hover:-translate-y-1 hover:bg-white/50 sm:flex-col sm:items-start sm:p-6"
              >
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br text-white shadow-lg sm:h-14 sm:w-14 ${tool.gradient}`}
                >
                  {tool.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold text-slate-800 sm:text-xl">
                    {tool.title}
                    <span className="ml-2 text-xs font-semibold uppercase tracking-widest text-slate-400">{tool.en}</span>
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">{tool.desc}</p>
                </div>
                <span className="text-xl text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-700 sm:self-end">
                  →
                </span>
              </Link>
            ))}
          </section>
        </main>

        <footer className="px-4 pb-5 sm:px-6">
          <div className="glass mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 rounded-2xl px-5 py-4 text-xs text-slate-500">
            <span className="flex items-center gap-2">
              <Logo size="sm" />
              <span className="font-bold text-slate-700">{SITE.name}</span>
            </span>
            <span>© 2026 ALSY・資料皆儲存於本機瀏覽器</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="blob absolute -left-32 -top-32 h-[30rem] w-[30rem] rounded-full bg-sky-300/50 blur-3xl" />
      <div className="blob absolute -right-24 top-24 h-[26rem] w-[26rem] rounded-full bg-pink-300/50 blur-3xl" style={{ animationDelay: "-4s" }} />
      <div className="blob absolute -bottom-24 left-1/3 h-[24rem] w-[24rem] rounded-full bg-sky-200/60 blur-3xl" style={{ animationDelay: "-8s" }} />
    </div>
  );
}

function ChecklistIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6l1.5 1.5L8 5M4 12l1.5 1.5L8 11M4 18l1.5 1.5L8 17M11 6h9M11 12h9M11 18h9" />
    </svg>
  );
}

function TimerIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2.5 2M9 2h6M12 2v3" />
    </svg>
  );
}

function StickIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 10h12l-1.5 11h-9z" />
      <path d="M9 10V3M12 10V2M15 10V4" />
    </svg>
  );
}
