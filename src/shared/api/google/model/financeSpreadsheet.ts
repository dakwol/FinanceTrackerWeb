import {
  CategoryTypeEnum,
  commonOwnerId,
  SheetNameEnum,
} from "@/shared/model/finance";

import type { GoogleCellValue } from "./types";

export const financeSheetHeaders: Record<SheetNameEnum, string[]> = {
  [SheetNameEnum.Settings]: ["key", "value"],
  [SheetNameEnum.Users]: ["id", "name", "email", "role", "createdAt"],
  [SheetNameEnum.Categories]: [
    "id",
    "name",
    "type",
    "owner",
    "color",
    "icon",
    "isActive",
    "createdAt",
    "updatedAt",
  ],
  [SheetNameEnum.Plans]: [
    "id",
    "month",
    "categoryId",
    "plannedAmount",
    "owner",
    "paymentDay",
    "createdAt",
    "updatedAt",
  ],
  [SheetNameEnum.Operations]: [
    "id",
    "date",
    "month",
    "type",
    "categoryId",
    "owner",
    "amount",
    "comment",
    "createdByEmail",
    "createdAt",
    "updatedAt",
  ],
  [SheetNameEnum.Transfers]: [
    "id",
    "date",
    "fromOwner",
    "toOwner",
    "amount",
    "comment",
    "createdByEmail",
    "createdAt",
  ],
  [SheetNameEnum.Summary]: [
    "month",
    "totalIncome",
    "totalExpense",
    "totalSaving",
    "freeBalance",
    "updatedAt",
  ],
};

export function createInitialSpreadsheetRows(
  ownerName: string,
  ownerEmail: string,
): Record<SheetNameEnum, GoogleCellValue[][]> {
  const currentDate = new Date().toISOString().slice(0, 10);

  return {
    [SheetNameEnum.Settings]: [
      financeSheetHeaders[SheetNameEnum.Settings],
      ["appVersion", "1"],
      ["currency", "RUB"],
      ["createdAt", currentDate],
      ["ownerEmail", ownerEmail],
    ],
    [SheetNameEnum.Users]: [
      financeSheetHeaders[SheetNameEnum.Users],
      [crypto.randomUUID(), ownerName, ownerEmail, "owner", currentDate],
    ],
    [SheetNameEnum.Categories]: [
      financeSheetHeaders[SheetNameEnum.Categories],
      ...createDefaultCategoryRows(currentDate),
    ],
    [SheetNameEnum.Plans]: [financeSheetHeaders[SheetNameEnum.Plans]],
    [SheetNameEnum.Operations]: [
      financeSheetHeaders[SheetNameEnum.Operations],
    ],
    [SheetNameEnum.Transfers]: [financeSheetHeaders[SheetNameEnum.Transfers]],
    [SheetNameEnum.Summary]: [financeSheetHeaders[SheetNameEnum.Summary]],
  };
}

function createDefaultCategoryRows(
  currentDate: string,
): GoogleCellValue[][] {
  const categories = [
    ["Основной доход", CategoryTypeEnum.Income, commonOwnerId, "#2f9e78", "wallet"],
    ["Накопления", CategoryTypeEnum.Saving, commonOwnerId, "#4c6ef5", "piggy-bank"],
    ["Отдых", CategoryTypeEnum.Saving, commonOwnerId, "#e0a21a", "palmtree"],
    ["Здоровье", CategoryTypeEnum.Expense, commonOwnerId, "#d84b62", "heart-pulse"],
    ["Автомобиль", CategoryTypeEnum.Expense, commonOwnerId, "#495057", "car"],
    ["Хобби", CategoryTypeEnum.Expense, commonOwnerId, "#7950f2", "palette"],
    ["Спорт", CategoryTypeEnum.Expense, commonOwnerId, "#20c997", "dumbbell"],
    ["Ремонт", CategoryTypeEnum.Expense, commonOwnerId, "#f08c00", "hammer"],
    ["Красота", CategoryTypeEnum.Expense, commonOwnerId, "#f06595", "sparkles"],
    ["Квартира", CategoryTypeEnum.Expense, commonOwnerId, "#6d5ce7", "house"],
  ] as const;

  return categories.map(([name, type, owner, color, icon]) => [
    crypto.randomUUID(),
    name,
    type,
    owner,
    color,
    icon,
    true,
    currentDate,
    currentDate,
  ]);
}
