"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import type { Transfer } from "@/entities/transfer/model/types";
import type { WorkspaceUser } from "@/entities/user/model/types";
import { getCurrentIsoDate, getMonthFromDate } from "@/shared/lib/date";
import { parseMoneyToKopecks } from "@/shared/lib/money";
import { commonOwnerId } from "@/shared/model/finance";
import { createOwnerOptions } from "@/shared/lib/owners";
import { Button } from "@/shared/ui/Button";
import { DateInput } from "@/shared/ui/DateInput";
import { Input } from "@/shared/ui/Input";
import { Modal } from "@/shared/ui/Modal";
import { MoneyInput } from "@/shared/ui/MoneyInput";
import { Select } from "@/shared/ui/Select";

import { transferSchema, type TransferFormValues } from "../model/schema";
import styles from "./TransferModal.module.scss";

interface TransferModalProps {
  currentUserEmail: string;
  isLoading: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transfer: Transfer) => Promise<void>;
  users: WorkspaceUser[];
}

export function TransferModal({
  currentUserEmail,
  isLoading,
  isOpen,
  onClose,
  onSubmit,
  users,
}: TransferModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: createDefaultValues(users),
  });

  useEffect(() => {
    if (isOpen) {
      reset(createDefaultValues(users));
    }
  }, [isOpen, reset, users]);

  const submitForm = handleSubmit(async (values) => {
    const currentDate = getCurrentIsoDate();
    const transfer: Transfer = {
      id: crypto.randomUUID(),
      date: values.date as Transfer["date"],
      month: getMonthFromDate(values.date as Transfer["date"]),
      fromOwner: values.fromOwner,
      toOwner: values.toOwner,
      amount: parseMoneyToKopecks(values.amount),
      comment: values.comment,
      createdByEmail: currentUserEmail,
      createdAt: currentDate,
    };

    await onSubmit(transfer);
    onClose();
  });

  return (
    <Modal isOpen={isOpen} title="Добавить перевод" onClose={onClose}>
      <form className={styles.form} onSubmit={submitForm}>
        <DateInput
          error={errors.date?.message}
          label="Дата"
          {...register("date")}
        />
        <Select
          error={errors.fromOwner?.message}
          label="Откуда"
          options={createOwnerOptions(users)}
          {...register("fromOwner")}
        />
        <Select
          error={errors.toOwner?.message}
          label="Куда"
          options={createOwnerOptions(users)}
          {...register("toOwner")}
        />
        <MoneyInput
          error={errors.amount?.message}
          label="Сумма"
          {...register("amount")}
        />
        <Input
          error={errors.comment?.message}
          label="Комментарий"
          placeholder="Например, на общие расходы"
          {...register("comment")}
        />
        <Button disabled={isLoading} fullWidth type="submit">
          {isLoading ? "Сохраняем..." : "Сохранить перевод"}
        </Button>
      </form>
    </Modal>
  );
}

function createDefaultValues(users: WorkspaceUser[]): TransferFormValues {
  return {
    date: getCurrentIsoDate(),
    fromOwner: users[0]?.id ?? commonOwnerId,
    toOwner: commonOwnerId,
    amount: "",
    comment: "",
  };
}
