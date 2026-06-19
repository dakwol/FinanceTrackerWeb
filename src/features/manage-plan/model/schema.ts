import { z } from "zod";

import { parseMoneyToKopecks } from "@/shared/lib/money";

export const planSchema = z.object({
  plannedAmount: z
    .string()
    .trim()
    .min(1, "Введите плановую сумму.")
    .refine(
      (value) => parseMoneyToKopecks(value) > 0,
      "Сумма должна быть больше нуля.",
    ),
  owner: z.string().min(1, "Выберите владельца."),
  paymentDay: z
    .string()
    .refine(
      (value) =>
        value === "" ||
        (Number.isInteger(Number(value)) &&
          Number(value) >= 1 &&
          Number(value) <= 31),
      "Введите число от 1 до 31.",
    ),
});

export type PlanFormValues = z.infer<typeof planSchema>;
