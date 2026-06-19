"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";

import type { Category } from "@/entities/category/model/types";
import type { WorkspaceUser } from "@/entities/user/model/types";
import { getCurrentIsoDate } from "@/shared/lib/date";
import {
  CategoryTypeEnum,
  commonOwnerId,
} from "@/shared/model/finance";
import { createOwnerOptions } from "@/shared/lib/owners";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Modal } from "@/shared/ui/Modal";
import { Select } from "@/shared/ui/Select";

import {
  categorySchema,
  type CategoryFormValues,
} from "../model/schema";
import styles from "./CategoryModal.module.scss";

interface CategoryModalProps {
  category?: Category | null;
  isLoading: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (category: Category) => Promise<void>;
  users: WorkspaceUser[];
}

const categoryTypeOptions = [
  { label: "Доход", value: CategoryTypeEnum.Income },
  { label: "Расход", value: CategoryTypeEnum.Expense },
  { label: "Накопление", value: CategoryTypeEnum.Saving },
];

export function CategoryModal({
  category = null,
  isLoading,
  isOpen,
  onClose,
  onSubmit,
  users,
}: CategoryModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: createDefaultValues(category),
  });
  const selectedColor = useWatch({ control, name: "color" });

  useEffect(() => {
    if (isOpen) {
      reset(createDefaultValues(category));
    }
  }, [category, isOpen, reset]);

  const submitForm = handleSubmit(async (values) => {
    const currentDate = getCurrentIsoDate();
    const nextCategory: Category = {
      rowNumber: category?.rowNumber,
      id: category?.id ?? crypto.randomUUID(),
      name: values.name,
      type: values.type,
      owner: values.owner,
      color: values.color.toUpperCase(),
      icon: values.icon,
      isActive: category?.isActive ?? true,
      createdAt: category?.createdAt ?? currentDate,
      updatedAt: currentDate,
    };

    await onSubmit(nextCategory);
    onClose();
  });

  return (
    <Modal
      isOpen={isOpen}
      title={category ? "Редактировать категорию" : "Новая категория"}
      onClose={onClose}
    >
      <form className={styles.form} onSubmit={submitForm}>
        <Input
          error={errors.name?.message}
          label="Название"
          placeholder="Например, Продукты"
          {...register("name")}
        />
        <Select
          error={errors.type?.message}
          label="Тип"
          options={categoryTypeOptions}
          {...register("type")}
        />
        <Select
          error={errors.owner?.message}
          label="Владелец"
          options={createOwnerOptions(users, category?.owner)}
          {...register("owner")}
        />
        <div className={styles.colorField}>
          <Input
            error={errors.color?.message}
            label="Цвет"
            placeholder="#7057E8"
            {...register("color")}
          />
          <span
            aria-hidden="true"
            className={styles.colorPreview}
            style={{ background: selectedColor }}
          />
        </div>
        <Input
          error={errors.icon?.message}
          label="Иконка"
          placeholder="Например, shopping-cart"
          {...register("icon")}
        />
        <Button disabled={isLoading} fullWidth type="submit">
          {isLoading ? "Сохраняем..." : "Сохранить категорию"}
        </Button>
      </form>
    </Modal>
  );
}

function createDefaultValues(category: Category | null): CategoryFormValues {
  return {
    name: category?.name ?? "",
    type: category?.type ?? CategoryTypeEnum.Expense,
    owner: category?.owner ?? commonOwnerId,
    color: category?.color ?? "#7057E8",
    icon: category?.icon ?? "circle",
  };
}
