import type { Metadata } from "next";
import { PomodoroApp } from "@/components/pomodoro/PomodoroApp";

export const metadata: Metadata = {
  title: "番茄時鐘",
};

export default function PomodoroPage() {
  return <PomodoroApp />;
}
