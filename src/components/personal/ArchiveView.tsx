"use client";

import { useState } from "react";
import { shortDate, timestampToDateStr, weekdayLabel } from "@/lib/dates";
import { deleteTask, matchesQuery, restoreTask } from "@/lib/store";
import type { Project, Task } from "@/lib/types";
import { Highlight, ProjectChip } from "./ui";

export function taskSearchText(task: Task, project: Project | undefined): string {
  return [task.title, ...task.subtasks.map((s) => s.title), project?.name ?? "收集箱"].join("\n");
}

export function ArchiveView({
  tasks,
  projects,
  today,
}: {
  tasks: Task[];
  projects: Project[];
  today: string;
}) {
  const [query, setQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  const filtered = tasks
    .filter((t) => projectFilter === "all" || (t.projectId ?? "inbox") === projectFilter)
    .filter((t) => !query.trim() || matchesQuery(taskSearchText(t, projectMap.get(t.projectId ?? "")), query))
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));

  const groups = new Map<string, Task[]>();
  for (const t of filtered) {
    const key = t.completedAt ? timestampToDateStr(t.completedAt) : "unknown";
    groups.set(key, [...(groups.get(key) ?? []), t]);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-60 flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">⌕</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜尋歷史任務、子步驟、專案名稱…"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          />
        </div>
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
        >
          <option value="all">全部專案</option>
          <option value="inbox">收集箱</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <p className="text-xs text-slate-400">
        已完成的任務會在隔天自動封存到這裡。共 {tasks.length} 筆，符合條件 {filtered.length} 筆。
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 py-16 text-center text-sm text-slate-400">
          {tasks.length === 0 ? "還沒有歷史紀錄，完成任務後會出現在這裡" : "找不到符合的紀錄"}
        </div>
      ) : (
        [...groups.entries()].map(([date, items]) => (
          <section key={date}>
            <h3 className="mb-2 text-xs font-semibold text-slate-500">
              {date === "unknown" ? "未知日期" : `${shortDate(date, today)}（${weekdayLabel(date)}）完成`}
            </h3>
            <ul className="glass-panel divide-y divide-sky-100/70 overflow-hidden rounded-xl">
              {items.map((t) => (
                <li key={t.id} className="group flex items-center gap-3 px-4 py-2.5">
                  <span className="text-pink-400">✓</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-slate-600">
                      <Highlight text={t.title} query={query} />
                    </div>
                    {query.trim() &&
                      t.subtasks
                        .filter((s) => matchesQuery(s.title, query))
                        .map((s) => (
                          <div key={s.id} className="truncate text-xs text-slate-400">
                            └ <Highlight text={s.title} query={query} />
                          </div>
                        ))}
                  </div>
                  <ProjectChip project={t.projectId ? projectMap.get(t.projectId) : undefined} />
                  <button
                    type="button"
                    onClick={() => restoreTask(t.id)}
                    className="rounded-md px-2 py-1 text-xs text-sky-600 opacity-0 transition hover:bg-sky-50 group-hover:opacity-100"
                  >
                    還原
                  </button>
                  <button
                    type="button"
                    onClick={() => window.confirm(`永久刪除「${t.title}」？`) && deleteTask(t.id)}
                    className="rounded-md px-2 py-1 text-xs text-slate-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                  >
                    刪除
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
