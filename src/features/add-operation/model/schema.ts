import { z } from "zod";

import {
  OperationTypeEnum,
} from "@/shared/model/finance";
import { parseMoneyToKopecks } from "@/shared/lib/money";

export const addOperationSchema = z.object({
  type: z.enum(OperationTypeEnum),
  date: z.iso.date("Укажите корректную дату."),
  categoryId: z.string().min(1, "Выберите категорию."),
  owner: z.string().min(1, "Выберите владельца."),
  amount: z
    .string()
    .trim()
    .min(1, "Введите сумму.")
    .refine(
      (value) => parseMoneyToKopecks(value) > 0,
      "Сумма должна быть больше нуля.",
    ),
  comment: z.string().trim().max(200, "Максимум 200 символов."),
});

export type AddOperationFormValues = z.infer<typeof addOperationSchema>;
