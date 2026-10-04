"use client";

import { useEffect, useState, type ReactNode } from "react";
import { addDays, timestampToDateStr, todayStr, weekdayLabel } from "@/lib/dates";
import {
  MODE_LABEL,
  completeIfDue,
  deleteSession,
  durationMs,
  reset,
  setTask,
  skip,
  switchMode,
  toggle,
  updateSettings,
  usePomodoro,
  type PomodoroMode,
  type PomodoroSettings,
} from "@/lib/pomodoro";
import { SITE } from "@/lib/site";
import { getTaskTitle, isArchived, useAppState } from "@/lib/store";

const PAGE_TITLE = `番茄時鐘｜${SITE.name}`;

/** 粉紅 × 粉藍：專注偏粉紅、休息偏粉藍，背景光暈跟著模式移動 */
const THEME: Record<
  PomodoroMode,
  { text: string; ringFrom: string; ringTo: string; button: string; blobPink: string; blobBlue: string }
> = {
  focus: {
    text: "text-pink-500",
    ringFrom: "#f9a8d4",
    ringTo: "#93c5fd",
    button: "from-pink-500 to-sky-400 shadow-pink-300/70",
    blobPink: "h-[34rem] w-[34rem] opacity-70",
    blobBlue: "h-[22rem] w-[22rem] opacity-50",
  },
  short: {
    text: "text-sky-500",
    ringFrom: "#7dd3fc",
    ringTo: "#f9a8d4",
    button: "from-sky-500 to-pink-400 shadow-sky-300/70",
    blobPink: "h-[22rem] w-[22rem] opacity-50",
    blobBlue: "h-[34rem] w-[34rem] opacity-70",
  },
  long: {
    text: "text-indigo-400",
    ringFrom: "#a5b4fc",
    ringTo: "#f9a8d4",
    button: "from-indigo-400 via-sky-400 to-pink-400 shadow-indigo-300/70",
    blobPink: "h-[28rem] w-[28rem] opacity-60",
    blobBlue: "h-[30rem] w-[30rem] opacity-70",
  },
};

const FINISH_MESSAGE: Record<PomodoroMode, string> = {
  focus: "完成一個番茄！起來動一動，休息一下吧",
  short: "休息結束，準備開始下一個番茄",
  long: "長休息結束，充電完成，繼續加油",
};

function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

// ---- 提示音（Web Audio，不需要音檔） ----

let audioCtx: AudioContext | null = null;

/** 瀏覽器要求在使用者操作中啟用音訊，所以在按下開始時先解鎖 */
function unlockAudio() {
  try {
    audioCtx ??= new AudioContext();
    void audioCtx.resume();
  } catch {
    // 不支援 Web Audio 時就不播放聲音
  }
}

function playChime() {
  if (!audioCtx) return;
  const t0 = audioCtx.currentTime;
  [880, 660, 880].forEach((freq, i) => {
    const osc = audioCtx!.createOscillator();
    const gain = audioCtx!.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const start = t0 + i * 0.35;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.3, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.3);
    osc.connect(gain).connect(audioCtx!.destination);
    osc.start(start);
    osc.stop(start + 0.32);
  });
}

export function PomodoroApp() {
  const pomo = usePomodoro();
  const app = useAppState();
  const [now, setNow] = useState(() => Date.now());
  const [flash, setFlash] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [notifyPerm, setNotifyPerm] = useState<NotificationPermission | "unsupported">(() =>
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported",
  );

  const running = pomo?.status === "running";
  const soundOn = pomo?.settings.sound ?? true;

  // 計時中每 250ms 更新畫面並檢查是否到期
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      const finished = completeIfDue(getTaskTitle);
      if (finished) {
        if (soundOn) playChime();
        setFlash(FINISH_MESSAGE[finished]);
        if ("Notification" in window && Notification.permission === "granted" && document.hidden) {
          new Notification(`${MODE_LABEL[finished]}結束`, { body: FINISH_MESSAGE[finished] });
        }
      }
      setNow(Date.now());
    }, 250);
    return () => window.clearInterval(timer);
  }, [running, soundOn]);

  // 空白鍵：開始 / 暫停
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      if ((e.target as HTMLElement).closest("input, textarea, select, button, [contenteditable]")) return;
      e.preventDefault();
      unlockAudio();
      setNow(Date.now());
      toggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const total = pomo ? durationMs(pomo.mode, pomo.settings) : 1;
  const remaining = !pomo
    ? 0
    : pomo.status === "running" && pomo.endAt
      ? Math.min(pomo.endAt - now, pomo.remainingMs)
      : pomo.remainingMs;
  const clock = formatClock(remaining);

  // 分頁標題顯示倒數，切到其他分頁也看得到
  useEffect(() => {
    if (!pomo || pomo.status === "idle") return;
    document.title = `${pomo.status === "paused" ? "⏸ " : ""}${clock} ${MODE_LABEL[pomo.mode]}｜${SITE.name}`;
    return () => {
      document.title = PAGE_TITLE;
    };
  }, [clock, pomo]);

  if (!pomo || !app) {
    return <div className="flex flex-1 items-center justify-center text-sm text-slate-400">載入中…</div>;
  }

  const theme = THEME[pomo.mode];
  const today = todayStr();
  const openTasks = app.tasks.filter((t) => t.status !== "done" && !isArchived(t, today));
  const projectName = new Map(app.projects.map((p) => [p.id, p.name]));
  const currentTask = app.tasks.find((t) => t.id === pomo.taskId);
  const todaySessions = pomo.sessions.filter((s) => timestampToDateStr(s.endedAt) === today);
  const todayMinutes = todaySessions.reduce((sum, s) => sum + s.minutes, 0);
  const inCycle = pomo.cycleCount % pomo.settings.longEvery;

  const r = 120;
  const circumference = 2 * Math.PI * r;
  const progress = Math.min(1, Math.max(0, 1 - remaining / total));

  const onPrimary = () => {
    unlockAudio();
    setFlash(null);
    setNow(Date.now());
    toggle();
  };

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden bg-linear-to-br from-pink-100 via-slate-50 to-sky-100">
      {/* 背景光暈：玻璃卡片後面需要有色彩才看得出透明感 */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className={`blob absolute -left-24 -top-24 rounded-full bg-pink-300 blur-3xl transition-all duration-1000 ${theme.blobPink}`}
        />
        <div
          className={`blob absolute -bottom-32 -right-16 rounded-full bg-sky-300 blur-3xl transition-all duration-1000 ${theme.blobBlue}`}
          style={{ animationDelay: "-7s" }}
        />
        <div className="blob absolute left-1/3 top-1/2 h-64 w-64 rounded-full bg-fuchsia-200/50 blur-3xl" style={{ animationDelay: "-3s" }} />
      </div>

      <div className="relative h-full overflow-y-auto">
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-6 sm:px-8 lg:grid-cols-[1fr_320px]">
        {/* 計時器 */}
        <section className="glass rounded-3xl p-6">
          <div className="glass-soft mx-auto flex w-fit rounded-full p-1">
            {(Object.keys(MODE_LABEL) as PomodoroMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  if (pomo.status !== "idle" && !window.confirm("切換模式會中斷目前的計時，確定嗎？")) return;
                  switchMode(m);
                }}
                className={`rounded-full px-4 py-1.5 text-sm transition ${
                  pomo.mode === m
                    ? `bg-white/80 font-semibold shadow-sm ${THEME[m].text}`
                    : "text-slate-500 hover:bg-white/40 hover:text-slate-700"
                }`}
              >
                {MODE_LABEL[m]}
              </button>
            ))}
          </div>

          <div className="relative mx-auto my-8 aspect-square w-full max-w-[300px]">
            {/* 內圈的霧面玻璃圓盤 */}
            <div className="glass-soft absolute inset-[11%] rounded-full shadow-inner" />
            <svg viewBox="0 0 280 280" className="relative h-full w-full -rotate-90">
              <defs>
                <linearGradient id="pomo-ring" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={theme.ringFrom} />
                  <stop offset="100%" stopColor={theme.ringTo} />
                </linearGradient>
              </defs>
              <circle cx="140" cy="140" r={r} fill="none" strokeWidth="14" stroke="rgb(255 255 255 / 0.55)" />
              <circle
                cx="140"
                cy="140"
                r={r}
                fill="none"
                strokeWidth="14"
                strokeLinecap="round"
                stroke="url(#pomo-ring)"
                className="drop-shadow-[0_0_10px_rgb(244_114_182/0.45)] transition-[stroke-dashoffset] duration-300 ease-linear"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress)}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-sm font-semibold tracking-wide ${theme.text}`}>{MODE_LABEL[pomo.mode]}</span>
              <span className="mt-1 font-mono text-6xl font-semibold tabular-nums tracking-tight text-slate-700">
                {clock}
              </span>
              <span className="mt-2 text-xs text-slate-500">
                {pomo.status === "paused" ? "已暫停" : pomo.status === "running" ? "計時中" : "準備開始"}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <IconButton label="重設" onClick={reset} disabled={pomo.status === "idle"}>
              ↺
            </IconButton>
            <button
              type="button"
              onClick={onPrimary}
              className={`min-w-36 rounded-full bg-linear-to-r px-8 py-3 text-lg font-bold text-white shadow-lg [text-shadow:0_1px_2px_rgb(0_0_0/0.18)] ring-1 ring-white/60 transition hover:brightness-105 active:scale-95 ${theme.button}`}
            >
              {pomo.status === "running" ? "暫停" : pomo.status === "paused" ? "繼續" : "開始"}
            </button>
            <IconButton
              label="跳過這一段"
              onClick={() => {
                if (pomo.mode === "focus" && pomo.status !== "idle" && !window.confirm("跳過的番茄不會被記錄，確定嗎？")) return;
                skip();
              }}
            >
              ⏭
            </IconButton>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2" title={`每 ${pomo.settings.longEvery} 個番茄長休息一次`}>
            {Array.from({ length: pomo.settings.longEvery }, (_, i) => (
              <span
                key={i}
                className={`h-2.5 w-2.5 rounded-full ${
                  i < inCycle || (inCycle === 0 && pomo.cycleCount > 0 && pomo.mode === "long")
                    ? "bg-linear-to-br from-pink-400 to-sky-400 shadow-sm shadow-pink-300"
                    : "bg-white/70 ring-1 ring-slate-200/70"
                }`}
              />
            ))}
            <span className="ml-2 text-xs text-slate-500">距離長休息</span>
          </div>

          {flash && (
            <div className="glass-soft mx-auto mt-5 max-w-sm rounded-2xl px-4 py-2.5 text-center text-sm font-medium text-pink-600">
              {flash}
            </div>
          )}

          <p className="mt-6 text-center text-xs text-slate-500">快捷鍵：空白鍵 開始 / 暫停</p>
        </section>

        {/* 側欄 */}
        <aside className="space-y-4">
          <Card title="這個番茄要做什麼？">
            <select
              value={pomo.taskId ?? ""}
              onChange={(e) => setTask(e.target.value || null)}
              className="glass-soft w-full rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-pink-200"
            >
              <option value="">（不指定任務）</option>
              {openTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                  {t.projectId && projectName.get(t.projectId) ? `・${projectName.get(t.projectId)}` : ""}
                </option>
              ))}
            </select>
            {pomo.taskId && !currentTask && <p className="mt-1.5 text-xs text-amber-600">原本的任務已被刪除</p>}
            <p className="mt-2 text-xs text-slate-500">任務來自「個人任務」分頁</p>
          </Card>

          <Card title="今天">
            <div className="grid grid-cols-2 gap-3">
              <Stat value={todaySessions.length} unit="個番茄" tone="text-pink-500" />
              <Stat value={todayMinutes} unit="分鐘專注" tone="text-sky-500" />
            </div>
            <WeekChart sessions={pomo.sessions} today={today} />
          </Card>

          <Card title="今日紀錄">
            {todaySessions.length === 0 ? (
              <p className="py-3 text-center text-xs text-slate-500">完成第一個番茄後會出現在這裡</p>
            ) : (
              <ul className="space-y-1.5">
                {[...todaySessions].reverse().map((s) => (
                  <li key={s.id} className="group flex items-center gap-2 rounded-lg px-1 py-0.5 text-sm hover:bg-white/40">
                    <span>🍅</span>
                    <span className="w-11 shrink-0 tabular-nums text-xs text-slate-500">
                      {new Date(s.endedAt).toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit", hour12: false })}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-slate-700">{s.taskTitle ?? "未指定任務"}</span>
                    <span className="text-xs text-slate-500">{s.minutes} 分</span>
                    <button
                      type="button"
                      onClick={() => deleteSession(s.id)}
                      className="text-xs text-slate-400 opacity-0 transition group-hover:opacity-100 hover:text-red-500"
                      aria-label="刪除紀錄"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card
            title="設定"
            action={
              <button type="button" onClick={() => setShowSettings((v) => !v)} className="text-xs text-slate-500 hover:text-pink-500">
                {showSettings ? "收合" : "展開"}
              </button>
            }
          >
            {showSettings ? (
              <SettingsForm settings={pomo.settings} />
            ) : (
              <p className="text-xs text-slate-600">
                專注 {pomo.settings.focusMin} 分・短休息 {pomo.settings.shortMin} 分・長休息 {pomo.settings.longMin} 分
              </p>
            )}
            {notifyPerm === "default" && (
              <button
                type="button"
                onClick={() => void Notification.requestPermission().then(setNotifyPerm)}
                className="glass-soft mt-3 w-full rounded-xl px-3 py-1.5 text-xs text-slate-600 transition hover:bg-white/70"
              >
                開啟桌面通知（切到其他視窗時提醒）
              </button>
            )}
            {notifyPerm === "denied" && (
              <p className="mt-3 text-xs text-slate-500">桌面通知已被瀏覽器封鎖，可在網址列左側的網站設定中開啟。</p>
            )}
          </Card>
        </aside>
      </div>
      </div>
    </div>
  );
}

function SettingsForm({ settings }: { settings: PomodoroSettings }) {
  const numberField = (key: "focusMin" | "shortMin" | "longMin" | "longEvery", label: string, min: number, max: number, unit: string) => (
    <label className="flex items-center justify-between gap-3 text-sm text-slate-600">
      {label}
      <span className="flex items-center gap-1.5">
        <input
          type="number"
          min={min}
          max={max}
          value={settings[key]}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (Number.isFinite(v)) updateSettings({ [key]: Math.min(max, Math.max(min, Math.round(v))) });
          }}
          className="glass-soft w-16 rounded-lg px-2 py-1 text-right tabular-nums outline-none focus:ring-2 focus:ring-pink-200"
        />
        <span className="w-6 text-xs text-slate-500">{unit}</span>
      </span>
    </label>
  );
  const toggleField = (key: "autoStartBreaks" | "autoStartFocus" | "sound", label: string) => (
    <label className="flex cursor-pointer items-center justify-between text-sm text-slate-600">
      {label}
      <input
        type="checkbox"
        checked={settings[key]}
        onChange={(e) => updateSettings({ [key]: e.target.checked })}
        className="h-4 w-4 accent-pink-400"
      />
    </label>
  );
  return (
    <div className="space-y-2.5">
      {numberField("focusMin", "專注時間", 1, 90, "分")}
      {numberField("shortMin", "短休息", 1, 30, "分")}
      {numberField("longMin", "長休息", 1, 60, "分")}
      {numberField("longEvery", "長休息間隔", 2, 8, "個")}
      <div className="border-t border-white/70 pt-2.5" />
      {toggleField("autoStartBreaks", "自動開始休息")}
      {toggleField("autoStartFocus", "休息後自動開始專注")}
      {toggleField("sound", "結束時播放提示音")}
    </div>
  );
}

function WeekChart({ sessions, today }: { sessions: { endedAt: number }[]; today: string }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  const counts = days.map((d) => sessions.filter((s) => timestampToDateStr(s.endedAt) === d).length);
  const max = Math.max(1, ...counts);
  return (
    <div className="mt-4">
      <div className="mb-1 text-xs text-slate-500">近 7 天</div>
      <div className="flex h-20 items-end gap-1.5">
        {days.map((d, i) => (
          <div key={d} className="flex flex-1 flex-col items-center gap-1" title={`${d}：${counts[i]} 個番茄`}>
            <span className="text-[10px] tabular-nums text-slate-500">{counts[i] || ""}</span>
            <div
              className={`w-full rounded-t-md bg-linear-to-t ${
                d === today ? "from-sky-400 to-pink-400" : "from-sky-200/80 to-pink-200/80"
              }`}
              style={{ height: `${(counts[i] / max) * 48 + 2}px` }}
            />
            <span className={`text-[10px] ${d === today ? "font-semibold text-pink-500" : "text-slate-500"}`}>
              {weekdayLabel(d).slice(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Card({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="glass rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Stat({ value, unit, tone }: { value: number; unit: string; tone: string }) {
  return (
    <div className="glass-soft rounded-xl px-3 py-2">
      <div className={`text-2xl font-semibold tabular-nums ${tone}`}>{value}</div>
      <div className="text-xs text-slate-600">{unit}</div>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="glass-soft flex h-11 w-11 items-center justify-center rounded-full text-lg text-slate-500 transition hover:bg-white/70 hover:text-pink-500 disabled:opacity-40"
    >
      {children}
    </button>
  );
}
