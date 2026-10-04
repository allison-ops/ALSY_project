export type Priority = "high" | "medium" | "low";
export type Status = "todo" | "doing" | "done";

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  /** null 代表還在收集箱，尚未分類 */
  projectId: string | null;
  status: Status;
  priority: Priority;
  /** YYYY-MM-DD（本地時間） */
  dueDate: string | null;
  subtasks: Subtask[];
  createdAt: number;
  completedAt: number | null;
  /** 手動封存；已完成且完成日早於今天者也會自動視為封存 */
  archived: boolean;
}

export interface ProjectLink {
  id: string;
  title: string;
  url: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  notes: string;
  links: ProjectLink[];
}

export interface AppState {
  version: 1;
  projects: Project[];
  tasks: Task[];
}

export type View =
  | { kind: "inbox" }
  | { kind: "today" }
  | { kind: "week" }
  | { kind: "all" }
  | { kind: "project"; id: string }
  | { kind: "archive" }
  | { kind: "search" };

export type Mode = "list" | "kanban" | "calendar" | "notes";

export const PRIORITY_LABEL: Record<Priority, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

export const PRIORITY_RANK: Record<Priority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export const STATUS_LABEL: Record<Status, string> = {
  todo: "待處理",
  doing: "進行中",
  done: "已完成",
};

export const PROJECT_COLORS = [
  "#6366f1",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#8b5cf6",
  "#ef4444",
  "#14b8a6",
];
