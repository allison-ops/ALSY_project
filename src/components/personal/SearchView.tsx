"use client";

import type { ReactNode } from "react";
import { matchesQuery, restoreTask } from "@/lib/store";
import type { Project, Task } from "@/lib/types";
import { taskSearchText } from "./ArchiveView";
import { DueBadge, Highlight, ProjectChip } from "./ui";

/** 取出筆記中關鍵字附近的一小段文字 */
function snippet(text: string, query: string): string {
  const idx = text.toLowerCase().indexOf(query.trim().toLowerCase());
  if (idx < 0) return "";
  const start = Math.max(0, idx - 20);
  return (start > 0 ? "…" : "") + text.slice(start, idx + 40).replace(/\s+/g, " ") + "…";
}

export function SearchView({
  query,
  active,
  archived,
  projects,
  today,
  onOpenTask,
  onOpenNotes,
}: {
  query: string;
  active: Task[];
  archived: Task[];
  projects: Project[];
  today: string;
  onOpenTask: (task: Task) => void;
  onOpenNotes: (projectId: string) => void;
}) {
  const projectMap = new Map(projects.map((p) => [p.id, p]));
  if (!query.trim()) {
    return <p className="py-16 text-center text-sm text-slate-400">在左上角輸入關鍵字，搜尋所有任務、歷史紀錄與筆記</p>;
  }

  const match = (t: Task) => matchesQuery(taskSearchText(t, projectMap.get(t.projectId ?? "")), query);
  const activeHits = active.filter(match);
  const archivedHits = archived.filter(match);
  const noteHits = projects.flatMap((p) => {
    const hits: { key: string; label: ReactNode; detail: string }[] = [];
    if (matchesQuery(p.notes, query)) hits.push({ key: `${p.id}-notes`, label: "筆記", detail: snippet(p.notes, query) });
    for (const l of p.links) {
      if (matchesQuery(`${l.title} ${l.url}`, query))
        hits.push({ key: l.id, label: <Highlight text={l.title} query={query} />, detail: l.url });
    }
    return hits.map((h) => ({ ...h, project: p }));
  });

  const total = activeHits.length + archivedHits.length + noteHits.length;

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-500">
        「{query}」共找到 <span className="font-semibold text-slate-800">{total}</span> 筆結果
      </p>

      <Section title="進行中的任務" count={activeHits.length}>
        {activeHits.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => onOpenTask(t)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-white/60"
            >
              <span className="min-w-0 flex-1 truncate text-sm text-slate-800">
                <Highlight text={t.title} query={query} />
              </span>
              {t.dueDate && <DueBadge due={t.dueDate} today={today} done={t.status === "done"} />}
              <ProjectChip project={t.projectId ? projectMap.get(t.projectId) : undefined} />
            </button>
          </li>
        ))}
      </Section>

      <Section title="歷史歸檔" count={archivedHits.length}>
        {archivedHits.map((t) => (
          <li key={t.id} className="flex items-center gap-3 px-4 py-2.5">
            <span className="text-pink-400">✓</span>
            <span className="min-w-0 flex-1 truncate text-sm text-slate-500">
              <Highlight text={t.title} query={query} />
            </span>
            <ProjectChip project={t.projectId ? projectMap.get(t.projectId) : undefined} />
            <button
              type="button"
              onClick={() => restoreTask(t.id)}
              className="rounded-md px-2 py-1 text-xs text-sky-600 hover:bg-sky-50"
            >
              還原
            </button>
          </li>
        ))}
      </Section>

      <Section title="筆記與連結" count={noteHits.length}>
        {noteHits.map((h) => (
          <li key={h.key}>
            <button
              type="button"
              onClick={() => onOpenNotes(h.project.id)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-white/60"
            >
              <div className="min-w-0 flex-1">
                <div className="text-sm text-slate-800">{h.label}</div>
                <div className="truncate text-xs text-slate-400">
                  <Highlight text={h.detail} query={query} />
                </div>
              </div>
              <ProjectChip project={h.project} />
            </button>
          </li>
        ))}
      </Section>
    </div>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  if (count === 0) return null;
  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold text-slate-500">
        {title}（{count}）
      </h3>
      <ul className="glass-panel divide-y divide-sky-100/70 overflow-hidden rounded-xl">
        {children}
      </ul>
    </section>
  );
}
