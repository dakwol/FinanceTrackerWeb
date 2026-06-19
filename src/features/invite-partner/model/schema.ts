import { z } from "zod";

export const invitePartnerSchema = z.object({
  email: z.email("Введите корректный email.").trim().toLowerCase(),
});

export type InvitePartnerFormValues = z.infer<typeof invitePartnerSchema>;

