import type { Metadata } from "next";

import { MonthPlan } from "@/widgets/MonthPlan";

export const metadata: Metadata = {
  title: "План месяца",
};

export default function PlanPage() {
  return <MonthPlan />;
}
