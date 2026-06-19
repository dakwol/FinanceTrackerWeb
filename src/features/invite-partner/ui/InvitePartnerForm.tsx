"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Send } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";

import {
  invitePartnerSchema,
  type InvitePartnerFormValues,
} from "../model/schema";
import styles from "./InvitePartnerForm.module.scss";

interface InvitePartnerFormProps {
  currentUserEmail: string;
  isLoading: boolean;
  onSubmit: (email: string) => Promise<void>;
}

export function InvitePartnerForm({
  currentUserEmail,
  isLoading,
  onSubmit,
}: InvitePartnerFormProps) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<InvitePartnerFormValues>({
    resolver: zodResolver(invitePartnerSchema),
    defaultValues: { email: "" },
  });

  const submitForm = handleSubmit(async ({ email }) => {
    setSuccessMessage(null);

    if (email === currentUserEmail.toLowerCase()) {
      setError("email", {
        message: "Нельзя пригласить собственный аккаунт.",
      });
      return;
    }

    try {
      await onSubmit(email);
      setSuccessMessage(`Приглашение отправлено на ${email}.`);
      reset();
    } catch {
      return;
    }
  });

  return (
    <form className={styles.form} onSubmit={submitForm}>
      <Input
        error={errors.email?.message}
        label="Email партнёра"
        placeholder="partner@gmail.com"
        type="email"
        {...register("email")}
      />
      <Button disabled={isLoading} type="submit">
        <Send size={17} />
        {isLoading ? "Отправляем..." : "Пригласить"}
      </Button>
      {successMessage && (
        <p className={styles.success} role="status">
          {successMessage}
        </p>
      )}
    </form>
  );
}

