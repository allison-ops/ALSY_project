"use client";

import { useRef, useState, type ReactNode } from "react";
import { shortDate, todayStr, weekdayLabel } from "@/lib/dates";
import { ASPECTS, LEVELS, draw, useFortunes, type Fortune, type LevelKey } from "@/lib/fortune";
import { SITE } from "@/lib/site";

type Phase = "idle" | "shaking" | "rising";

/** 籤等的配色：吉偏紅金、凶偏冷色 */
const LEVEL_STYLE: Record<LevelKey, { text: string; seal: string; chip: string }> = {
  daikichi: { text: "text-red-600", seal: "border-red-600 bg-red-50/80", chip: "bg-red-600 text-white" },
  chukichi: { text: "text-rose-600", seal: "border-rose-500 bg-rose-50/80", chip: "bg-rose-500 text-white" },
  shokichi: { text: "text-orange-600", seal: "border-orange-500 bg-orange-50/80", chip: "bg-orange-500 text-white" },
  kichi: { text: "text-amber-700", seal: "border-amber-600 bg-amber-50/80", chip: "bg-amber-600 text-white" },
  suekichi: { text: "text-lime-700", seal: "border-lime-600 bg-lime-50/80", chip: "bg-lime-600 text-white" },
  kyo: { text: "text-slate-600", seal: "border-slate-500 bg-slate-100/80", chip: "bg-slate-500 text-white" },
  daikyo: { text: "text-violet-900", seal: "border-violet-900 bg-violet-50/80", chip: "bg-violet-900 text-white" },
};

const SHAKE_MS = 1600;
const RISE_MS = 700;
const BROWN = "#4a230c";

export function FortuneApp() {
  const state = useFortunes();
  const [phase, setPhase] = useState<Phase>("idle");
  const [viewDate, setViewDate] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!state) {
    return <div className="flex flex-1 items-center justify-center bg-[#fbf0dc] text-sm text-amber-900/50">載入中…</div>;
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
      `【${SITE.name}・好運抽籤】${f.date} 第 ${f.number} 籤：${level.name}`,
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
    <div ref={scrollRef} className="relative min-h-0 flex-1 overflow-y-auto bg-[#fbf0dc]">
      <BackgroundClouds />

      <div className="relative mx-auto max-w-2xl px-4 py-6 sm:px-6">
        {/* 主視覺：仿廟宇插畫海報 */}
        <section className="relative overflow-hidden rounded-[28px] border-2 border-[#d9a85b] bg-[#fdf5e6] px-4 pt-6 shadow-[0_10px_30px_rgb(146_64_14/0.12)]">
          <CornerOrnaments />
          <p className="text-center text-sm font-medium tracking-widest text-[#7c4a21]">— {SITE.name}的廟宇求籤時間 —</p>
          <TempleTitle />
          <div className="mt-1 flex justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#9b1c1c] px-4 py-1 text-sm font-bold tracking-wider text-[#fff4dc] shadow-sm">
              {todays ? `今日第 ${todays.drawIndex ?? 1} 籤` : "誠心默念 求好籤"}
              <span aria-hidden>➤</span>
            </span>
          </div>

          <div className="relative mx-auto mt-2 h-[300px] max-w-[520px] sm:h-[330px]">
            <Mountains />
            <Temple />
            {/* 籤筒（可點擊抽籤） */}
            <button
              type="button"
              onClick={shake}
              disabled={busy}
              aria-label="搖動籤筒抽籤"
              className="absolute bottom-[96px] left-[2%] w-[27%] max-w-[130px] outline-none transition hover:-translate-y-1 focus-visible:drop-shadow-[0_0_8px_rgb(234_88_12/0.8)] sm:left-[4%]"
            >
              <FortuneCylinder phase={phase} />
            </button>
            <HandNote className="bottom-[60px] left-0 -rotate-6 sm:left-[2%]">搖一搖・抽籤</HandNote>
            {/* 筊杯（裝飾） */}
            <div className="absolute right-[2%] top-[34px] w-[24%] max-w-[110px] sm:right-[4%]">
              <MoonBlocks shaking={phase === "shaking"} />
            </div>
            <HandNote className="right-0 top-[118px] rotate-6 sm:right-[2%]">誠心祈求？</HandNote>
          </div>
        </section>

        {/* 抽籤按鈕 / 狀態 */}
        {(!todays || busy) && (
          <div className="mt-6 flex flex-col items-center">
            <PrimaryButton onClick={shake} disabled={busy}>
              {phase === "idle" ? "搖籤" : phase === "shaking" ? "搖籤中…" : "籤出來了！"}
            </PrimaryButton>
            <p className="mt-2 text-xs text-[#7c4a21]/70">靜下心來，默念想問的事，再搖動籤筒</p>
          </div>
        )}

        {shown && !busy && (
          <div className="mt-6">
            {viewDate && viewDate !== today && (
              <div className="mb-3 flex items-center justify-between rounded-xl border border-[#e7c48d] bg-[#fff8ea] px-3 py-2 text-sm text-[#7c4a21]">
                <span>正在查看 {shortDate(viewDate, today)}（{weekdayLabel(viewDate)}）的籤</span>
                <button type="button" onClick={() => setViewDate(null)} className="font-medium text-[#9b1c1c] hover:underline">
                  {todays ? "回到今天" : "返回"}
                </button>
              </div>
            )}
            <FortuneCard key={`${shown.date}-${shown.drawnAt}`} fortune={shown} />

            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <PrimaryButton onClick={shake}>再抽一次</PrimaryButton>
              <button
                type="button"
                onClick={() => void copy(shown)}
                className="rounded-full border-2 border-[#d9a85b] bg-[#fff8ea] px-5 py-2.5 text-sm font-bold text-[#7c4a21] transition hover:bg-white"
              >
                {copied ? "已複製 ✓" : "複製籤文分享"}
              </button>
            </div>
          </div>
        )}

        {past.length > 0 && !busy && (
          <section className="mt-9">
            <h2 className="mb-3 text-center text-sm font-bold tracking-widest text-[#7c4a21]">— 最近的籤 —</h2>
            <div className="flex flex-wrap justify-center gap-2">
              {past.slice(0, 14).map((f) => (
                <button
                  key={f.date}
                  type="button"
                  onClick={() => setViewDate(f.date)}
                  className={`flex items-center gap-2 rounded-full border-2 bg-[#fff8ea] py-1 pl-1 pr-3 text-xs transition hover:bg-white ${
                    viewDate === f.date ? "border-[#b45309]" : "border-[#ecd2a6]"
                  }`}
                >
                  <span className={`rounded-full px-2 py-0.5 font-serif-tc font-bold ${LEVEL_STYLE[f.level].chip}`}>
                    {LEVELS[f.level].name}
                  </span>
                  <span className="text-[#7c4a21]">
                    {shortDate(f.date, today)}（{weekdayLabel(f.date).slice(1)}）
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        <p className="mt-10 text-center text-xs text-[#7c4a21]/50">籤詩僅供娛樂參考，好運掌握在自己手裡 ✿</p>
      </div>
    </div>
  );
}

// ---- 插畫元件 ----

/** 橘紅漸層字＋深咖啡外框的標題，用 SVG 才能讓外框畫在填色後面 */
function TempleTitle() {
  return (
    <>
      <h1 className="sr-only">好運抽籤</h1>
      <svg viewBox="0 0 360 92" className="mx-auto mt-1 h-20 w-full max-w-[380px] sm:h-24" aria-hidden>
        <defs>
          <linearGradient id="title-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fb923c" />
            <stop offset="55%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>
        </defs>
        <text
          x="180"
          y="70"
          textAnchor="middle"
          fontSize="66"
          fontWeight="900"
          letterSpacing="6"
          className="font-serif-tc"
          fill="url(#title-fill)"
          stroke={BROWN}
          strokeWidth="9"
          strokeLinejoin="round"
          paintOrder="stroke"
        >
          『好運抽籤』
        </text>
      </svg>
    </>
  );
}

function FortuneCylinder({ phase }: { phase: Phase }) {
  const sticks = [
    { x: 30, h: 70, r: -8 },
    { x: 42, h: 84, r: -3 },
    { x: 54, h: 76, r: 2 },
    { x: 66, h: 88, r: 6 },
    { x: 78, h: 70, r: 10 },
  ];
  return (
    <svg viewBox="0 0 120 170" className={`w-full drop-shadow-lg ${phase === "shaking" ? "fortune-shake" : ""}`}>
      <defs>
        <linearGradient id="cyl-body" x1="0" x2="1">
          <stop offset="0%" stopColor="#c2410c" />
          <stop offset="40%" stopColor="#f97316" />
          <stop offset="70%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#c2410c" />
        </linearGradient>
      </defs>
      {sticks.map((s) => (
        <g key={s.x} transform={`rotate(${s.r} ${s.x + 4} 80)`}>
          <rect x={s.x} y={80 - s.h} width="8" height={s.h + 10} rx="3" fill="#fcd34d" stroke={BROWN} strokeWidth="2" />
          <rect x={s.x} y={80 - s.h} width="8" height="14" rx="3" fill="#dc2626" stroke={BROWN} strokeWidth="2" />
        </g>
      ))}
      {/* 被抽中的那一支 */}
      <g className={phase === "rising" ? "stick-rise" : ""} style={{ opacity: phase === "rising" ? 1 : 0 }}>
        <rect x="54" y="8" width="11" height="84" rx="3" fill="#fde68a" stroke={BROWN} strokeWidth="2" />
        <rect x="54" y="8" width="11" height="18" rx="3" fill="#dc2626" stroke={BROWN} strokeWidth="2" />
      </g>
      <path d="M18 74 L102 74 L96 162 L24 162 Z" fill="url(#cyl-body)" stroke={BROWN} strokeWidth="3" strokeLinejoin="round" />
      <path d="M18 74 L102 74 L100 88 L20 88 Z" fill="#ea580c" stroke={BROWN} strokeWidth="3" strokeLinejoin="round" />
      <circle cx="60" cy="122" r="17" fill="#fef3c7" stroke={BROWN} strokeWidth="3" />
      <text x="60" y="131" textAnchor="middle" fontSize="22" fontWeight="900" fill="#b91c1c" className="font-serif-tc">
        籤
      </text>
    </svg>
  );
}

function MoonBlocks({ shaking }: { shaking: boolean }) {
  // 一對筊杯：紅色半月形
  const block = "M8 40 C 8 14, 34 2, 58 8 C 44 14, 32 28, 34 52 C 22 54, 8 50, 8 40 Z";
  return (
    <svg viewBox="0 0 110 90" className={`w-full drop-shadow-md ${shaking ? "fortune-shake" : ""}`}>
      <g transform="rotate(-18 34 32)">
        <path d={block} fill="#ef4444" stroke={BROWN} strokeWidth="3" strokeLinejoin="round" />
        <path d="M18 34 C 20 22, 32 14, 44 12" fill="none" stroke="#fca5a5" strokeWidth="4" strokeLinecap="round" />
      </g>
      <g transform="translate(46 26) rotate(28 34 32)">
        <path d={block} fill="#dc2626" stroke={BROWN} strokeWidth="3" strokeLinejoin="round" />
        <path d="M18 34 C 20 22, 32 14, 44 12" fill="none" stroke="#f87171" strokeWidth="4" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function Temple() {
  const tiles = Array.from({ length: 22 }, (_, i) => 52 + i * 14);
  const upperTiles = Array.from({ length: 12 }, (_, i) => 128 + i * 13);
  return (
    <svg viewBox="0 0 400 260" className="absolute inset-x-0 bottom-0 mx-auto w-[92%]" aria-hidden>
      <g stroke={BROWN} strokeWidth="3" strokeLinejoin="round">
        {/* 屋脊裝飾 */}
        <circle cx="200" cy="22" r="7" fill="#fbbf24" />
        <path d="M120 40 Q 110 26 96 30 M280 40 Q 290 26 304 30" fill="none" strokeLinecap="round" />
        {/* 上層屋頂 */}
        <path d="M100 32 L300 32 L300 40 L100 40 Z" fill="#b45309" />
        <path d="M96 40 L304 40 Q 300 64 330 70 L70 70 Q 100 64 96 40 Z" fill="#f59e0b" />
        {upperTiles.map((x) => (
          <line key={x} x1={x} y1="44" x2={x - 2} y2="66" stroke="#c2410c" strokeWidth="2" />
        ))}
        {/* 斗拱層 */}
        <rect x="112" y="70" width="176" height="30" fill="#7c2d12" />
        {[132, 160, 188, 216, 244].map((x) => (
          <rect key={x} x={x} y="78" width="22" height="14" fill="#fcd34d" strokeWidth="2" />
        ))}
        {/* 下層屋頂 */}
        <path d="M60 100 L340 100 L340 108 L60 108 Z" fill="#b45309" />
        <path d="M56 108 L344 108 Q 340 132 384 140 L16 140 Q 60 132 56 108 Z" fill="#f59e0b" />
        {tiles.map((x) => (
          <line key={x} x1={x} y1="112" x2={x - 3} y2="136" stroke="#c2410c" strokeWidth="2" />
        ))}
        {/* 屋簷下的紅色橫樑 */}
        <rect x="48" y="140" width="304" height="14" fill="#dc2626" />
        {/* 牆身 */}
        <rect x="58" y="154" width="284" height="92" fill="#ea580c" />
        {/* 左右窗花 */}
        {[78, 262].map((x) => (
          <g key={x}>
            <rect x={x} y="168" width="60" height="64" fill="#b91c1c" />
            <rect x={x + 8} y="176" width="44" height="48" fill="none" stroke="#fcd34d" strokeWidth="3" />
            <path d={`M${x + 30} 184 L${x + 42} 200 L${x + 30} 216 L${x + 18} 200 Z`} fill="#fcd34d" strokeWidth="2" />
          </g>
        ))}
        {/* 正門 */}
        <rect x="162" y="164" width="76" height="82" fill="#7c2d12" />
        <rect x="168" y="170" width="30" height="76" fill="#b91c1c" strokeWidth="2" />
        <rect x="202" y="170" width="30" height="76" fill="#b91c1c" strokeWidth="2" />
        {[184, 200, 216, 232].map((y) => (
          <g key={y} stroke="none" fill="#fcd34d">
            <circle cx="176" cy={y} r="2.5" />
            <circle cx="190" cy={y} r="2.5" />
            <circle cx="210" cy={y} r="2.5" />
            <circle cx="224" cy={y} r="2.5" />
          </g>
        ))}
        <rect x="178" y="148" width="44" height="18" rx="2" fill="#fcd34d" />
        {/* 台基 */}
        <rect x="36" y="246" width="328" height="12" fill="#a16207" />
      </g>
      <text x="200" y="161" textAnchor="middle" fontSize="12" fontWeight="900" fill="#9b1c1c" className="font-serif-tc">
        好運宮
      </text>
    </svg>
  );
}

function Mountains() {
  return (
    <svg viewBox="0 0 400 200" className="absolute inset-x-0 bottom-6 w-full opacity-70" aria-hidden>
      <path d="M0 200 L70 110 L120 150 L200 60 L270 140 L320 100 L400 190 L400 200 Z" fill="#f3dcb5" />
      <path d="M0 200 L90 150 L150 175 L240 120 L330 170 L400 150 L400 200 Z" fill="#ecd0a2" />
    </svg>
  );
}

function BackgroundClouds() {
  const cloud = (
    <svg viewBox="0 0 120 50" className="w-full">
      <path
        d="M10 40 Q 4 26 18 22 Q 20 8 38 12 Q 48 0 64 10 Q 82 4 88 20 Q 108 18 110 34 Q 112 44 100 44 L 16 44 Q 10 44 10 40 Z"
        fill="#f6e1bf"
      />
      <path d="M30 34 Q 40 24 52 32 M66 30 Q 76 20 86 30" fill="none" stroke="#efcf9c" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute left-[4%] top-[6%] w-32 opacity-80">{cloud}</div>
      <div className="absolute right-[6%] top-[18%] w-44 opacity-70">{cloud}</div>
      <div className="absolute left-[10%] top-[52%] w-28 opacity-60">{cloud}</div>
      <div className="absolute bottom-[8%] right-[10%] w-36 opacity-60">{cloud}</div>
    </div>
  );
}

function CornerOrnaments() {
  const corner = "M2 26 L2 8 Q 2 2 8 2 L26 2";
  const pos = [
    "left-2 top-2",
    "right-2 top-2 rotate-90",
    "right-2 bottom-2 rotate-180",
    "left-2 bottom-2 -rotate-90",
  ];
  return (
    <>
      {pos.map((p) => (
        <svg key={p} viewBox="0 0 28 28" className={`pointer-events-none absolute h-7 w-7 ${p}`} aria-hidden>
          <path d={corner} fill="none" stroke="#d9a85b" strokeWidth="3" strokeLinecap="round" />
          <circle cx="9" cy="9" r="2.5" fill="#d9a85b" />
        </svg>
      ))}
    </>
  );
}

function HandNote({ className, children }: { className: string; children: string }) {
  return (
    <span
      className={`pointer-events-none absolute whitespace-nowrap rounded-md bg-[#fdf5e6]/80 px-1.5 text-xs font-bold tracking-wider text-[#4a230c] sm:text-sm ${className}`}
    >
      {children}
    </span>
  );
}

function PrimaryButton({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-full border-[3px] border-[#4a230c] bg-linear-to-b from-[#fb923c] to-[#dc2626] px-9 py-2.5 text-lg font-black tracking-[0.25em] text-[#fff8ea] shadow-[0_4px_0_#4a230c] transition hover:brightness-105 active:translate-y-[3px] active:shadow-[0_1px_0_#4a230c] disabled:opacity-70"
    >
      {children}
    </button>
  );
}

// ---- 籤紙 ----

function Stars({ value, className = "" }: { value: number; className?: string }) {
  return (
    <span className={`tracking-tight ${className}`} aria-label={`${value} 顆星`}>
      <span className="text-amber-500">{"★".repeat(value)}</span>
      <span className="text-amber-200">{"★".repeat(5 - value)}</span>
    </span>
  );
}

function FortuneCard({ fortune: f }: { fortune: Fortune }) {
  const level = LEVELS[f.level];
  const style = LEVEL_STYLE[f.level];
  return (
    <article className="fortune-reveal relative rounded-[24px] border-[3px] border-[#4a230c] bg-[#fffaf0] p-2 shadow-[0_6px_0_#d9a85b]">
      <div className="relative rounded-[18px] border-2 border-dashed border-[#d9a85b] px-5 pb-6 pt-8 sm:px-8">
        <CornerOrnaments />
        {/* 標頭 */}
        <div className="flex flex-col items-center">
          <span className="rounded-full bg-[#9b1c1c] px-4 py-0.5 text-sm font-bold tracking-[0.3em] text-[#fff4dc]">
            第 {f.number} 籤
          </span>
          <div className={`seal-stamp mt-4 flex h-28 w-28 items-center justify-center rounded-2xl border-[5px] ${style.seal}`}>
            <span className={`font-serif-tc text-5xl font-black ${style.text}`}>{level.name}</span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm font-medium text-[#7c4a21]">
            整體運勢 <Stars value={level.stars} className="text-lg" />
          </div>
        </div>

        {/* 籤詩 */}
        <div className="my-6 rounded-2xl bg-[#fdf0d8] px-4 py-5 text-center ring-2 ring-[#ecd2a6]">
          <div className="font-serif-tc grid gap-1.5 text-lg font-bold tracking-[0.2em] text-[#7c2d12] sm:grid-cols-2 sm:gap-x-6">
            {f.poem.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>

        <Section title="解籤">
          <p className="leading-relaxed text-stone-700">{f.summary}</p>
        </Section>

        <Section title="各項運勢">
          <ul className="space-y-2.5">
            {f.aspects.map((a, i) => (
              <li key={a.key} className="flex gap-3">
                <span className="w-6 text-center text-lg leading-6">{ASPECTS[i].icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#4a230c]">{ASPECTS[i].label}</span>
                    <Stars value={a.stars} className="text-sm" />
                  </div>
                  <p className="mt-0.5 text-sm leading-relaxed text-stone-600">{a.text}</p>
                </div>
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
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="font-serif-tc flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#dc2626] text-xs font-bold text-white ring-2 ring-[#4a230c]">
                宜
              </span>
              <div className="flex flex-wrap gap-1.5">
                {f.good.map((g) => (
                  <span key={g} className="rounded-full bg-red-50 px-2.5 py-0.5 text-red-700 ring-1 ring-red-200">
                    {g}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-serif-tc flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#4a230c] text-xs font-bold text-white">
                忌
              </span>
              <div className="flex flex-wrap gap-1.5">
                {f.bad.map((b) => (
                  <span key={b} className="rounded-full bg-stone-100 px-2.5 py-0.5 text-stone-600 ring-1 ring-stone-200">
                    {b}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {f.remedy && (
          <div className="mt-5 rounded-xl border-2 border-[#d9a85b] bg-[#fdf0d8] px-4 py-3 text-sm text-[#7c4a21]">
            <span className="font-bold">🧧 化解建議：</span>
            {f.remedy}
          </div>
        )}
      </div>
    </article>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-5">
      <h3 className="font-serif-tc mb-2 flex items-center gap-2 text-sm font-black tracking-widest text-[#9b1c1c]">
        <span className="h-0.5 w-4 rounded bg-[#d9a85b]" />
        {title}
        <span className="h-0.5 flex-1 rounded bg-[#ecd2a6]" />
      </h3>
      {children}
    </section>
  );
}

function Lucky({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-xl bg-[#fdf0d8] px-2 py-2.5 text-center ring-2 ring-[#ecd2a6]">
      <div className="text-[11px] font-medium text-[#7c4a21]/80">{label}</div>
      <div className="mt-0.5 text-sm font-bold text-[#4a230c]">{children}</div>
    </div>
  );
}
