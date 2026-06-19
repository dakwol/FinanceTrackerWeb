"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";

import type { Category } from "@/entities/category/model/types";
import type { Operation } from "@/entities/operation/model/types";
import type { WorkspaceUser } from "@/entities/user/model/types";
import {
  CategoryTypeEnum,
  commonOwnerId,
  OperationTypeEnum,
} from "@/shared/model/finance";
import { createOwnerOptions } from "@/shared/lib/owners";
import { getCurrentIsoDate, getMonthFromDate } from "@/shared/lib/date";
import { parseMoneyToKopecks } from "@/shared/lib/money";
import { Button } from "@/shared/ui/Button";
import { DateInput } from "@/shared/ui/DateInput";
import { Input } from "@/shared/ui/Input";
import { Modal } from "@/shared/ui/Modal";
import { MoneyInput } from "@/shared/ui/MoneyInput";
import { Select } from "@/shared/ui/Select";

import {
  addOperationSchema,
  type AddOperationFormValues,
} from "../model/schema";
import styles from "./AddOperationModal.module.scss";

interface AddOperationModalProps {
  categories: Category[];
  currentUserEmail: string;
  operation?: Operation | null;
  initialType: OperationTypeEnum;
  isLoading: boolean;
  isOpen: boolean;
  users: WorkspaceUser[];
  onClose: () => void;
  onSubmit: (operation: Operation) => Promise<void>;
}

const operationTypeOptions = [
  { label: "Доход", value: OperationTypeEnum.Income },
  { label: "Расход", value: OperationTypeEnum.Expense },
  { label: "Накопление", value: OperationTypeEnum.Saving },
];

export function AddOperationModal({
  categories,
  currentUserEmail,
  operation = null,
  initialType,
  isLoading,
  isOpen,
  users,
  onClose,
  onSubmit,
}: AddOperationModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<AddOperationFormValues>({
    resolver: zodResolver(addOperationSchema),
    defaultValues: createDefaultValues(initialType, operation),
  });
  const selectedType = useWatch({ control, name: "type" });
  const selectedCategoryId = useWatch({ control, name: "categoryId" });
  const availableCategories = useMemo(
    () =>
      categories.filter(
        (category) =>
          category.isActive &&
          category.type === operationTypeToCategoryType(selectedType),
      ),
    [categories, selectedType],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    reset(createDefaultValues(initialType, operation));
  }, [initialType, isOpen, operation, reset]);

  useEffect(() => {
    const categoryExists = availableCategories.some(
      (category) => category.id === selectedCategoryId,
    );

    if (!categoryExists) {
      setValue("categoryId", availableCategories[0]?.id ?? "");
    }
  }, [availableCategories, selectedCategoryId, setValue]);

  const submitForm = handleSubmit(async (values) => {
    const currentDate = getCurrentIsoDate();
    const nextOperation: Operation = {
      rowNumber: operation?.rowNumber,
      id: operation?.id ?? crypto.randomUUID(),
      date: values.date as Operation["date"],
      month: getMonthFromDate(values.date as Operation["date"]),
      type: values.type,
      categoryId: values.categoryId,
      owner: values.owner,
      amount: parseMoneyToKopecks(values.amount),
      comment: values.comment,
      createdByEmail: operation?.createdByEmail ?? currentUserEmail,
      createdAt: operation?.createdAt ?? currentDate,
      updatedAt: currentDate,
    };

    await onSubmit(nextOperation);
    onClose();
  });

  return (
    <Modal
      isOpen={isOpen}
      title={operation ? "Редактировать операцию" : "Добавить операцию"}
      onClose={onClose}
    >
      <form className={styles.form} onSubmit={submitForm}>
        <Select
          error={errors.type?.message}
          label="Тип операции"
          options={operationTypeOptions}
          {...register("type")}
        />
        <DateInput
          error={errors.date?.message}
          label="Дата"
          {...register("date")}
        />
        <Select
          error={errors.categoryId?.message}
          label="Категория"
          options={
            availableCategories.length > 0
              ? availableCategories.map((category) => ({
                  label: category.name,
                  value: category.id,
                }))
              : [{ label: "Нет доступных категорий", value: "" }]
          }
          {...register("categoryId")}
        />
        <Select
          error={errors.owner?.message}
          label="Владелец"
          options={createOwnerOptions(users, operation?.owner)}
          {...register("owner")}
        />
        <MoneyInput
          error={errors.amount?.message}
          label="Сумма"
          {...register("amount")}
        />
        <Input
          error={errors.comment?.message}
          label="Комментарий"
          placeholder="Например, продукты"
          {...register("comment")}
        />
        <Button
          disabled={isLoading || availableCategories.length === 0}
          fullWidth
          type="submit"
        >
          {isLoading
            ? "Сохраняем..."
            : operation
              ? "Сохранить изменения"
              : "Сохранить операцию"}
        </Button>
      </form>
    </Modal>
  );
}

function createDefaultValues(
  type: OperationTypeEnum,
  operation: Operation | null,
): AddOperationFormValues {
  if (operation) {
    return {
      type: operation.type,
      date: operation.date,
      categoryId: operation.categoryId,
      owner: operation.owner,
      amount: formatMoneyForInput(operation.amount),
      comment: operation.comment,
    };
  }

  return {
    type,
    date: getCurrentIsoDate(),
    categoryId: "",
    owner: commonOwnerId,
    amount: "",
    comment: "",
  };
}

function formatMoneyForInput(amountInKopecks: number): string {
  return String(amountInKopecks / 100).replace(".", ",");
}

function operationTypeToCategoryType(
  operationType: OperationTypeEnum,
): CategoryTypeEnum {
  switch (operationType) {
    case OperationTypeEnum.Income:
      return CategoryTypeEnum.Income;
    case OperationTypeEnum.Expense:
      return CategoryTypeEnum.Expense;
    case OperationTypeEnum.Saving:
      return CategoryTypeEnum.Saving;
  }
}
