import { z } from "zod";

import { parseMoneyToKopecks } from "@/shared/lib/money";

export const transferSchema = z
  .object({
    date: z.iso.date("Укажите корректную дату."),
    fromOwner: z.string().min(1, "Выберите отправителя."),
    toOwner: z.string().min(1, "Выберите получателя."),
    amount: z
      .string()
      .trim()
      .min(1, "Введите сумму.")
      .refine(
        (value) => parseMoneyToKopecks(value) > 0,
        "Сумма должна быть больше нуля.",
      ),
    comment: z.string().trim().max(200, "Максимум 200 символов."),
  })
  .refine((values) => values.fromOwner !== values.toOwner, {
    message: "Отправитель и получатель должны отличаться.",
    path: ["toOwner"],
  });

export type TransferFormValues = z.infer<typeof transferSchema>;
