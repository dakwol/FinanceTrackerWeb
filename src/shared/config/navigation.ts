import {
  ChartNoAxesCombined,
  FolderKanban,
  ListChecks,
  Settings,
  WalletCards,
} from "lucide-react";

export const navigationItems = [
  {
    label: "Главная",
    href: "/dashboard",
    icon: ChartNoAxesCombined,
  },
  {
    label: "Операции",
    href: "/operations",
    icon: ListChecks,
  },
  {
    label: "План",
    href: "/plan",
    icon: WalletCards,
  },
  {
    label: "Категории",
    href: "/categories",
    icon: FolderKanban,
  },
  {
    label: "Настройки",
    href: "/settings",
    icon: Settings,
  },
];

