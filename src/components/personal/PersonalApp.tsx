"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { endOfWeek, shortDate, weekdayLabel } from "@/lib/dates";
import { addTask, archiveCompleted, isArchived, setStatus, sortTasks, toggleDone, useAppState } from "@/lib/store";
import { STATUS_LABEL, type Mode, type Project, type Status, type Task, type View } from "@/lib/types";
import { ArchiveView } from "./ArchiveView";
import { CalendarView } from "./CalendarView";
import { KanbanView } from "./KanbanView";
import { ListView } from "./ListView";
import { NotesView } from "./NotesView";
import { SearchView } from "./SearchView";
import { Sidebar, type SidebarCounts } from "./Sidebar";
import { TaskEditor } from "./TaskEditor";
import { Modal, useToday } from "./ui";

interface Toast {
  id: number;
  message: string;
  undo?: () => void;
}

const MODE_LABEL: Record<Mode, string> = {
  list: "清單",
  kanban: "看板",
  calendar: "日曆",
  notes: "筆記與連結",
};

export function PersonalApp() {
  const state = useAppState();
  const today = useToday();
  const [view, setView] = useState<View>({ kind: "today" });
  const [mode, setMode] = useState<Mode>("list");
  const [query, setQuery] = useState("");
  const [modalId, setModalId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toastTimer = useRef<number | undefined>(undefined);
  const quickAddRef = useRef<HTMLInputElement>(null);

  // 按 N 快速聚焦收集箱輸入框
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest("input, textarea, select, [contenteditable]")) return;
      if (e.key.toLowerCase() === "n" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        quickAddRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!state) {
    return <div className="flex flex-1 items-center justify-center text-sm text-slate-400">載入中…</div>;
  }

  const { projects, tasks } = state;
  const projectMap = new Map(projects.map((p) => [p.id, p]));
  const active = tasks.filter((t) => !isArchived(t, today));
  const archived = tasks.filter((t) => isArchived(t, today));
  const open = active.filter((t) => t.status !== "done");
  const weekEnd = endOfWeek(today);

  // 若目前檢視的專案已被刪除，退回收集箱
  const currentProject: Project | undefined = view.kind === "project" ? projectMap.get(view.id) : undefined;
  const effectiveView: View = view.kind === "project" && !currentProject ? { kind: "inbox" } : view;
  const kind = effectiveView.kind;

  const counts: SidebarCounts = {
    inbox: open.filter((t) => t.projectId === null).length,
    today: open.filter((t) => t.dueDate && t.dueDate <= today).length,
    overdue: open.filter((t) => t.dueDate && t.dueDate < today).length,
    week: open.filter((t) => t.dueDate && t.dueDate <= weekEnd).length,
    all: open.length,
    archive: archived.length,
    byProject: new Map(projects.map((p) => [p.id, open.filter((t) => t.projectId === p.id).length])),
  };

  // 日曆用「不含日期篩選」的範圍；清單與看板再套用今天 / 本週條件
  const baseTasks =
    kind === "inbox"
      ? active.filter((t) => t.projectId === null)
      : currentProject
        ? active.filter((t) => t.projectId === currentProject.id)
        : active;
  const scoped = sortTasks(
    kind === "today"
      ? baseTasks.filter((t) => t.dueDate && t.dueDate <= today)
      : kind === "week"
        ? baseTasks.filter((t) => t.dueDate && t.dueDate <= weekEnd)
        : baseTasks,
  );
  const doneInScope = scoped.filter((t) => t.status === "done");

  const isTaskView = kind !== "archive" && kind !== "search";
  const modes: Mode[] = currentProject ? ["list", "kanban", "calendar", "notes"] : ["list", "kanban", "calendar"];
  const effectiveMode: Mode = modes.includes(mode) ? mode : "list";

  const showToast = (message: string, undo?: () => void) => {
    window.clearTimeout(toastTimer.current);
    const id = Date.now();
    setToast({ id, message, undo });
    toastTimer.current = window.setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 4000);
  };

  const handleToggle = (task: Task) => {
    toggleDone(task.id);
    if (task.status !== "done") {
      const prev = task.status;
      showToast(`完成「${task.title}」，做得好！`, () => setStatus(task.id, prev));
    }
  };

  const handleMoved = (task: Task, status: Status) => {
    showToast(
      status === "done" ? `完成「${task.title}」，做得好！` : `「${task.title}」移到 ${STATUS_LABEL[status]}`,
      () => setStatus(task.id, task.status),
    );
  };

  const selectView = (v: View) => {
    setView(v);
    setQuery("");
    setSidebarOpen(false);
  };

  const onQuery = (q: string) => {
    setQuery(q);
    if (q.trim()) setView({ kind: "search" });
    else if (view.kind === "search") setView({ kind: "today" });
  };

  // 快速新增的目的地：專案頁 → 該專案；今天 → 收集箱並設為今天；其他 → 收集箱
  const quickTarget = currentProject
    ? { label: currentProject.name, extra: { projectId: currentProject.id } }
    : kind === "today"
      ? { label: "收集箱 · 今天", extra: { dueDate: today } }
      : { label: "收集箱", extra: {} };

  const heading = (() => {
    switch (kind) {
      case "inbox":
        return { title: "收集箱", sub: "先記下來，之後再分類到專案" };
      case "today":
        return { title: "今天", sub: `${shortDate(today, today)}（${weekdayLabel(today)}）・含逾期項目` };
      case "week":
        return { title: "本週", sub: `到 ${shortDate(weekEnd, today)}（${weekdayLabel(weekEnd)}）為止・含逾期項目` };
      case "all":
        return { title: "全部待辦", sub: "所有尚未封存的任務" };
      case "project":
        return { title: currentProject!.name, sub: "雙擊側邊欄名稱可重新命名" };
      case "archive":
        return { title: "歷史歸檔", sub: "已完成任務的紀錄" };
      case "search":
        return { title: "搜尋結果", sub: "任務、歷史紀錄、筆記與連結" };
    }
  })();

  const modalTask = modalId ? tasks.find((t) => t.id === modalId) : undefined;
  const showProjectChip = !currentProject;

  return (
    <div className="relative flex min-h-0 flex-1 bg-linear-to-br from-sky-100 via-white to-pink-100">
      {/* 背景光暈，讓霧面面板透出淺藍與淺粉 */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-1/3 h-96 w-96 rounded-full bg-sky-200/60 blur-3xl" />
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-pink-200/60 blur-3xl" />
        <div className="absolute -bottom-32 right-1/4 h-80 w-80 rounded-full bg-sky-100/80 blur-3xl" />
      </div>
      {/* 手機版遮罩 */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-slate-900/30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-white/70 bg-white/55 backdrop-blur-xl transition-transform md:static md:z-auto md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          view={effectiveView}
          onSelect={selectView}
          projects={projects}
          counts={counts}
          query={query}
          onQuery={onQuery}
        />
      </aside>

      <main className="relative min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8">
          <div className="mb-5 flex flex-wrap items-end gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className="rounded-md border border-slate-200 px-2 py-0.5 text-base font-normal text-slate-600 md:hidden"
                  aria-label="開啟側邊欄"
                >
                  ☰
                </button>
                {currentProject && (
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: currentProject.color }} />
                )}
                {heading.title}
              </h1>
              <p className="mt-0.5 text-sm text-slate-500">{heading.sub}</p>
            </div>
            {isTaskView && (
              <div className="flex rounded-lg bg-white/60 p-0.5 ring-1 ring-white backdrop-blur">
                {modes.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`rounded-md px-3 py-1 text-sm transition ${
                      effectiveMode === m ? "bg-white font-medium text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {MODE_LABEL[m]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {isTaskView && effectiveMode !== "notes" && (
            <QuickAdd
              inputRef={quickAddRef}
              targetLabel={quickTarget.label}
              onAdd={(title) => {
                addTask(title, quickTarget.extra);
                showToast(`已加入「${quickTarget.label}」`);
              }}
            />
          )}

          {isTaskView && effectiveMode !== "notes" && effectiveMode !== "calendar" && doneInScope.length > 0 && (
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  archiveCompleted(doneInScope.map((t) => t.id));
                  showToast(`已封存 ${doneInScope.length} 項已完成任務`);
                }}
                className="text-xs text-slate-500 hover:text-sky-600"
              >
                立即封存已完成（{doneInScope.length}）→
              </button>
            </div>
          )}

          {kind === "archive" && <ArchiveView tasks={archived} projects={projects} today={today} />}

          {kind === "search" && (
            <SearchView
              query={query}
              active={active}
              archived={archived}
              projects={projects}
              today={today}
              onOpenTask={(t) => setModalId(t.id)}
              onOpenNotes={(id) => {
                selectView({ kind: "project", id });
                setMode("notes");
              }}
            />
          )}

          {isTaskView && effectiveMode === "list" && (
            <ListView
              tasks={scoped}
              projects={projects}
              today={today}
              showProject={showProjectChip}
              inboxMode={kind === "inbox"}
              onToggle={handleToggle}
              emptyText={
                kind === "inbox"
                  ? "收集箱是空的，所有事情都分類好了 ✨"
                  : kind === "today"
                    ? "今天沒有到期的待辦，輕鬆一下 ☕"
                    : "這裡還沒有任務，從上方輸入框新增一個吧"
              }
            />
          )}

          {isTaskView && effectiveMode === "kanban" && (
            <KanbanView
              tasks={scoped}
              projects={projects}
              today={today}
              showProject={showProjectChip}
              onOpen={(t) => setModalId(t.id)}
              onMoved={handleMoved}
            />
          )}

          {isTaskView && effectiveMode === "calendar" && (
            <CalendarView
              tasks={baseTasks}
              today={today}
              defaultProjectId={currentProject?.id ?? null}
              onOpen={(t) => setModalId(t.id)}
            />
          )}

          {currentProject && effectiveMode === "notes" && <NotesView project={currentProject} />}
        </div>
      </main>

      {modalTask && (
        <Modal onClose={() => setModalId(null)}>
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
            <span className="text-sm font-medium text-slate-500">任務詳情</span>
            <button
              type="button"
              onClick={() => setModalId(null)}
              className="h-7 w-7 rounded-md text-slate-400 hover:bg-slate-100"
              aria-label="關閉"
            >
              ✕
            </button>
          </div>
          <div className="p-5">
            <TaskEditor task={modalTask} projects={projects} today={today} onDeleted={() => setModalId(null)} />
          </div>
        </Modal>
      )}

      {toast && (
        <div
          key={toast.id}
          className="toast-in fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-lg bg-slate-900 px-4 py-2.5 text-sm text-white shadow-lg"
        >
          <span>{toast.message}</span>
          {toast.undo && (
            <button
              type="button"
              onClick={() => {
                toast.undo?.();
                setToast(null);
              }}
              className="font-medium text-sky-300 hover:text-sky-200"
            >
              復原
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function QuickAdd({
  inputRef,
  targetLabel,
  onAdd,
}: {
  inputRef: RefObject<HTMLInputElement | null>;
  targetLabel: string;
  onAdd: (title: string) => void;
}) {
  const [value, setValue] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const title = value.trim();
        if (!title) return;
        onAdd(title);
        setValue("");
      }}
      className="glass-panel mb-4 flex items-center gap-2 rounded-xl px-3 py-2 focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-100"
    >
      <span className="text-lg text-sky-500">＋</span>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="快速收集：隨手記下一件事，按 Enter 立即新增（快捷鍵 N）"
        className="min-w-0 flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-slate-400"
      />
      <span className="hidden shrink-0 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500 sm:inline">
        → {targetLabel}
      </span>
    </form>
  );
}
