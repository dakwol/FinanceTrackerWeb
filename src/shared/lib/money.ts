const rubleFormatter = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 0,
});

export function formatMoney(amountInKopecks: number): string {
  return rubleFormatter.format(amountInKopecks / 100);
}

export function parseMoneyToKopecks(value: string): number {
  const normalizedValue = value.replace(/\s/g, "").replace(",", ".");
  const amountInRubles = Number(normalizedValue);

  if (!Number.isFinite(amountInRubles)) {
    return 0;
  }

  return Math.round(amountInRubles * 100);
}

