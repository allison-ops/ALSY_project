"use client";

import { useSyncExternalStore } from "react";
import { addDays, timestampToDateStr, todayStr } from "./dates";
import {
  PRIORITY_RANK,
  PROJECT_COLORS,
  type AppState,
  type Project,
  type Status,
  type Task,
} from "./types";

const STORAGE_KEY = "alsy.personal.v1";

export function uid(): string {
  // crypto.randomUUID 只在安全來源（https / localhost）可用，區網 IP 連線時需要後備方案
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

function seed(): AppState {
  const today = todayStr();
  const now = Date.now();
  const projects: Project[] = ["專案 A", "專案 B", "行政瑣事", "學習"].map(
    (name, i) => ({ id: uid(), name, color: PROJECT_COLORS[i], notes: "", links: [] }),
  );
  const [a, b, admin, learn] = projects;
  const task = (t: Partial<Task> & { title: string }): Task => ({
    id: uid(),
    projectId: null,
    status: "todo",
    priority: "medium",
    dueDate: null,
    subtasks: [],
    createdAt: now,
    completedAt: null,
    archived: false,
    ...t,
  });
  return {
    version: 1,
    projects,
    tasks: [
      task({ title: "回覆客戶的報價信件", projectId: a.id, priority: "high", dueDate: today }),
      task({
        title: "準備週五專案簡報",
        projectId: a.id,
        priority: "high",
        dueDate: addDays(today, 2),
        status: "doing",
        subtasks: [
          { id: uid(), title: "整理本週進度數據", done: true },
          { id: uid(), title: "製作簡報大綱", done: false },
          { id: uid(), title: "預演一次並計時", done: false },
        ],
      }),
      task({ title: "確認設計稿回饋", projectId: b.id, dueDate: addDays(today, 1) }),
      task({ title: "報帳：交通費收據", projectId: admin.id, priority: "low", dueDate: addDays(today, -1) }),
      task({ title: "讀完 Next.js App Router 文件", projectId: learn.id, priority: "low" }),
      task({ title: "突然想到：下次會議要提預算問題" }),
    ],
  };
}

// ---- 外部 store（localStorage 持久化） ----

let state: AppState | null = null;
const listeners = new Set<() => void>();

function load(): AppState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (parsed?.version === 1) return parsed;
    }
  } catch {
    // 資料損毀或無法存取時改用預設資料
  }
  return seed();
}

function save(s: AppState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // 無痕模式或空間不足時僅保留在記憶體
  }
}

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      state = load();
      emit();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): AppState {
  if (state === null) {
    state = load();
    save(state);
  }
  return state;
}

function getServerSnapshot(): AppState | null {
  return null;
}

/** 伺服器端與水合期間回傳 null，之後才是 localStorage 中的資料 */
export function useAppState(): AppState | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function update(fn: (s: AppState) => AppState) {
  state = fn(getSnapshot());
  save(state);
  emit();
}

function mapTask(id: string, fn: (t: Task) => Task) {
  update((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? fn(t) : t)) }));
}

// ---- 任務 ----

export function addTask(
  title: string,
  extra: Partial<Pick<Task, "projectId" | "dueDate" | "priority" | "status">> = {},
): Task {
  const task: Task = {
    id: uid(),
    title,
    projectId: null,
    status: "todo",
    priority: "medium",
    dueDate: null,
    subtasks: [],
    createdAt: Date.now(),
    completedAt: null,
    archived: false,
    ...extra,
  };
  if (task.status === "done") task.completedAt = Date.now();
  update((s) => ({ ...s, tasks: [task, ...s.tasks] }));
  return task;
}

export function updateTask(id: string, patch: Partial<Omit<Task, "id" | "status">>) {
  mapTask(id, (t) => ({ ...t, ...patch }));
}

export function setStatus(id: string, status: Status) {
  mapTask(id, (t) => {
    if (t.status === status) return t;
    if (status === "done") return { ...t, status, completedAt: Date.now() };
    return { ...t, status, completedAt: null, archived: false };
  });
}

export function toggleDone(id: string) {
  const t = getSnapshot().tasks.find((x) => x.id === id);
  if (t) setStatus(id, t.status === "done" ? "todo" : "done");
}

export function deleteTask(id: string) {
  update((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }));
}

export function restoreTask(id: string) {
  setStatus(id, "todo");
}

/** 把今天完成的任務也立即移入歷史紀錄 */
export function archiveCompleted(ids: string[]) {
  const set = new Set(ids);
  update((s) => ({
    ...s,
    tasks: s.tasks.map((t) => (set.has(t.id) && t.status === "done" ? { ...t, archived: true } : t)),
  }));
}

export function addSubtask(taskId: string, title: string) {
  mapTask(taskId, (t) => ({
    ...t,
    subtasks: [...t.subtasks, { id: uid(), title, done: false }],
  }));
}

export function toggleSubtask(taskId: string, subId: string) {
  mapTask(taskId, (t) => ({
    ...t,
    subtasks: t.subtasks.map((st) => (st.id === subId ? { ...st, done: !st.done } : st)),
  }));
}

export function renameSubtask(taskId: string, subId: string, title: string) {
  mapTask(taskId, (t) => ({
    ...t,
    subtasks: t.subtasks.map((st) => (st.id === subId ? { ...st, title } : st)),
  }));
}

export function deleteSubtask(taskId: string, subId: string) {
  mapTask(taskId, (t) => ({ ...t, subtasks: t.subtasks.filter((st) => st.id !== subId) }));
}

// ---- 專案 ----

export function addProject(name: string): Project {
  const s = getSnapshot();
  const project: Project = {
    id: uid(),
    name,
    color: PROJECT_COLORS[s.projects.length % PROJECT_COLORS.length],
    notes: "",
    links: [],
  };
  update((st) => ({ ...st, projects: [...st.projects, project] }));
  return project;
}

export function updateProject(id: string, patch: Partial<Omit<Project, "id">>) {
  update((s) => ({
    ...s,
    projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
  }));
}

/** 刪除專案時，底下的任務退回收集箱，避免資料遺失 */
export function deleteProject(id: string) {
  update((s) => ({
    ...s,
    projects: s.projects.filter((p) => p.id !== id),
    tasks: s.tasks.map((t) => (t.projectId === id ? { ...t, projectId: null } : t)),
  }));
}

export function addLink(projectId: string, title: string, url: string) {
  update((s) => ({
    ...s,
    projects: s.projects.map((p) =>
      p.id === projectId ? { ...p, links: [...p.links, { id: uid(), title, url }] } : p,
    ),
  }));
}

export function deleteLink(projectId: string, linkId: string) {
  update((s) => ({
    ...s,
    projects: s.projects.map((p) =>
      p.id === projectId ? { ...p, links: p.links.filter((l) => l.id !== linkId) } : p,
    ),
  }));
}

// ---- 查詢工具 ----

export function isArchived(t: Task, today: string): boolean {
  if (t.status !== "done") return false;
  if (t.archived) return true;
  return t.completedAt !== null && timestampToDateStr(t.completedAt) < today;
}

export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const doneA = a.status === "done" ? 1 : 0;
    const doneB = b.status === "done" ? 1 : 0;
    if (doneA !== doneB) return doneA - doneB;
    const dueA = a.dueDate ?? "9999-99-99";
    const dueB = b.dueDate ?? "9999-99-99";
    if (dueA !== dueB) return dueA < dueB ? -1 : 1;
    const p = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (p !== 0) return p;
    return b.createdAt - a.createdAt;
  });
}

export function matchesQuery(text: string, query: string): boolean {
  return text.toLowerCase().includes(query.trim().toLowerCase());
}

export function getTaskTitle(id: string): string | null {
  return getSnapshot().tasks.find((t) => t.id === id)?.title ?? null;
}
