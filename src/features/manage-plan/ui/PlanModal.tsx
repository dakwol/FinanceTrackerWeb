"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import type { Category } from "@/entities/category/model/types";
import type { Plan } from "@/entities/plan/model/types";
import type { WorkspaceUser } from "@/entities/user/model/types";
import { getCurrentIsoDate } from "@/shared/lib/date";
import { parseMoneyToKopecks } from "@/shared/lib/money";
import { commonOwnerId, MonthId } from "@/shared/model/finance";
import { createOwnerOptions } from "@/shared/lib/owners";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Modal } from "@/shared/ui/Modal";
import { MoneyInput } from "@/shared/ui/MoneyInput";
import { Select } from "@/shared/ui/Select";

import { planSchema, type PlanFormValues } from "../model/schema";
import styles from "./PlanModal.module.scss";

interface PlanModalProps {
  category: Category | null;
  isLoading: boolean;
  isOpen: boolean;
  month: MonthId;
  plan?: Plan | null;
  onClose: () => void;
  onSubmit: (plan: Plan) => Promise<void>;
  users: WorkspaceUser[];
}

export function PlanModal({
  category,
  isLoading,
  isOpen,
  month,
  plan = null,
  onClose,
  onSubmit,
  users,
}: PlanModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: createDefaultValues(category, plan),
  });

  useEffect(() => {
    if (isOpen) {
      reset(createDefaultValues(category, plan));
    }
  }, [category, isOpen, plan, reset]);

  if (!category) {
    return null;
  }

  const submitForm = handleSubmit(async (values) => {
    const currentDate = getCurrentIsoDate();
    const nextPlan: Plan = {
      rowNumber: plan?.rowNumber,
      id: plan?.id ?? crypto.randomUUID(),
      month,
      categoryId: category.id,
      plannedAmount: parseMoneyToKopecks(values.plannedAmount),
      owner: values.owner,
      paymentDay: values.paymentDay === "" ? null : Number(values.paymentDay),
      createdAt: plan?.createdAt ?? currentDate,
      updatedAt: currentDate,
    };

    await onSubmit(nextPlan);
    onClose();
  });

  return (
    <Modal
      isOpen={isOpen}
      title={`${plan ? "Изменить" : "Добавить"} план: ${category.name}`}
      onClose={onClose}
    >
      <form className={styles.form} onSubmit={submitForm}>
        <MoneyInput
          error={errors.plannedAmount?.message}
          label="Плановая сумма"
          {...register("plannedAmount")}
        />
        <Select
          error={errors.owner?.message}
          label="Владелец"
          options={createOwnerOptions(users, plan?.owner ?? category.owner)}
          {...register("owner")}
        />
        <Input
          error={errors.paymentDay?.message}
          inputMode="numeric"
          label="День оплаты"
          max="31"
          min="1"
          placeholder="Необязательно"
          type="number"
          {...register("paymentDay")}
        />
        <Button disabled={isLoading} fullWidth type="submit">
          {isLoading ? "Сохраняем..." : "Сохранить план"}
        </Button>
      </form>
    </Modal>
  );
}

function createDefaultValues(
  category: Category | null,
  plan: Plan | null,
): PlanFormValues {
  return {
    plannedAmount: plan
      ? String(plan.plannedAmount / 100).replace(".", ",")
      : "",
    owner: plan?.owner ?? category?.owner ?? commonOwnerId,
    paymentDay: plan?.paymentDay ? String(plan.paymentDay) : "",
  };
}
