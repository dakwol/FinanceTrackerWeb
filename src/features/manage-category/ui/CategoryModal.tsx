"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";

import type { Category } from "@/entities/category/model/types";
import type { WorkspaceUser } from "@/entities/user/model/types";
import {
  categoryColorOptions,
  categoryIconOptions,
} from "@/shared/lib/categoryAppearance";
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
    setValue,
    control,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: createDefaultValues(category),
  });
  const selectedColor = useWatch({ control, name: "color" });
  const selectedIcon = useWatch({ control, name: "icon" });

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
        <div className={styles.pickerField}>
          <span className={styles.pickerLabel}>Цвет</span>
          <input type="hidden" {...register("color")} />
          <div className={styles.colorPicker}>
            {categoryColorOptions.map((color) => (
              <button
                aria-label={`Выбрать цвет ${color}`}
                aria-pressed={selectedColor?.toUpperCase() === color}
                className={styles.colorOption}
                key={color}
                style={{ backgroundColor: color }}
                type="button"
                onClick={() =>
                  setValue("color", color, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              />
            ))}
            <label
              className={styles.customColor}
              style={{ backgroundColor: selectedColor }}
              title="Выбрать другой цвет"
            >
              <span aria-hidden="true">+</span>
              <input
                aria-label="Выбрать другой цвет"
                type="color"
                value={selectedColor}
                onChange={(event) =>
                  setValue("color", event.target.value.toUpperCase(), {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              />
            </label>
          </div>
          {errors.color?.message && (
            <span className={styles.fieldError}>{errors.color.message}</span>
          )}
        </div>
        <div className={`${styles.pickerField} ${styles.iconField}`}>
          <span className={styles.pickerLabel}>Иконка</span>
          <input type="hidden" {...register("icon")} />
          <div className={styles.iconPicker}>
            {categoryIconOptions.map((option) => {
              const Icon = option.icon;

              return (
                <button
                  aria-label={option.label}
                  aria-pressed={selectedIcon === option.value}
                  className={styles.iconOption}
                  key={option.value}
                  title={option.label}
                  type="button"
                  onClick={() =>
                    setValue("icon", option.value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                >
                  <Icon size={20} />
                </button>
              );
            })}
          </div>
          {errors.icon?.message && (
            <span className={styles.fieldError}>{errors.icon.message}</span>
          )}
        </div>
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
