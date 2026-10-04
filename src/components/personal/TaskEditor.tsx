"use client";

import { useState, type ReactNode } from "react";
import { addDays, nextMonday } from "@/lib/dates";
import {
  addSubtask,
  deleteSubtask,
  deleteTask,
  renameSubtask,
  setStatus,
  toggleSubtask,
  updateTask,
} from "@/lib/store";
import {
  PRIORITY_LABEL,
  STATUS_LABEL,
  type Priority,
  type Project,
  type Status,
  type Task,
} from "@/lib/types";
import { Checkbox } from "./ui";

const PRIORITIES: Priority[] = ["high", "medium", "low"];
const STATUSES: Status[] = ["todo", "doing", "done"];

export function TaskEditor({
  task,
  projects,
  today,
  onDeleted,
}: {
  task: Task;
  projects: Project[];
  today: string;
  onDeleted?: () => void;
}) {
  const [newSub, setNewSub] = useState("");

  const quickDates = [
    { label: "今天", value: today },
    { label: "明天", value: addDays(today, 1) },
    { label: "下週一", value: nextMonday(today) },
  ];

  const submitSub = () => {
    const title = newSub.trim();
    if (!title) return;
    addSubtask(task.id, title);
    setNewSub("");
  };

  const doneCount = task.subtasks.filter((s) => s.done).length;

  return (
    <div className="space-y-4 text-sm">
      <input
        className="w-full rounded-md border border-slate-200 px-3 py-2 text-base font-medium outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        value={task.title}
        onChange={(e) => updateTask(task.id, { title: e.target.value })}
        aria-label="任務名稱"
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="優先程度">
          <div className="flex gap-1">
            {PRIORITIES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => updateTask(task.id, { priority: p })}
                className={`flex-1 rounded-md border px-2 py-1 text-xs transition ${
                  task.priority === p
                    ? p === "high"
                      ? "border-red-300 bg-red-50 text-red-600"
                      : p === "medium"
                        ? "border-amber-300 bg-amber-50 text-amber-700"
                        : "border-slate-300 bg-slate-100 text-slate-600"
                    : "border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                {PRIORITY_LABEL[p]}
              </button>
            ))}
          </div>
        </Field>

        <Field label="狀態">
          <div className="flex gap-1">
            {STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(task.id, s)}
                className={`flex-1 rounded-md border px-2 py-1 text-xs transition ${
                  task.status === s
                    ? "border-sky-300 bg-sky-50 text-sky-700"
                    : "border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </Field>

        <Field label="截止日期">
          <div className="flex flex-wrap items-center gap-1">
            {quickDates.map((d) => (
              <button
                key={d.label}
                type="button"
                onClick={() => updateTask(task.id, { dueDate: d.value })}
                className={`rounded-md border px-2 py-1 text-xs transition ${
                  task.dueDate === d.value
                    ? "border-sky-300 bg-sky-50 text-sky-700"
                    : "border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                {d.label}
              </button>
            ))}
            <input
              type="date"
              value={task.dueDate ?? ""}
              onChange={(e) => updateTask(task.id, { dueDate: e.target.value || null })}
              className="rounded-md border border-slate-200 px-1.5 py-0.5 text-xs text-slate-600"
              aria-label="指定日期"
            />
            {task.dueDate && (
              <button
                type="button"
                onClick={() => updateTask(task.id, { dueDate: null })}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                清除
              </button>
            )}
          </div>
        </Field>

        <Field label="專案分類">
          <select
            value={task.projectId ?? ""}
            onChange={(e) => updateTask(task.id, { projectId: e.target.value || null })}
            className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
          >
            <option value="">收集箱（未分類）</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field
        label={
          <span className="flex items-center justify-between">
            <span>
              子步驟{task.subtasks.length > 0 && `（${doneCount}/${task.subtasks.length}）`}
            </span>
            <span className={task.subtasks.length > 5 ? "text-amber-600" : "text-slate-400"}>
              {task.subtasks.length > 5 ? "步驟有點多，考慮拆成兩個任務？" : "建議拆成 3~5 個執行動作"}
            </span>
          </span>
        }
      >
        {task.subtasks.length > 0 && (
          <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-linear-to-r from-sky-400 to-pink-400 transition-all"
              style={{ width: `${(doneCount / task.subtasks.length) * 100}%` }}
            />
          </div>
        )}
        <ul className="space-y-1">
          {task.subtasks.map((st) => (
            <li key={st.id} className="group flex items-center gap-2">
              <Checkbox
                size="sm"
                checked={st.done}
                onChange={() => toggleSubtask(task.id, st.id)}
                label={st.title}
              />
              <input
                value={st.title}
                onChange={(e) => renameSubtask(task.id, st.id, e.target.value)}
                className={`flex-1 rounded px-1 py-0.5 outline-none focus:bg-slate-50 ${
                  st.done ? "text-slate-400 line-through" : "text-slate-700"
                }`}
              />
              <button
                type="button"
                onClick={() => deleteSubtask(task.id, st.id)}
                className="text-slate-300 opacity-0 transition group-hover:opacity-100 hover:text-red-500"
                aria-label="刪除子步驟"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-1 flex items-center gap-2">
          <span className="w-4 text-center text-slate-300">+</span>
          <input
            value={newSub}
            onChange={(e) => setNewSub(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) submitSub();
            }}
            placeholder="新增子步驟，按 Enter"
            className="flex-1 rounded px-1 py-0.5 outline-none placeholder:text-slate-400 focus:bg-slate-50"
          />
        </div>
      </Field>

      <div className="flex justify-end border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={() => {
            if (window.confirm(`確定刪除「${task.title}」？`)) {
              deleteTask(task.id);
              onDeleted?.();
            }
          }}
          className="text-xs text-slate-400 hover:text-red-600"
        >
          刪除任務
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-xs font-medium text-slate-500">{label}</div>
      {children}
    </div>
  );
}
