export enum OperationTypeEnum {
  Income = "income",
  Expense = "expense",
  Saving = "saving",
}

export enum CategoryTypeEnum {
  Income = "income",
  Expense = "expense",
  Saving = "saving",
}

export const commonOwnerId = "common";
export type OwnerId = string;

export enum UserRoleEnum {
  Owner = "owner",
  Partner = "partner",
}

export enum SheetNameEnum {
  Settings = "Settings",
  Users = "Users",
  Categories = "Categories",
  Plans = "Plans",
  Operations = "Operations",
  Transfers = "Transfers",
  Summary = "Summary",
}

export type IsoDate = `${number}-${number}-${number}`;
export type MonthId = `${number}-${number}`;
