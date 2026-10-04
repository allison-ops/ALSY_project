"use client";

import { useEffect, useState, type ReactNode } from "react";
import { describeDue, todayStr } from "@/lib/dates";
import { PRIORITY_LABEL, type Priority, type Project } from "@/lib/types";

/** 每分鐘檢查一次日期，跨過午夜時畫面會跟著更新 */
export function useToday(): string {
  const [today, setToday] = useState(todayStr);
  useEffect(() => {
    const timer = window.setInterval(() => setToday(todayStr()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  return today;
}

const PRIORITY_STYLE: Record<Priority, string> = {
  high: "bg-red-50 text-red-600 ring-red-200",
  medium: "bg-amber-50 text-amber-700 ring-amber-200",
  low: "bg-slate-100 text-slate-500 ring-slate-200",
};

export const PRIORITY_DOT: Record<Priority, string> = {
  high: "bg-red-500",
  medium: "bg-amber-400",
  low: "bg-slate-300",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ${PRIORITY_STYLE[priority]}`}
      title={`優先程度：${PRIORITY_LABEL[priority]}`}
    >
      {priority === "high" ? "★★★" : priority === "medium" ? "★★" : "★"}
      <span className="ml-0.5">{PRIORITY_LABEL[priority]}</span>
    </span>
  );
}

export function DueBadge({ due, today, done }: { due: string; today: string; done?: boolean }) {
  const { label, tone } = describeDue(due, today);
  const style = done
    ? "text-slate-400"
    : tone === "overdue"
      ? "text-red-600 font-semibold"
      : tone === "today"
        ? "text-pink-500 font-medium"
        : tone === "soon"
          ? "text-sky-600"
          : "text-slate-500";
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${style}`}>
      <CalendarIcon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

export function ProjectChip({ project }: { project: Project | undefined }) {
  if (!project) {
    return <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500">收集箱</span>;
  }
  return (
    <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: project.color }} />
      {project.name}
    </span>
  );
}

export function Checkbox({
  checked,
  onChange,
  size = "md",
  label,
}: {
  checked: boolean;
  onChange: () => void;
  size?: "sm" | "md";
  label: string;
}) {
  const dim = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={`${dim} flex shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
        checked
          ? "scale-105 border-transparent bg-linear-to-br from-sky-400 to-pink-400 text-white"
          : "border-slate-300 text-transparent hover:border-pink-300 hover:text-pink-300"
      }`}
    >
      <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

export function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-yellow-200 px-0.5">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  );
}

export function Modal({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 pt-[10vh]"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">{children}</div>
    </div>
  );
}

export function CalendarIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <rect x="3" y="4.5" width="14" height="12" rx="2" />
      <path d="M3 8.5h14M7 3v3M13 3v3" strokeLinecap="round" />
    </svg>
  );
}
