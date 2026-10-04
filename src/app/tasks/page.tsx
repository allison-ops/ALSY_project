import type { Metadata } from "next";
import { PersonalApp } from "@/components/personal/PersonalApp";

export const metadata: Metadata = {
  title: "個人任務",
};

export default function TasksPage() {
  return <PersonalApp />;
}
