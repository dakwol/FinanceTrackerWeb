import type { Metadata } from "next";

import { Settings } from "@/widgets/Settings";

export const metadata: Metadata = {
  title: "Настройки",
};

export default function SettingsPage() {
  return <Settings />;
}
