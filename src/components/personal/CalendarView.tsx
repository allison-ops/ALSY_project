"use client";

import { useState } from "react";
import { addDays, parseDateStr, toDateStr } from "@/lib/dates";
import { addTask, updateTask } from "@/lib/store";
import type { Task } from "@/lib/types";
import { PRIORITY_DOT } from "./ui";

const WEEK_HEADER = ["一", "二", "三", "四", "五", "六", "日"];
const MAX_VISIBLE = 3;

export function CalendarView({
  tasks,
  today,
  defaultProjectId,
  onOpen,
}: {
  tasks: Task[];
  today: string;
  defaultProjectId: string | null;
  onOpen: (task: Task) => void;
}) {
  const [cursor, setCursor] = useState(() => {
    const d = parseDateStr(today);
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [overDate, setOverDate] = useState<string | null>(null);
  const [addingDate, setAddingDate] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const first = new Date(cursor.year, cursor.month, 1);
  const offset = (first.getDay() + 6) % 7; // 週一為第一欄
  const start = addDays(toDateStr(first), -offset);
  const days = Array.from({ length: 42 }, (_, i) => addDays(start, i));
  const monthPrefix = toDateStr(first).slice(0, 7);

  const byDate = new Map<string, Task[]>();
  for (const t of tasks) {
    if (!t.dueDate) continue;
    const list = byDate.get(t.dueDate) ?? [];
    list.push(t);
    byDate.set(t.dueDate, list);
  }
  const unscheduled = tasks.filter((t) => !t.dueDate && t.status !== "done").length;

  const shiftMonth = (n: number) =>
    setCursor(({ year, month }) => {
      const d = new Date(year, month + n, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });

  const submitDraft = () => {
    const title = draft.trim();
    if (title && addingDate) addTask(title, { dueDate: addingDate, projectId: defaultProjectId });
    setDraft("");
    setAddingDate(null);
  };

  return (
    <div className="glass-panel rounded-xl">
      <header className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3">
        <h3 className="text-base font-semibold text-slate-800">
          {cursor.year} 年 {cursor.month + 1} 月
        </h3>
        <div className="ml-auto flex items-center gap-1">
          <NavButton onClick={() => shiftMonth(-1)} label="上個月">
            ‹
          </NavButton>
          <button
            type="button"
            onClick={() => {
              const d = parseDateStr(today);
              setCursor({ year: d.getFullYear(), month: d.getMonth() });
            }}
            className="rounded-md border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50"
          >
            本月
          </button>
          <NavButton onClick={() => shiftMonth(1)} label="下個月">
            ›
          </NavButton>
        </div>
        {unscheduled > 0 && (
          <p className="w-full text-xs text-slate-400">另有 {unscheduled} 項未排日期的待辦（可在清單中設定截止日）</p>
        )}
      </header>

      <div className="grid grid-cols-7 border-b border-slate-100 text-center text-xs font-medium text-slate-500">
        {WEEK_HEADER.map((w, i) => (
          <div key={w} className={`py-2 ${i >= 5 ? "text-rose-400" : ""}`}>
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((date) => {
          const inMonth = date.startsWith(monthPrefix);
          const isToday = date === today;
          const items = byDate.get(date) ?? [];
          const showAll = expanded === date;
          const visible = showAll ? items : items.slice(0, MAX_VISIBLE);
          return (
            <div
              key={date}
              onDragOver={(e) => {
                e.preventDefault();
                if (overDate !== date) setOverDate(date);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverDate(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/plain");
                if (id) updateTask(id, { dueDate: date });
                setOverDate(null);
              }}
              className={`group relative min-h-24 border-b border-r border-slate-100 p-1.5 transition sm:min-h-28 ${
                inMonth ? "" : "bg-white/30"
              } ${overDate === date ? "bg-sky-50" : ""}`}
            >
              <div className="mb-1 flex items-center justify-between">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                    isToday
                      ? "bg-linear-to-br from-sky-400 to-pink-400 font-semibold text-white"
                      : inMonth
                        ? "text-slate-700"
                        : "text-slate-300"
                  }`}
                >
                  {parseDateStr(date).getDate()}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAddingDate(date);
                    setDraft("");
                  }}
                  className="h-5 w-5 rounded text-sm leading-none text-slate-400 opacity-0 transition hover:bg-slate-100 group-hover:opacity-100"
                  aria-label="在這天新增待辦"
                >
                  +
                </button>
              </div>
              <div className="space-y-1">
                {visible.map((t) => {
                  const done = t.status === "done";
                  const overdue = !done && date < today;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", t.id);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onClick={() => onOpen(t)}
                      title={t.title}
                      className={`flex w-full items-center gap-1 truncate rounded px-1.5 py-0.5 text-left text-[11px] leading-4 transition hover:ring-1 hover:ring-slate-300 ${
                        done
                          ? "bg-slate-100 text-slate-400 line-through"
                          : overdue
                            ? "bg-red-50 text-red-600"
                            : "bg-sky-50 text-sky-800"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${PRIORITY_DOT[t.priority]}`} />
                      <span className="truncate">{t.title}</span>
                    </button>
                  );
                })}
                {items.length > MAX_VISIBLE && (
                  <button
                    type="button"
                    onClick={() => setExpanded(showAll ? null : date)}
                    className="w-full rounded px-1.5 text-left text-[11px] text-slate-500 hover:bg-slate-100"
                  >
                    {showAll ? "收合" : `還有 ${items.length - MAX_VISIBLE} 項`}
                  </button>
                )}
                {addingDate === date && (
                  <input
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.nativeEvent.isComposing) submitDraft();
                      if (e.key === "Escape") setAddingDate(null);
                    }}
                    onBlur={submitDraft}
                    placeholder="待辦名稱…"
                    className="w-full rounded border border-sky-300 px-1 py-0.5 text-[11px] outline-none"
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NavButton({ onClick, label, children }: { onClick: () => void; label: string; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="h-7 w-7 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
    >
      {children}
    </button>
  );
}
