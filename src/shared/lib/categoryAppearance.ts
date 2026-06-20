import {
  Baby,
  BriefcaseBusiness,
  Car,
  Circle,
  Dumbbell,
  Gift,
  GraduationCap,
  HeartPulse,
  House,
  Landmark,
  PawPrint,
  PiggyBank,
  Plane,
  Shirt,
  ShoppingCart,
  Smartphone,
  Utensils,
  WalletCards,
  Wrench,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface CategoryIconOption {
  icon: LucideIcon;
  label: string;
  value: string;
}

export const categoryColorOptions = [
  "#7057E8",
  "#2563EB",
  "#0891B2",
  "#059669",
  "#65A30D",
  "#D97706",
  "#EA580C",
  "#DC2626",
  "#DB2777",
  "#9333EA",
  "#64748B",
  "#334155",
];

export const categoryIconOptions: CategoryIconOption[] = [
  { icon: Circle, label: "Другое", value: "circle" },
  { icon: ShoppingCart, label: "Покупки", value: "shopping-cart" },
  { icon: Utensils, label: "Еда", value: "utensils" },
  { icon: House, label: "Дом", value: "house" },
  { icon: Car, label: "Транспорт", value: "car" },
  { icon: HeartPulse, label: "Здоровье", value: "heart-pulse" },
  { icon: GraduationCap, label: "Образование", value: "graduation-cap" },
  { icon: Plane, label: "Путешествия", value: "plane" },
  { icon: Shirt, label: "Одежда", value: "shirt" },
  { icon: Gift, label: "Подарки", value: "gift" },
  { icon: Smartphone, label: "Связь", value: "smartphone" },
  { icon: WalletCards, label: "Доход", value: "wallet-cards" },
  { icon: PiggyBank, label: "Накопления", value: "piggy-bank" },
  { icon: Landmark, label: "Банк", value: "landmark" },
  { icon: BriefcaseBusiness, label: "Работа", value: "briefcase-business" },
  { icon: Baby, label: "Дети", value: "baby" },
  { icon: PawPrint, label: "Питомцы", value: "paw-print" },
  { icon: Dumbbell, label: "Спорт", value: "dumbbell" },
  { icon: Wrench, label: "Ремонт", value: "wrench" },
  { icon: Zap, label: "Коммунальные услуги", value: "zap" },
];

export function getCategoryIcon(iconName: string): LucideIcon {
  return (
    categoryIconOptions.find((option) => option.value === iconName)?.icon ??
    Circle
  );
}
