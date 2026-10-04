"use client";

import { useRef, useState, type ReactNode } from "react";
import { shortDate, todayStr, weekdayLabel } from "@/lib/dates";
import { ASPECTS, LEVELS, draw, useFortunes, type Fortune, type LevelKey } from "@/lib/fortune";
import { SITE } from "@/lib/site";

type Phase = "idle" | "shaking" | "rising";

/** 籤等配色：吉偏暖粉、凶偏冷色 */
const LEVEL_STYLE: Record<LevelKey, { text: string; ring: string; chip: string }> = {
  daikichi: { text: "text-rose-600", ring: "#f43f5e", chip: "bg-rose-500 text-white" },
  chukichi: { text: "text-pink-600", ring: "#ec4899", chip: "bg-pink-500 text-white" },
  shokichi: { text: "text-fuchsia-600", ring: "#d946ef", chip: "bg-fuchsia-500 text-white" },
  kichi: { text: "text-sky-600", ring: "#0ea5e9", chip: "bg-sky-500 text-white" },
  suekichi: { text: "text-teal-600", ring: "#14b8a6", chip: "bg-teal-500 text-white" },
  kyo: { text: "text-slate-600", ring: "#64748b", chip: "bg-slate-500 text-white" },
  daikyo: { text: "text-indigo-900", ring: "#312e81", chip: "bg-indigo-900 text-white" },
};

const SHAKE_MS = 1600;
const RISE_MS = 750;
const NAVY = "#2c3a6b";

export function FortuneApp() {
  const state = useFortunes();
  const [phase, setPhase] = useState<Phase>("idle");
  const [viewDate, setViewDate] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!state) {
    return <div className="flex flex-1 items-center justify-center bg-sky-50 text-sm text-slate-400">載入中…</div>;
  }

  const today = todayStr();
  const todays = state.history.find((f) => f.date === today);
  const shown = (viewDate && state.history.find((f) => f.date === viewDate)) || todays;
  const past = state.history.filter((f) => f.date !== today);
  const busy = phase !== "idle";

  const shake = () => {
    if (busy) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // 再抽一次時先捲回上方，讓使用者看到搖籤動畫
    scrollRef.current?.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    setPhase("shaking");
    window.setTimeout(() => setPhase("rising"), reduced ? 0 : SHAKE_MS);
    window.setTimeout(
      () => {
        draw();
        setViewDate(null);
        setPhase("idle");
      },
      reduced ? 0 : SHAKE_MS + RISE_MS,
    );
  };

  const copy = async (f: Fortune) => {
    const level = LEVELS[f.level];
    const text = [
      `【${SITE.name}・好運籤】${f.date} 第 ${f.number} 籤：${level.name}`,
      f.poem.join("，") + "。",
      f.summary,
      ...ASPECTS.map((a, i) => `${a.label} ${"★".repeat(f.aspects[i].stars)}${"☆".repeat(5 - f.aspects[i].stars)}`),
      `幸運色：${f.luckyColor.name}・幸運數字：${f.luckyNumber}・幸運方位：${f.luckyDirection}`,
      `宜：${f.good.join("、")}　忌：${f.bad.join("、")}`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("複製下面的文字：", text);
    }
  };

  return (
    <div ref={scrollRef} className="relative min-h-0 flex-1 overflow-y-auto bg-linear-to-b from-sky-100 via-white to-pink-100">
      <div className="relative mx-auto max-w-2xl px-4 py-6 sm:px-6">
        {/* 主視覺：雲上的六角籤筒 */}
        <section className="relative overflow-hidden rounded-[32px] bg-linear-to-b from-[#bfe3ff] via-[#e6f1ff] to-[#ffdcec] px-4 pb-4 pt-7 shadow-[0_12px_40px_rgb(125_160_220/0.25)] ring-1 ring-white">
          <div className="relative z-10 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.5em] text-[#2c3a6b]/50">Fortune of the day</p>
            <h1 className="font-serif-tc mt-1 text-4xl font-black tracking-[0.3em] text-[#2c3a6b] sm:text-5xl">好運籤</h1>
            <p className="mt-2 text-sm text-[#2c3a6b]/70">
              {todays ? `今天已求得 ${todays.drawIndex ?? 1} 支籤` : "把心願輕輕說給雲聽，再搖一搖籤筒"}
            </p>
          </div>

          <button
            type="button"
            onClick={shake}
            disabled={busy}
            aria-label="搖動六角籤筒抽籤"
            className="relative mx-auto -mt-4 block w-full max-w-[460px] outline-none focus-visible:drop-shadow-[0_0_10px_rgb(236_72_153/0.6)]"
          >
            <SkyScene phase={phase} />
          </button>
        </section>

        {(!todays || busy) && (
          <div className="mt-6 flex flex-col items-center">
            <PrimaryButton onClick={shake} disabled={busy}>
              {phase === "idle" ? "搖籤" : phase === "shaking" ? "搖籤中…" : "籤出來了！"}
            </PrimaryButton>
            <p className="mt-2 text-xs text-slate-500">點籤筒或按鈕都可以抽籤</p>
          </div>
        )}

        {shown && !busy && (
          <div className="mt-6">
            {viewDate && viewDate !== today && (
              <div className="glass-panel mb-3 flex items-center justify-between rounded-xl px-3 py-2 text-sm text-slate-600">
                <span>正在查看 {shortDate(viewDate, today)}（{weekdayLabel(viewDate)}）的籤</span>
                <button type="button" onClick={() => setViewDate(null)} className="font-medium text-pink-500 hover:underline">
                  {todays ? "回到今天" : "返回"}
                </button>
              </div>
            )}
            <FortuneSlip key={`${shown.date}-${shown.drawnAt}`} fortune={shown} />

            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <PrimaryButton onClick={shake}>再抽一次</PrimaryButton>
              <button
                type="button"
                onClick={() => void copy(shown)}
                className="glass-panel rounded-full px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-white"
              >
                {copied ? "已複製 ✓" : "複製籤文分享"}
              </button>
            </div>
          </div>
        )}

        {past.length > 0 && !busy && (
          <section className="mt-9">
            <h2 className="mb-3 text-center text-sm font-bold tracking-widest text-slate-500">最近的籤</h2>
            <div className="flex flex-wrap justify-center gap-2">
              {past.slice(0, 14).map((f) => (
                <button
                  key={f.date}
                  type="button"
                  onClick={() => setViewDate(f.date)}
                  className={`glass-panel flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-xs transition hover:bg-white ${
                    viewDate === f.date ? "ring-2 ring-pink-300" : ""
                  }`}
                >
                  <span className={`font-serif-tc rounded-full px-2 py-0.5 font-bold ${LEVEL_STYLE[f.level].chip}`}>
                    {LEVELS[f.level].name}
                  </span>
                  <span className="text-slate-600">
                    {shortDate(f.date, today)}（{weekdayLabel(f.date).slice(1)}）
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        <p className="mt-10 text-center text-xs text-slate-400">籤詩僅供娛樂參考，好運掌握在自己手裡 ✦</p>
      </div>
    </div>
  );
}

// ---- 插畫：雲上的六角籤筒 ----

/** 繩子是 M0 30 Q200 90 400 30 的二次曲線，x 從 0 到 400 時的 y 值 */
function ropeY(x: number): number {
  const t = x / 400;
  return 30 + 120 * t * (1 - t);
}

const SLIPS = [
  { x: 36, c: "#ffffff", r: -6 },
  { x: 86, c: "#ffe4f0", r: 4 },
  { x: 138, c: "#e0f2ff", r: -3 },
  { x: 262, c: "#ffffff", r: 5 },
  { x: 314, c: "#ffe4f0", r: -4 },
  { x: 364, c: "#e0f2ff", r: 3 },
];

const LANTERNS = [
  { x: 56, y: 156, s: 1, d: "0s" },
  { x: 348, y: 134, s: 0.85, d: "-2s" },
  { x: 322, y: 214, s: 0.62, d: "-3.5s" },
];

const SPARKLES = [
  [112, 104, 6],
  [292, 92, 5],
  [128, 218, 4],
  [270, 236, 5],
  [32, 236, 4],
  [374, 262, 4],
];

function SkyScene({ phase }: { phase: Phase }) {
  return (
    <svg viewBox="0 0 400 320" className="w-full" aria-hidden>
      <defs>
        <radialGradient id="sun-halo">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="60%" stopColor="#fff4fa" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="box-front" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b4c8a" />
          <stop offset="100%" stopColor={NAVY} />
        </linearGradient>
        <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#f5b84a" />
        </linearGradient>
        <radialGradient id="lantern-glow">
          <stop offset="0%" stopColor="#ffd9a8" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ffd9a8" stopOpacity="0" />
        </radialGradient>
        {/* 籤枝只在籤筒孔的上方顯示，看起來像從孔裡滑出來 */}
        <clipPath id="above-hole">
          <rect x="0" y="0" width="400" height="125" />
        </clipPath>
      </defs>

      {/* 光暈 */}
      <circle cx="200" cy="180" r="120" fill="url(#sun-halo)" />
      <circle cx="200" cy="180" r="88" fill="none" stroke="#ffffff" strokeOpacity="0.8" strokeWidth="1.5" strokeDasharray="2 6" />

      {/* 綁籤的繩子與籤紙 */}
      <path d="M0 30 Q 200 90 400 30" fill="none" stroke="#d9a37a" strokeWidth="2.5" />
      {SLIPS.map((s) => {
        const y = ropeY(s.x);
        return (
          <g key={s.x} transform={`rotate(${s.r} ${s.x} ${y})`}>
            <rect x={s.x - 5} y={y} width="10" height="30" rx="1.5" fill={s.c} stroke="#cbd5e1" strokeWidth="0.8" />
            <circle cx={s.x} cy={y + 1} r="3" fill="#f9a8d4" />
            <line x1={s.x - 2.5} y1={y + 11} x2={s.x + 2.5} y2={y + 11} stroke="#cbd5e1" strokeWidth="1" />
            <line x1={s.x - 2.5} y1={y + 17} x2={s.x + 2.5} y2={y + 17} stroke="#cbd5e1" strokeWidth="1" />
          </g>
        );
      })}

      {/* 天燈 */}
      {LANTERNS.map((l) => (
        <g key={l.x} className="lantern-float" style={{ animationDelay: l.d }}>
          <g transform={`translate(${l.x} ${l.y}) scale(${l.s})`}>
            <circle cx="0" cy="4" r="30" fill="url(#lantern-glow)" />
            <path d="M-11 -14 L11 -14 L14 16 Q 0 20 -14 16 Z" fill="#ffe2b8" stroke="#f0a35e" strokeWidth="1.5" />
            <path d="M-4 -14 L-5 16 M4 -14 L5 16" stroke="#f0a35e" strokeWidth="1" opacity="0.6" />
            <ellipse cx="0" cy="17" rx="5" ry="2" fill="#ff9f43" opacity="0.8" />
          </g>
        </g>
      ))}

      {/* 四角星光 */}
      {SPARKLES.map(([x, y, r]) => (
        <path
          key={`${x}-${y}`}
          d={`M${x} ${y - r} Q ${x} ${y} ${x + r} ${y} Q ${x} ${y} ${x} ${y + r} Q ${x} ${y} ${x - r} ${y} Q ${x} ${y} ${x} ${y - r} Z`}
          fill="#ffffff"
          stroke="#fbcfe8"
          strokeWidth="0.8"
        />
      ))}

      {/* 雲朵底座 */}
      <g fill="#ffffff">
        <ellipse cx="200" cy="288" rx="150" ry="22" opacity="0.9" />
        <circle cx="120" cy="274" r="30" />
        <circle cx="165" cy="262" r="38" />
        <circle cx="228" cy="260" r="40" />
        <circle cx="282" cy="274" r="30" />
      </g>
      <ellipse cx="200" cy="296" rx="160" ry="14" fill="#fbcfe8" opacity="0.35" />

      {/* 六角籤筒（搖動時整個晃動） */}
      <g className={phase === "shaking" ? "fortune-shake" : ""} style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}>
        {/* 籤枝 */}
        <g clipPath="url(#above-hole)">
          <g
            className={phase === "rising" ? "stick-out" : ""}
            style={phase === "rising" ? undefined : { transform: "translateY(70px)" }}
          >
            <rect x="195" y="54" width="10" height="74" rx="2" fill="#fff7e6" stroke="#d6b88a" strokeWidth="1.2" />
            <rect x="195" y="54" width="10" height="14" rx="2" fill="#f472b6" />
          </g>
        </g>

        {/* 頂面與籤孔 */}
        <polygon points="150,128 175,116 225,116 250,128 225,140 175,140" fill="#5468ad" stroke={NAVY} strokeWidth="2" strokeLinejoin="round" />
        <ellipse cx="200" cy="127" rx="8" ry="3.5" fill="#1b2447" />

        {/* 側面與正面 */}
        <polygon points="150,128 175,140 175,248 150,236" fill="#26335f" stroke={NAVY} strokeWidth="2" strokeLinejoin="round" />
        <polygon points="225,140 250,128 250,236 225,248" fill="#34468a" stroke={NAVY} strokeWidth="2" strokeLinejoin="round" />
        <polygon points="175,140 225,140 225,248 175,248" fill="url(#box-front)" stroke={NAVY} strokeWidth="2" strokeLinejoin="round" />

        {/* 金色飾帶 */}
        <g stroke="url(#gold)" strokeWidth="3.5" fill="none" strokeLinejoin="round">
          <polyline points="150,142 175,154 225,154 250,142" />
          <polyline points="150,224 175,236 225,236 250,224" />
        </g>

        {/* 正面的星形徽章與點點金光 */}
        <circle cx="200" cy="195" r="19" fill={NAVY} stroke="url(#gold)" strokeWidth="3" />
        <path d="M200 181 L203.5 191.5 L214 195 L203.5 198.5 L200 209 L196.5 198.5 L186 195 L196.5 191.5 Z" fill="url(#gold)" />
        <circle cx="160" cy="188" r="2" fill="#fde68a" opacity="0.8" />
        <circle cx="240" cy="184" r="2" fill="#fde68a" opacity="0.8" />
        <circle cx="163" cy="206" r="1.4" fill="#fde68a" opacity="0.6" />
        <circle cx="238" cy="208" r="1.4" fill="#fde68a" opacity="0.6" />

        {/* 粉紅流蘇 */}
        <path d="M250 152 Q 262 160 258 178" fill="none" stroke="#f472b6" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="258" cy="180" r="4" fill="#f472b6" />
        <path d="M255 183 L253 202 M258 184 L258 204 M261 183 L263 202" stroke="#f9a8d4" strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function PrimaryButton({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-full bg-linear-to-r from-sky-400 to-pink-400 px-9 py-2.5 text-lg font-bold tracking-[0.25em] text-white shadow-lg shadow-pink-200/80 ring-1 ring-white/70 transition hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0 disabled:opacity-70"
    >
      {children}
    </button>
  );
}

// ---- 籤紙 ----

function Stars({ value, className = "" }: { value: number; className?: string }) {
  return (
    <span className={`tracking-tight ${className}`} aria-label={`${value} 顆星`}>
      <span className="text-amber-400">{"★".repeat(value)}</span>
      <span className="text-slate-200">{"★".repeat(5 - value)}</span>
    </span>
  );
}

/** 籤等徽章：放射光芒環繞的圓形 */
function LevelBadge({ level }: { level: LevelKey }) {
  const style = LEVEL_STYLE[level];
  const rays = Array.from({ length: 16 }, (_, i) => i * 22.5);
  return (
    <div className="fortune-reveal relative flex h-36 w-36 items-center justify-center">
      <svg viewBox="0 0 140 140" className="absolute inset-0 h-full w-full" aria-hidden>
        {rays.map((deg) => (
          <rect key={deg} x="68.5" y="4" width="3" height="16" rx="1.5" fill={style.ring} opacity="0.35" transform={`rotate(${deg} 70 70)`} />
        ))}
        <circle cx="70" cy="70" r="46" fill="#ffffff" stroke={style.ring} strokeWidth="3" />
        <circle cx="70" cy="70" r="40" fill="none" stroke={style.ring} strokeWidth="1" strokeDasharray="3 4" opacity="0.6" />
      </svg>
      <span className={`font-serif-tc relative text-4xl font-black ${style.text}`}>{LEVELS[level].name}</span>
    </div>
  );
}

function FortuneSlip({ fortune: f }: { fortune: Fortune }) {
  const level = LEVELS[f.level];
  return (
    <article className="fortune-reveal glass-panel relative overflow-hidden rounded-[28px]">
      {/* 籤紙頂端的封條 */}
      <div className="flex items-center justify-center gap-3 bg-[#2c3a6b] py-2.5 text-[#fde68a]">
        <span className="h-px w-8 bg-[#fde68a]/50" />
        <span className="font-serif-tc text-sm font-bold tracking-[0.4em]">第 {f.number} 籤</span>
        <span className="h-px w-8 bg-[#fde68a]/50" />
      </div>

      <div className="px-5 pb-7 pt-5 sm:px-8">
        <div className="grid items-center gap-4 sm:grid-cols-[auto_1fr]">
          <div className="flex flex-col items-center">
            <LevelBadge level={f.level} />
            <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
              整體 <Stars value={level.stars} className="text-base" />
            </div>
          </div>

          {/* 直式籤詩，由右至左閱讀 */}
          <div className="flex justify-center">
            <div className="font-serif-tc flex flex-row-reverse gap-3 rounded-2xl bg-white/70 px-5 py-4 ring-1 ring-pink-100">
              {f.poem.map((line) => (
                <p key={line} className="text-lg font-bold leading-[1.35] tracking-[0.25em] text-[#2c3a6b] [writing-mode:vertical-rl]">
                  {line}
                </p>
              ))}
            </div>
          </div>
        </div>

        <Section title="解籤">
          <p className="leading-relaxed text-slate-700">{f.summary}</p>
        </Section>

        <Section title="各項運勢">
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {f.aspects.map((a, i) => (
              <li key={a.key} className="rounded-xl bg-white/60 px-3 py-2.5 ring-1 ring-sky-100">
                <div className="flex items-center gap-2">
                  <span className="text-base">{ASPECTS[i].icon}</span>
                  <span className="text-sm font-bold text-slate-800">{ASPECTS[i].label}</span>
                  <Stars value={a.stars} className="ml-auto text-sm" />
                </div>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{a.text}</p>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="幸運指南">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Lucky label="幸運色">
              <span className="flex items-center justify-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded-full ring-1 ring-black/10" style={{ backgroundColor: f.luckyColor.hex }} />
                {f.luckyColor.name}
              </span>
            </Lucky>
            <Lucky label="幸運數字">{f.luckyNumber}</Lucky>
            <Lucky label="幸運方位">{f.luckyDirection}方</Lucky>
            <Lucky label="幸運小物">{f.luckyItem}</Lucky>
          </div>
        </Section>

        <Section title="今日宜忌">
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <div className="rounded-xl bg-pink-50/80 px-3 py-2.5 ring-1 ring-pink-100">
              <div className="font-serif-tc mb-1.5 font-bold text-pink-600">宜</div>
              <div className="flex flex-wrap gap-1.5">
                {f.good.map((g) => (
                  <span key={g} className="rounded-full bg-white px-2.5 py-0.5 text-pink-700 ring-1 ring-pink-200">
                    {g}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-xl bg-sky-50/80 px-3 py-2.5 ring-1 ring-sky-100">
              <div className="font-serif-tc mb-1.5 font-bold text-sky-700">忌</div>
              <div className="flex flex-wrap gap-1.5">
                {f.bad.map((b) => (
                  <span key={b} className="rounded-full bg-white px-2.5 py-0.5 text-sky-800 ring-1 ring-sky-200">
                    {b}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {f.remedy && (
          <div className="mt-5 rounded-xl bg-linear-to-r from-sky-50 to-pink-50 px-4 py-3 text-sm text-slate-700 ring-1 ring-pink-100">
            <span className="font-bold text-pink-600">✦ 轉運小提醒：</span>
            {f.remedy}
          </div>
        )}
      </div>
    </article>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h3 className="mb-2.5 flex items-center gap-2 text-sm font-bold tracking-widest text-[#2c3a6b]">
        <span className="text-pink-400">✦</span>
        {title}
      </h3>
      {children}
    </section>
  );
}

function Lucky({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-xl bg-white/60 px-2 py-2.5 text-center ring-1 ring-sky-100">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className="mt-0.5 text-sm font-bold text-slate-800">{children}</div>
    </div>
  );
}
