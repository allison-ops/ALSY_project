"use client";

import { useState, type ReactNode } from "react";
import { addProject, deleteProject, updateProject } from "@/lib/store";
import type { Project, View } from "@/lib/types";

export interface SidebarCounts {
  inbox: number;
  today: number;
  overdue: number;
  week: number;
  all: number;
  archive: number;
  byProject: Map<string, number>;
}

export function Sidebar({
  view,
  onSelect,
  projects,
  counts,
  query,
  onQuery,
}: {
  view: View;
  onSelect: (view: View) => void;
  projects: Project[];
  counts: SidebarCounts;
  query: string;
  onQuery: (q: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const isActive = (v: View) =>
    v.kind === view.kind && (v.kind !== "project" || (view.kind === "project" && view.id === v.id));

  const submitNew = () => {
    const name = newName.trim();
    if (name) onSelect({ kind: "project", id: addProject(name).id });
    setNewName("");
    setAdding(false);
  };

  return (
    <nav className="flex h-full flex-col gap-5 overflow-y-auto p-3 text-sm">
      <div className="relative">
        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">⌕</span>
        <input
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="搜尋全部資料…"
          className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-7 pr-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        />
      </div>

      <div className="space-y-0.5">
        <NavItem icon="📥" label="收集箱" count={counts.inbox} active={isActive({ kind: "inbox" })} onClick={() => onSelect({ kind: "inbox" })} />
        <NavItem
          icon="☀️"
          label="今天"
          count={counts.today}
          alert={counts.overdue > 0 ? `${counts.overdue} 逾期` : undefined}
          active={isActive({ kind: "today" })}
          onClick={() => onSelect({ kind: "today" })}
        />
        <NavItem icon="🗓️" label="本週" count={counts.week} active={isActive({ kind: "week" })} onClick={() => onSelect({ kind: "week" })} />
        <NavItem icon="📋" label="全部待辦" count={counts.all} active={isActive({ kind: "all" })} onClick={() => onSelect({ kind: "all" })} />
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between px-2">
          <span className="text-xs font-semibold tracking-wide text-slate-400">專案 / 標籤</span>
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="h-5 w-5 rounded text-slate-400 hover:bg-slate-200 hover:text-slate-700"
            aria-label="新增專案"
          >
            +
          </button>
        </div>
        <div className="space-y-0.5">
          {projects.map((p) =>
            editingId === p.id ? (
              <input
                key={p.id}
                autoFocus
                defaultValue={p.name}
                onBlur={(e) => {
                  const name = e.target.value.trim();
                  if (name) updateProject(p.id, { name });
                  setEditingId(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) e.currentTarget.blur();
                  if (e.key === "Escape") setEditingId(null);
                }}
                className="w-full rounded-md border border-sky-300 px-2 py-1.5 outline-none"
              />
            ) : (
              <div key={p.id} className="group relative">
                <NavItem
                  icon={<span className="block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />}
                  label={p.name}
                  count={counts.byProject.get(p.id) ?? 0}
                  active={isActive({ kind: "project", id: p.id })}
                  onClick={() => onSelect({ kind: "project", id: p.id })}
                  onDoubleClick={() => setEditingId(p.id)}
                />
                <div className="absolute right-1 top-1/2 hidden -translate-y-1/2 gap-0.5 rounded-md bg-white/90 group-hover:flex">
                  <IconButton label="重新命名" onClick={() => setEditingId(p.id)}>
                    ✎
                  </IconButton>
                  <IconButton
                    label="刪除專案"
                    onClick={() => {
                      if (window.confirm(`刪除「${p.name}」？底下的任務會移回收集箱。`)) {
                        deleteProject(p.id);
                        if (isActive({ kind: "project", id: p.id })) onSelect({ kind: "inbox" });
                      }
                    }}
                  >
                    🗑
                  </IconButton>
                </div>
              </div>
            ),
          )}
          {adding && (
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={submitNew}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing) submitNew();
                if (e.key === "Escape") {
                  setNewName("");
                  setAdding(false);
                }
              }}
              placeholder="專案名稱"
              className="w-full rounded-md border border-sky-300 px-2 py-1.5 outline-none"
            />
          )}
        </div>
      </div>

      <div className="mt-auto border-t border-slate-200 pt-3">
        <NavItem icon="🗄️" label="歷史歸檔" count={counts.archive} active={isActive({ kind: "archive" })} onClick={() => onSelect({ kind: "archive" })} />
      </div>
    </nav>
  );
}

function NavItem({
  icon,
  label,
  count,
  alert,
  active,
  onClick,
  onDoubleClick,
}: {
  icon: ReactNode;
  label: string;
  count: number;
  alert?: string;
  active: boolean;
  onClick: () => void;
  onDoubleClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition ${
        active ? "bg-linear-to-r from-sky-100 to-pink-100 font-medium text-sky-800" : "text-slate-600 hover:bg-white/60"
      }`}
    >
      <span className="flex w-5 shrink-0 items-center justify-center text-sm">{icon}</span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {alert && <span className="rounded bg-red-100 px-1.5 text-[10px] font-medium text-red-600">{alert}</span>}
      {count > 0 && <span className="text-xs text-slate-400">{count}</span>}
    </button>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={label}
      title={label}
      className="h-6 w-6 rounded text-xs text-slate-400 hover:bg-slate-200 hover:text-slate-700"
    >
      {children}
    </button>
  );
}
