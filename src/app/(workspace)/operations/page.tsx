import type { Metadata } from "next";

import { Operations } from "@/widgets/Operations";

export const metadata: Metadata = {
  title: "Операции",
};

export default function OperationsPage() {
  return <Operations />;
}
