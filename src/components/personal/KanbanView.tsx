"use client";

import { useState } from "react";
import { setStatus } from "@/lib/store";
import { STATUS_LABEL, type Project, type Status, type Task } from "@/lib/types";
import { DueBadge, PriorityBadge, ProjectChip } from "./ui";

const COLUMNS: { status: Status; accent: string }[] = [
  { status: "todo", accent: "bg-slate-400" },
  { status: "doing", accent: "bg-sky-500" },
  { status: "done", accent: "bg-pink-400" },
];

export function KanbanView({
  tasks,
  projects,
  today,
  showProject,
  onOpen,
  onMoved,
}: {
  tasks: Task[];
  projects: Project[];
  today: string;
  showProject: boolean;
  onOpen: (task: Task) => void;
  onMoved: (task: Task, status: Status) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<Status | null>(null);
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {COLUMNS.map(({ status, accent }) => {
        const items = tasks.filter((t) => t.status === status);
        return (
          <section
            key={status}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              if (overCol !== status) setOverCol(status);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverCol(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData("text/plain");
              const task = tasks.find((t) => t.id === id);
              if (task && task.status !== status) {
                setStatus(id, status);
                onMoved(task, status);
              }
              setOverCol(null);
              setDragId(null);
            }}
            className={`flex min-h-[320px] flex-col rounded-xl border p-3 transition ${
              overCol === status ? "border-sky-300 bg-sky-50/60" : "border-white/80 bg-white/35 backdrop-blur-md"
            }`}
          >
            <header className="mb-3 flex items-center gap-2 px-1">
              <span className={`h-2 w-2 rounded-full ${accent}`} />
              <h3 className="text-sm font-semibold text-slate-700">{STATUS_LABEL[status]}</h3>
              <span className="text-xs text-slate-400">{items.length}</span>
            </header>
            <div className="flex flex-1 flex-col gap-2">
              {items.map((task) => {
                const subDone = task.subtasks.filter((s) => s.done).length;
                return (
                  <article
                    key={task.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", task.id);
                      e.dataTransfer.effectAllowed = "move";
                      setDragId(task.id);
                    }}
                    onDragEnd={() => {
                      setDragId(null);
                      setOverCol(null);
                    }}
                    onClick={() => onOpen(task)}
                    className={`cursor-grab rounded-lg border border-white bg-white/80 p-3 shadow-sm shadow-sky-100 transition hover:border-slate-300 hover:shadow active:cursor-grabbing ${
                      dragId === task.id ? "opacity-40" : ""
                    }`}
                  >
                    <div
                      className={`text-sm ${status === "done" ? "text-slate-400 line-through" : "text-slate-800"}`}
                    >
                      {task.title}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <PriorityBadge priority={task.priority} />
                      {task.dueDate && <DueBadge due={task.dueDate} today={today} done={status === "done"} />}
                      {task.subtasks.length > 0 && (
                        <span className="text-xs text-slate-500">
                          ☑ {subDone}/{task.subtasks.length}
                        </span>
                      )}
                    </div>
                    {showProject && (
                      <div className="mt-2">
                        <ProjectChip project={task.projectId ? projectMap.get(task.projectId) : undefined} />
                      </div>
                    )}
                  </article>
                );
              })}
              {items.length === 0 && (
                <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-slate-200 py-8 text-xs text-slate-400">
                  把卡片拖到這裡
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
