"use client";

import { useSyncExternalStore } from "react";
import { uid } from "./store";

export type PomodoroMode = "focus" | "short" | "long";
export type TimerStatus = "idle" | "running" | "paused";

export interface PomodoroSettings {
  focusMin: number;
  shortMin: number;
  longMin: number;
  /** 每完成幾個番茄進入長休息 */
  longEvery: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  sound: boolean;
}

export interface FocusSession {
  id: string;
  taskId: string | null;
  taskTitle: string | null;
  endedAt: number;
  minutes: number;
}

export interface PomodoroState {
  version: 1;
  settings: PomodoroSettings;
  mode: PomodoroMode;
  status: TimerStatus;
  /** running 時的結束時間戳記 */
  endAt: number | null;
  /** idle / paused 時剩餘的毫秒數 */
  remainingMs: number;
  /** 本輪已完成的番茄數，用來決定何時長休息 */
  cycleCount: number;
  taskId: string | null;
  sessions: FocusSession[];
}

export const MODE_LABEL: Record<PomodoroMode, string> = {
  focus: "專注",
  short: "短休息",
  long: "長休息",
};

const STORAGE_KEY = "alsy.pomodoro.v1";
const HISTORY_DAYS = 60;

const DEFAULT_SETTINGS: PomodoroSettings = {
  focusMin: 25,
  shortMin: 5,
  longMin: 15,
  longEvery: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
  sound: true,
};

export function durationMs(mode: PomodoroMode, s: PomodoroSettings): number {
  const min = mode === "focus" ? s.focusMin : mode === "short" ? s.shortMin : s.longMin;
  return min * 60_000;
}

function initialState(): PomodoroState {
  return {
    version: 1,
    settings: DEFAULT_SETTINGS,
    mode: "focus",
    status: "idle",
    endAt: null,
    remainingMs: durationMs("focus", DEFAULT_SETTINGS),
    cycleCount: 0,
    taskId: null,
    sessions: [],
  };
}

// ---- 外部 store（localStorage 持久化，計時中重新整理也不會中斷） ----

let state: PomodoroState | null = null;
const listeners = new Set<() => void>();

function load(): PomodoroState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PomodoroState;
      if (parsed?.version === 1) return { ...parsed, settings: { ...DEFAULT_SETTINGS, ...parsed.settings } };
    }
  } catch {
    // 資料損毀時改用預設值
  }
  return initialState();
}

function save(s: PomodoroState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // 無痕模式或空間不足時僅保留在記憶體
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      state = load();
      listeners.forEach((l) => l());
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): PomodoroState {
  if (state === null) state = load();
  return state;
}

export function usePomodoro(): PomodoroState | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}

function update(fn: (s: PomodoroState) => PomodoroState) {
  state = fn(getSnapshot());
  save(state);
  listeners.forEach((l) => l());
}

// ---- 操作 ----

export function start() {
  update((s) => {
    if (s.status === "running") return s;
    return { ...s, status: "running", endAt: Date.now() + s.remainingMs };
  });
}

export function pause() {
  update((s) =>
    s.status === "running" && s.endAt
      ? { ...s, status: "paused", endAt: null, remainingMs: Math.max(0, s.endAt - Date.now()) }
      : s,
  );
}

export function reset() {
  update((s) => ({ ...s, status: "idle", endAt: null, remainingMs: durationMs(s.mode, s.settings) }));
}

export function switchMode(mode: PomodoroMode) {
  update((s) => ({ ...s, mode, status: "idle", endAt: null, remainingMs: durationMs(mode, s.settings) }));
}

function nextMode(s: PomodoroState, finishedFocus: boolean): { mode: PomodoroMode; cycleCount: number } {
  if (s.mode !== "focus") return { mode: "focus", cycleCount: s.mode === "long" ? 0 : s.cycleCount };
  const count = s.cycleCount + (finishedFocus ? 1 : 0);
  return { mode: count > 0 && count % s.settings.longEvery === 0 ? "long" : "short", cycleCount: count };
}

function advance(s: PomodoroState, finishedFocus: boolean): PomodoroState {
  const { mode, cycleCount } = nextMode(s, finishedFocus);
  const auto = mode === "focus" ? s.settings.autoStartFocus : s.settings.autoStartBreaks;
  const remainingMs = durationMs(mode, s.settings);
  return {
    ...s,
    mode,
    cycleCount,
    status: auto ? "running" : "idle",
    endAt: auto ? Date.now() + remainingMs : null,
    remainingMs,
  };
}

/** 略過目前階段（不記錄番茄） */
export function skip() {
  update((s) => advance(s, false));
}

/**
 * 若計時已到期就結束這一段並回傳結束的模式；尚未到期回傳 null。
 * 多個分頁同時呼叫也只會結算一次。
 */
export function completeIfDue(taskTitle: (id: string) => string | null): PomodoroMode | null {
  const s = getSnapshot();
  if (s.status !== "running" || !s.endAt || s.endAt > Date.now()) return null;
  const finished = s.mode;
  update((cur) => {
    const sessions =
      cur.mode === "focus"
        ? [
            ...cur.sessions.filter((x) => x.endedAt > Date.now() - HISTORY_DAYS * 86_400_000),
            {
              id: uid(),
              taskId: cur.taskId,
              taskTitle: cur.taskId ? taskTitle(cur.taskId) : null,
              endedAt: cur.endAt ?? Date.now(),
              minutes: cur.settings.focusMin,
            },
          ]
        : cur.sessions;
    return advance({ ...cur, sessions }, cur.mode === "focus");
  });
  return finished;
}

export function setTask(taskId: string | null) {
  update((s) => ({ ...s, taskId }));
}

export function updateSettings(patch: Partial<PomodoroSettings>) {
  update((s) => {
    const settings = { ...s.settings, ...patch };
    // 尚未開始時，讓新的時長立刻反映在畫面上
    const remainingMs = s.status === "idle" ? durationMs(s.mode, settings) : s.remainingMs;
    return { ...s, settings, remainingMs };
  });
}

export function deleteSession(id: string) {
  update((s) => ({ ...s, sessions: s.sessions.filter((x) => x.id !== id) }));
}

export function toggle() {
  if (getSnapshot().status === "running") pause();
  else start();
}
