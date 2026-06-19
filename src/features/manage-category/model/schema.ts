import { z } from "zod";

import {
  CategoryTypeEnum,
} from "@/shared/model/finance";

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Минимум 2 символа.")
    .max(60, "Максимум 60 символов."),
  type: z.enum(CategoryTypeEnum),
  owner: z.string().min(1, "Выберите владельца."),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Укажите цвет в формате #7057E8."),
  icon: z
    .string()
    .trim()
    .min(1, "Укажите название иконки.")
    .max(40, "Максимум 40 символов."),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;
