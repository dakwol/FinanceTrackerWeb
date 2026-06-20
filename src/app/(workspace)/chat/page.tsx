import type { Metadata } from "next";

import { FamilyChat } from "@/features/family-chat";

export const metadata: Metadata = {
  title: "Семейный чат",
};

export default function ChatPage() {
  return <FamilyChat />;
}
