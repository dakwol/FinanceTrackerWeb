import type { IsoDate, MonthId } from "@/shared/model/finance";

export function getMonthFromDate(date: IsoDate): MonthId {
  return date.slice(0, 7) as MonthId;
}

export function formatMonth(month: MonthId): string {
  const [year, monthNumber] = month.split("-").map(Number);

  return new Intl.DateTimeFormat("ru-RU", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, monthNumber - 1, 1));
}

export function getCurrentIsoDate(): IsoDate {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const day = String(currentDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}` as IsoDate;
}

export function getAdjacentMonth(
  month: MonthId,
  offset: number,
): MonthId {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 1 + offset, 1);

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}` as MonthId;
}
