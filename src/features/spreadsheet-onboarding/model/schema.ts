import { z } from "zod";

export const connectSpreadsheetSchema = z.object({
  spreadsheetUrl: z
    .string()
    .trim()
    .min(1, "Вставьте ссылку или spreadsheetId."),
});

export type ConnectSpreadsheetFormValues = z.infer<
  typeof connectSpreadsheetSchema
>;

