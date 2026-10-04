"use client";

import { useState } from "react";
import { updateTask } from "@/lib/store";
import { STATUS_LABEL, type Project, type Task } from "@/lib/types";
import { TaskEditor } from "./TaskEditor";
import { Checkbox, DueBadge, PriorityBadge, ProjectChip } from "./ui";

export function ListView({
  tasks,
  projects,
  today,
  showProject,
  inboxMode,
  onToggle,
  emptyText,
}: {
  tasks: Task[];
  projects: Project[];
  today: string;
  showProject: boolean;
  inboxMode?: boolean;
  onToggle: (task: Task) => void;
  emptyText: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-sky-200 bg-white/40 py-16 text-center text-sm text-slate-400">
        {emptyText}
      </div>
    );
  }

  return (
    <ul className="glass-panel divide-y divide-sky-100/70 overflow-hidden rounded-xl">
      {tasks.map((task) => {
        const done = task.status === "done";
        const open = openId === task.id;
        const subDone = task.subtasks.filter((s) => s.done).length;
        return (
          <li key={task.id} className={open ? "bg-white/50" : ""}>
            <div
              className="group flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-white/60"
              onClick={() => setOpenId(open ? null : task.id)}
            >
              <div className="pt-0.5">
                <Checkbox checked={done} onChange={() => onToggle(task)} label={`完成 ${task.title}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className={`truncate transition-colors duration-300 ${
                    done ? "text-slate-400 line-through" : "text-slate-800"
                  }`}
                >
                  {task.title || <span className="text-slate-400">（未命名）</span>}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  <PriorityBadge priority={task.priority} />
                  {task.dueDate && <DueBadge due={task.dueDate} today={today} done={done} />}
                  {task.status === "doing" && (
                    <span className="rounded bg-sky-50 px-1.5 py-0.5 text-[11px] text-sky-700">
                      {STATUS_LABEL.doing}
                    </span>
                  )}
                  {task.subtasks.length > 0 && (
                    <span className="text-xs text-slate-500">
                      ☑ {subDone}/{task.subtasks.length}
                    </span>
                  )}
                  {showProject && <ProjectChip project={task.projectId ? projectMap.get(task.projectId) : undefined} />}
                </div>
              </div>
              {inboxMode && !done && (
                <select
                  value=""
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => e.target.value && updateTask(task.id, { projectId: e.target.value })}
                  className="shrink-0 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 hover:border-sky-300"
                  aria-label="分類到專案"
                >
                  <option value="">分類到…</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
              <span
                className={`shrink-0 pt-1 text-xs text-slate-300 transition group-hover:text-slate-500 ${open ? "rotate-180" : ""}`}
              >
                ▾
              </span>
            </div>
            {open && (
              <div className="border-t border-slate-100 px-4 pb-4 pt-3 sm:pl-12">
                <TaskEditor task={task} projects={projects} today={today} onDeleted={() => setOpenId(null)} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
