import { z } from "zod";

import { parseMoneyToKopecks } from "@/shared/lib/money";

export const planSchema = z.object({
  limitType: z.enum(["fixed", "unlimited"]),
  plannedAmount: z.string().trim(),
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
}).superRefine((values, context) => {
  if (
    values.limitType === "fixed" &&
    parseMoneyToKopecks(values.plannedAmount) <= 0
  ) {
    context.addIssue({
      code: "custom",
      path: ["plannedAmount"],
      message: "Сумма должна быть больше нуля.",
    });
  }
});

export type PlanFormValues = z.infer<typeof planSchema>;
