import type { Metadata } from "next";

import { Dashboard } from "@/widgets/Dashboard";
import type { MonthId } from "@/shared/model/finance";

export const metadata: Metadata = {
  title: "Главная",
};

export default function DashboardPage() {
  const currentDate = new Date();
  const month = [
    currentDate.getFullYear(),
    String(currentDate.getMonth() + 1).padStart(2, "0"),
  ].join("-") as MonthId;

  return <Dashboard month={month} />;
}

