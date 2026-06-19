import type { Metadata } from "next";

import { Categories } from "@/widgets/Categories";

export const metadata: Metadata = {
  title: "Категории",
};

export default function CategoriesPage() {
  return <Categories />;
}
