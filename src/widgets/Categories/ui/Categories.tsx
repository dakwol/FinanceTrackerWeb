"use client";

import { Edit3, Plus, Power, PowerOff } from "lucide-react";
import { useMemo, useState } from "react";

import type { Category } from "@/entities/category/model/types";
import { useFinanceWorkspace } from "@/features/finance-workspace";
import { CategoryModal } from "@/features/manage-category";
import { getCurrentIsoDate } from "@/shared/lib/date";
import { createOwnerOptions, getOwnerLabel } from "@/shared/lib/owners";
import {
  CategoryTypeEnum,
  OwnerId,
} from "@/shared/model/finance";
import { Button, ButtonVariantEnum } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { PageLayout } from "@/shared/ui/PageLayout";
import { Select } from "@/shared/ui/Select";

import styles from "./Categories.module.scss";

enum CategoryTypeFilterEnum {
  All = "all",
}

enum CategoryOwnerFilterEnum {
  All = "all",
}

enum CategoryStatusFilterEnum {
  Active = "active",
  Inactive = "inactive",
  All = "all",
}

const typeLabels: Record<CategoryTypeEnum, string> = {
  [CategoryTypeEnum.Income]: "Доход",
  [CategoryTypeEnum.Expense]: "Расход",
  [CategoryTypeEnum.Saving]: "Накопление",
};

export function Categories() {
  const {
    currentUser,
    spreadsheetId,
    categories,
    users,
    isLoading,
    errorMessage,
    signIn,
    addCategory,
    updateCategory,
    refreshWorkspaceData,
    clearError,
  } = useFinanceWorkspace();
  const [selectedType, setSelectedType] = useState<
    CategoryTypeEnum | CategoryTypeFilterEnum
  >(CategoryTypeFilterEnum.All);
  const [selectedOwner, setSelectedOwner] = useState<
    OwnerId | CategoryOwnerFilterEnum
  >(CategoryOwnerFilterEnum.All);
  const [selectedStatus, setSelectedStatus] = useState(
    CategoryStatusFilterEnum.Active,
  );
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredCategories = useMemo(
    () =>
      categories
        .filter(
          (category) =>
            selectedType === CategoryTypeFilterEnum.All ||
            category.type === selectedType,
        )
        .filter(
          (category) =>
            selectedOwner === CategoryOwnerFilterEnum.All ||
            category.owner === selectedOwner,
        )
        .filter((category) => {
          if (selectedStatus === CategoryStatusFilterEnum.All) {
            return true;
          }

          return selectedStatus === CategoryStatusFilterEnum.Active
            ? category.isActive
            : !category.isActive;
        })
        .sort((firstCategory, secondCategory) =>
          firstCategory.name.localeCompare(secondCategory.name, "ru"),
        ),
    [categories, selectedOwner, selectedStatus, selectedType],
  );

  const openCreateModal = () => {
    clearError();
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    clearError();
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleSubmitCategory = async (category: Category) => {
    if (editingCategory) {
      await updateCategory(category);
      return;
    }

    await addCategory(category);
  };

  const toggleCategory = async (category: Category) => {
    clearError();
    await updateCategory({
      ...category,
      isActive: !category.isActive,
      updatedAt: getCurrentIsoDate(),
    });
  };

  const handleReconnect = async () => {
    clearError();

    try {
      await signIn();
      await refreshWorkspaceData();
    } catch {
      return;
    }
  };

  if (!spreadsheetId) {
    return (
      <CategoryStatus description="Сначала подключите Google Spreadsheet." />
    );
  }

  if (!currentUser) {
    return (
      <CategoryStatus
        actionLabel={isLoading ? "Подключаем..." : "Войти через Google"}
        description="Войдите повторно, чтобы загрузить категории."
        onAction={handleReconnect}
      />
    );
  }

  return (
    <PageLayout
      actions={
        <Button disabled={isLoading} onClick={openCreateModal}>
          <Plus size={18} />
          Новая категория
        </Button>
      }
      description="Структура доходов, расходов и накоплений."
      title="Категории"
    >
      {errorMessage && (
        <div className={styles.error} role="alert">
          {errorMessage}
        </div>
      )}

      <Card className={styles.filters}>
        <Select
          label="Тип"
          options={[
            { label: "Все типы", value: CategoryTypeFilterEnum.All },
            ...Object.values(CategoryTypeEnum).map((type) => ({
              label: typeLabels[type],
              value: type,
            })),
          ]}
          value={selectedType}
          onChange={(event) =>
            setSelectedType(
              event.target.value as
                | CategoryTypeEnum
                | CategoryTypeFilterEnum,
            )
          }
        />
        <Select
          label="Владелец"
          options={[
            { label: "Все владельцы", value: CategoryOwnerFilterEnum.All },
            ...createOwnerOptions(users),
          ]}
          value={selectedOwner}
          onChange={(event) =>
            setSelectedOwner(
              event.target.value as
                | OwnerId
                | CategoryOwnerFilterEnum,
            )
          }
        />
        <Select
          label="Статус"
          options={[
            { label: "Активные", value: CategoryStatusFilterEnum.Active },
            { label: "Отключённые", value: CategoryStatusFilterEnum.Inactive },
            { label: "Все", value: CategoryStatusFilterEnum.All },
          ]}
          value={selectedStatus}
          onChange={(event) =>
            setSelectedStatus(event.target.value as CategoryStatusFilterEnum)
          }
        />
      </Card>

      <section className={styles.grid}>
        {filteredCategories.length === 0 && (
          <Card className={styles.empty}>
            <p>Категорий по выбранным фильтрам нет.</p>
            <Button onClick={openCreateModal}>Создать категорию</Button>
          </Card>
        )}
        {filteredCategories.map((category) => (
          <Card
            className={`${styles.category} ${
              !category.isActive ? styles.inactive : ""
            }`}
            key={category.id}
          >
            <div className={styles.heading}>
              <span
                className={styles.icon}
                style={{ background: `${category.color}1F`, color: category.color }}
              >
                {category.name.slice(0, 1).toUpperCase()}
              </span>
              <div>
                <h2>{category.name}</h2>
                <p>{category.icon}</p>
              </div>
            </div>
            <div className={styles.tags}>
              <span className={styles[category.type]}>
                {typeLabels[category.type]}
              </span>
              <span>{getOwnerLabel(category.owner, users)}</span>
              {!category.isActive && <span>Отключена</span>}
            </div>
            <div className={styles.actions}>
              <Button
                variant={ButtonVariantEnum.Ghost}
                onClick={() => openEditModal(category)}
              >
                <Edit3 size={17} />
                Изменить
              </Button>
              <Button
                disabled={isLoading}
                variant={ButtonVariantEnum.Ghost}
                onClick={() => void toggleCategory(category)}
              >
                {category.isActive ? (
                  <PowerOff size={17} />
                ) : (
                  <Power size={17} />
                )}
                {category.isActive ? "Отключить" : "Включить"}
              </Button>
            </div>
          </Card>
        ))}
      </section>

      <CategoryModal
        category={editingCategory}
        isLoading={isLoading}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitCategory}
        users={users}
      />
    </PageLayout>
  );
}

interface CategoryStatusProps {
  actionLabel?: string;
  description: string;
  onAction?: () => void | Promise<void>;
}

function CategoryStatus({
  actionLabel,
  description,
  onAction,
}: CategoryStatusProps) {
  return (
    <PageLayout title="Категории">
      <Card className={styles.empty}>
        <p>{description}</p>
        {actionLabel && onAction && (
          <Button onClick={onAction}>{actionLabel}</Button>
        )}
      </Card>
    </PageLayout>
  );
}
