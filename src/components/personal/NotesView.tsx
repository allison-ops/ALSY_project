"use client";

import { useState, type FormEvent } from "react";
import { addLink, deleteLink, updateProject } from "@/lib/store";
import type { Project } from "@/lib/types";

function normalizeUrl(raw: string): string {
  const url = raw.trim();
  return /^(https?:\/\/|mailto:)/i.test(url) ? url : `https://${url}`;
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function NotesView({ project }: { project: Project }) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    const full = normalizeUrl(url);
    addLink(project.id, title.trim() || hostOf(full), full);
    setTitle("");
    setUrl("");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <section className="glass-panel flex flex-col rounded-xl lg:col-span-3">
        <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-700">備忘筆記</h3>
          <span className="text-xs text-slate-400">自動儲存</span>
        </header>
        <textarea
          value={project.notes}
          onChange={(e) => updateProject(project.id, { notes: e.target.value })}
          placeholder={`記下「${project.name}」的重點、會議結論、帳號資訊位置……`}
          className="min-h-[360px] flex-1 resize-y rounded-b-xl bg-transparent px-4 py-3 text-sm leading-relaxed text-slate-700 outline-none placeholder:text-slate-400"
        />
      </section>

      <section className="glass-panel rounded-xl lg:col-span-2">
        <header className="border-b border-slate-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-700">連結庫</h3>
          <p className="mt-0.5 text-xs text-slate-400">雲端硬碟、參考文件、常用外部網站</p>
        </header>
        <form onSubmit={submit} className="space-y-2 border-b border-slate-100 px-4 py-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="名稱（可留空）"
            className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm outline-none focus:border-sky-400"
          />
          <div className="flex gap-2">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="網址，例如 drive.google.com/…"
              className="min-w-0 flex-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-sm outline-none focus:border-sky-400"
            />
            <button
              type="submit"
              disabled={!url.trim()}
              className="shrink-0 rounded-md bg-linear-to-r from-sky-400 to-pink-400 px-3 py-1.5 text-sm font-medium text-white hover:brightness-105 disabled:opacity-40"
            >
              加入
            </button>
          </div>
        </form>
        {project.links.length === 0 ? (
          <p className="px-4 py-8 text-center text-xs text-slate-400">還沒有連結</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {project.links.map((link) => (
              <li key={link.id} className="group flex items-center gap-3 px-4 py-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs font-semibold uppercase text-slate-500">
                  {hostOf(link.url).charAt(0)}
                </span>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 flex-1 hover:underline"
                >
                  <div className="truncate text-sm text-slate-800">{link.title}</div>
                  <div className="truncate text-xs text-slate-400">{hostOf(link.url)}</div>
                </a>
                <button
                  type="button"
                  onClick={() => deleteLink(project.id, link.id)}
                  className="text-slate-300 opacity-0 transition group-hover:opacity-100 hover:text-red-500"
                  aria-label="刪除連結"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
