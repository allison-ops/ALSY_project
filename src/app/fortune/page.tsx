import type { Metadata } from "next";
import { Noto_Serif_TC } from "next/font/google";
import { FortuneApp } from "@/components/fortune/FortuneApp";

// 籤詩用的明體；只在這個頁面載入，瀏覽器會依實際用到的字元下載對應的字型切片
const serifTC = Noto_Serif_TC({
  weight: ["700", "900"],
  subsets: ["latin"],
  preload: false,
  variable: "--font-serif-tc",
});

export const metadata: Metadata = {
  title: "好運抽籤",
};

export default function FortunePage() {
  return (
    <div className={`${serifTC.variable} flex min-h-0 flex-1 flex-col`}>
      <FortuneApp />
    </div>
  );
}
