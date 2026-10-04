"use client";

import { createLocalStore } from "./localStore";
import { todayStr } from "./dates";

export type LevelKey = "daikichi" | "chukichi" | "shokichi" | "kichi" | "suekichi" | "kyo" | "daikyo";
type Tier = "good" | "mid" | "bad";

interface Level {
  name: string;
  /** 抽中機率權重（總和 100） */
  weight: number;
  /** 整體運勢星等 1~5 */
  stars: number;
  tier: Tier;
  poems: string[][];
  summaries: string[];
}

export const LEVELS: Record<LevelKey, Level> = {
  daikichi: {
    name: "大吉",
    weight: 10,
    stars: 5,
    tier: "good",
    poems: [
      ["旭日東昇照九州", "春風得意馬蹄遊", "所求諸事皆如願", "一路花開滿枝頭"],
      ["龍躍深淵上碧霄", "風雲際會正逢潮", "今朝好運隨身轉", "萬事亨通步步高"],
      ["金雞報曉喜盈門", "貴人相助福星臨", "種下善因今結果", "心想事成樂欣欣"],
    ],
    summaries: [
      "天時、地利、人和一次到位！今天是把想做的事往前推一大步的好日子，大膽提出想法、主動爭取機會，成果會超乎預期。",
      "好運滿檔的一天，連平常卡關的事情都可能迎刃而解。記得把這份好心情分享給身邊的人，福氣會加倍回來。",
    ],
  },
  chukichi: {
    name: "中吉",
    weight: 15,
    stars: 4,
    tier: "good",
    poems: [
      ["雲開見月照前川", "舟行順水好揚帆", "雖有微風輕拂浪", "不妨穩步到江南"],
      ["梅花初綻報春來", "一點紅心向日開", "用心耕耘終有獲", "前程漸展喜盈腮"],
      ["青山綠水路迢迢", "步步登高見遠霄", "只要初心常不改", "佳音自會乘風飄"],
    ],
    summaries: [
      "整體運勢順暢，努力會被看見。小小的波折只是提醒你再細心一點，按部就班就能有不錯的收穫。",
      "今天適合推進手上的計畫，與人合作特別順利。保持積極，好消息正在路上。",
    ],
  },
  shokichi: {
    name: "小吉",
    weight: 18,
    stars: 4,
    tier: "mid",
    poems: [
      ["細雨潤物本無聲", "小芽破土向陽生", "莫嫌今日收穫少", "積少成多自然成"],
      ["月缺還有月圓時", "小舟緩緩過清溪", "一步一腳皆踏實", "好事悄悄已來齊"],
      ["春蠶吐絲不停歇", "點滴功夫日日積", "今朝小有好消息", "笑看雲淡與風輕"],
    ],
    summaries: [
      "會有一些小確幸出現，可能是一句稱讚、一杯好咖啡或一個順利的小進展。留心生活中的細節，好運藏在裡面。",
      "穩中帶喜的一天。不必追求大突破，把今天該做的事做好，就是最好的累積。",
    ],
  },
  kichi: {
    name: "吉",
    weight: 20,
    stars: 3,
    tier: "mid",
    poems: [
      ["平平穩穩過橋頭", "不急不徐自有收", "順其自然心自在", "清茶一盞解千愁"],
      ["庭前花草自芬芳", "日日平安即吉祥", "守住本心行正道", "福氣自然繞身旁"],
      ["行到水窮坐看雲", "靜中自有好光陰", "今日宜守不宜進", "安然自得是知音"],
    ],
    summaries: [
      "平穩順遂的一天，沒有大起大落。適合整理、規劃與完成例行工作，平安就是最大的福氣。",
      "運勢中規中矩，按照自己的節奏走就好。給自己留一點喘息的空間，心情會更輕鬆。",
    ],
  },
  suekichi: {
    name: "末吉",
    weight: 15,
    stars: 2,
    tier: "mid",
    poems: [
      ["烏雲遮月暫無光", "耐心守候待天晴", "今日諸事宜緩辦", "轉機就在不遠方"],
      ["枯木逢春尚有時", "莫因眼前便遲疑", "先苦後甘是常理", "熬過今朝見新枝"],
      ["山路彎彎多曲折", "回頭一望已千層", "雖然今日稍辛苦", "明朝自有好風生"],
    ],
    summaries: [
      "開頭可能有點不順，但越到後面越好。重要的決定可以晚一點再做，先把基礎打穩。",
      "好運還在醞釀中，今天需要多一點耐心。別急著看結果，你現在的努力正在為之後鋪路。",
    ],
  },
  kyo: {
    name: "凶",
    weight: 14,
    stars: 2,
    tier: "bad",
    poems: [
      ["風起雲湧浪頭高", "行船且慢莫心焦", "凡事三思再出手", "守得雲開見月梢"],
      ["路上石多需留神", "言多必失要謹慎", "退一步來天地闊", "靜待時機轉好運"],
      ["烏鴉枝頭叫幾聲", "提醒行人要小心", "今日低調為上策", "明天依舊是晴空"],
    ],
    summaries: [
      "今天容易遇到小阻礙或溝通誤會，凡事多確認一次。放慢腳步、保持低調，就能把影響降到最低。",
      "運勢稍弱，不適合衝動行事或做重大決定。把今天當成充電日，照顧好自己最重要。",
    ],
  },
  daikyo: {
    name: "大凶",
    weight: 8,
    stars: 1,
    tier: "bad",
    poems: [
      ["狂風驟雨打窗前", "萬事暫停且安眠", "物極必反是天理", "谷底之後必向前"],
      ["烏雲壓頂雷聲隆", "諸事不順莫逞強", "休養生息蓄力量", "雨後彩虹掛天邊"],
      ["今日運勢落谷底", "反而無處可再跌", "放下煩憂早休息", "明天醒來又一天"],
    ],
    summaries: [
      "抽到大凶反而是好事——運勢已經到谷底，接下來只會往上走！今天保守行事、多休息，把能量留給明天。",
      "今天諸事不宜勉強，遇到不順也別往心裡去。按照下方的化解建議做，壞運氣很快就會過去。",
    ],
  },
};

export const LEVEL_ORDER: LevelKey[] = ["daikichi", "chukichi", "shokichi", "kichi", "suekichi", "kyo", "daikyo"];

export const ASPECTS = [
  { key: "work", label: "事業學業", icon: "💼" },
  { key: "money", label: "財運", icon: "💰" },
  { key: "love", label: "愛情", icon: "💗" },
  { key: "health", label: "健康", icon: "🍀" },
  { key: "social", label: "人際", icon: "🤝" },
] as const;

type AspectKey = (typeof ASPECTS)[number]["key"];

const ASPECT_TEXT: Record<AspectKey, Record<Tier, string[]>> = {
  work: {
    good: ["思路清晰，效率極高，適合挑戰困難的任務或提出新企劃。", "主管或老師會注意到你的表現，把握機會展現實力。"],
    mid: ["按部就班就能完成進度，細節多檢查一次會更完美。", "適合整理資料、規劃下一步，不急著求快。"],
    bad: ["容易分心或出小錯，重要文件務必再三確認。", "今天不宜做重大決定，先蒐集資訊、聽聽別人意見。"],
  },
  money: {
    good: ["偏財運不錯，可能有意外的小收入或優惠。", "理財判斷準確，適合檢視投資與預算規劃。"],
    mid: ["收支平衡，維持記帳習慣就很穩。", "小額消費帶來好心情，但大筆支出再想一想。"],
    bad: ["容易衝動購物，結帳前先放進購物車冷靜一天。", "借貸與投資今天都先緩一緩，守財為上。"],
  },
  love: {
    good: ["桃花朵朵開，單身者容易遇到聊得來的人；有伴的人感情甜蜜。", "主動表達心意會得到溫暖的回應。"],
    mid: ["感情平穩，一起吃頓飯、散個步就很幸福。", "多一點傾聽，關係會更靠近。"],
    bad: ["說話容易被誤解，有情緒時先深呼吸再開口。", "今天不適合翻舊帳，給彼此一點空間。"],
  },
  health: {
    good: ["精神飽滿、活力十足，很適合運動流汗。", "身心狀態極佳，好好享受這份輕盈感。"],
    mid: ["記得多喝水、起身伸展，久坐後動一動。", "作息正常就很好，今晚早點睡會更有精神。"],
    bad: ["容易疲倦，別硬撐，適時休息最重要。", "注意飲食與保暖，避免熬夜與生冷食物。"],
  },
  social: {
    good: ["人緣超好，容易得到貴人幫忙，適合拓展人脈。", "朋友會帶來好消息或有趣的邀約。"],
    mid: ["與人相處和氣融融，一句真誠的感謝能拉近距離。", "適合和老朋友聯絡，聊聊近況。"],
    bad: ["避免捲入是非八卦，保持適當距離。", "團隊意見分歧時先別急著表態，聽完再說。"],
  },
};

const LUCKY_COLORS = [
  { name: "櫻花粉", hex: "#f9a8d4" },
  { name: "天空藍", hex: "#7dd3fc" },
  { name: "薄荷綠", hex: "#6ee7b7" },
  { name: "檸檬黃", hex: "#fde047" },
  { name: "薰衣草紫", hex: "#c4b5fd" },
  { name: "珊瑚橘", hex: "#fdba74" },
  { name: "象牙白", hex: "#f5f5f0" },
  { name: "酒紅色", hex: "#9f1239" },
  { name: "深海藍", hex: "#1e3a8a" },
  { name: "森林綠", hex: "#166534" },
];
const DIRECTIONS = ["東", "南", "西", "北", "東南", "東北", "西南", "西北"];
const LUCKY_ITEMS = ["一杯熱茶", "筆記本", "耳機", "小盆栽", "手錶", "雨傘", "巧克力", "香氛", "舊照片", "一本書", "帆布袋", "鑰匙圈"];
const GOOD_ACTIONS = ["整理桌面", "運動流汗", "聯絡老朋友", "學新技能", "早睡早起", "嘗試新餐廳", "說聲謝謝", "規劃旅行", "閱讀", "散步曬太陽", "斷捨離", "寫日記"];
const BAD_ACTIONS = ["衝動購物", "熬夜", "說人八卦", "拖延", "暴飲暴食", "借錢給人", "做重大決定", "和人爭辯", "滑手機到深夜", "空腹喝咖啡"];
const REMEDIES = [
  "穿戴一件幸運色的小物，提醒自己保持好心情。",
  "出門前整理一下房間或包包，讓氣場煥然一新。",
  "對身邊的人說一句感謝，好運會從善意開始流轉。",
  "今晚早點休息，睡一覺起來運勢就會重新開始。",
  "去散步曬曬太陽，把悶住的心情放掉。",
];

export interface AspectResult {
  key: AspectKey;
  stars: number;
  text: string;
}

export interface Fortune {
  date: string;
  drawnAt: number;
  number: number;
  level: LevelKey;
  poem: string[];
  summary: string;
  aspects: AspectResult[];
  luckyColor: { name: string; hex: string };
  luckyNumber: number;
  luckyDirection: string;
  luckyItem: string;
  good: string[];
  bad: string[];
  remedy: string | null;
  /** 今天第幾次抽（舊資料沒有這個欄位） */
  drawIndex?: number;
}

// ---- 隨機 ----

/** 使用加密等級亂數，比 Math.random 更均勻 */
function randomInt(max: number): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] % max;
}

function pick<T>(list: readonly T[]): T {
  return list[randomInt(list.length)];
}

function pickMany<T>(list: readonly T[], n: number): T[] {
  const pool = [...list];
  const out: T[] = [];
  while (out.length < n && pool.length) out.push(pool.splice(randomInt(pool.length), 1)[0]);
  return out;
}

function pickLevel(): LevelKey {
  let roll = randomInt(100);
  for (const key of LEVEL_ORDER) {
    roll -= LEVELS[key].weight;
    if (roll < 0) return key;
  }
  return "kichi";
}

function aspectTier(stars: number): Tier {
  return stars >= 4 ? "good" : stars === 3 ? "mid" : "bad";
}

export function drawFortune(): Fortune {
  const level = pickLevel();
  const def = LEVELS[level];
  const aspects = ASPECTS.map(({ key }) => {
    // 各項運勢以整體星等為基準上下浮動 1 顆
    const stars = Math.min(5, Math.max(1, def.stars + randomInt(3) - 1));
    return { key, stars, text: pick(ASPECT_TEXT[key][aspectTier(stars)]) };
  });
  return {
    date: todayStr(),
    drawnAt: Date.now(),
    number: randomInt(100) + 1,
    level,
    poem: pick(def.poems),
    summary: pick(def.summaries),
    aspects,
    luckyColor: pick(LUCKY_COLORS),
    luckyNumber: randomInt(99) + 1,
    luckyDirection: pick(DIRECTIONS),
    luckyItem: pick(LUCKY_ITEMS),
    good: pickMany(GOOD_ACTIONS, 3),
    bad: pickMany(BAD_ACTIONS, 2),
    remedy: def.tier === "bad" ? pick(REMEDIES) : null,
  };
}

// ---- 抽籤紀錄的持久化 ----

interface FortuneState {
  version: 1;
  history: Fortune[];
}

const store = createLocalStore<FortuneState>(
  "alsy.fortune.v1",
  () => ({ version: 1, history: [] }),
  (v): v is FortuneState => (v as FortuneState)?.version === 1 && Array.isArray((v as FortuneState).history),
);

export const useFortunes = store.useStore;

/** 抽一支新籤；同一天重抽會取代當天的結果，歷史紀錄每天只保留最後一支 */
export function draw(): Fortune {
  const today = todayStr();
  const previous = store.get().history.find((f) => f.date === today);
  const fortune = { ...drawFortune(), drawIndex: (previous?.drawIndex ?? (previous ? 1 : 0)) + 1 };
  store.set((s) => ({
    ...s,
    history: [fortune, ...s.history.filter((f) => f.date !== today)].slice(0, 30),
  }));
  return fortune;
}
