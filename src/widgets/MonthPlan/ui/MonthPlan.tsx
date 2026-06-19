"use client";

import { CalendarDays, Copy, Edit3, Plus } from "lucide-react";
import { useMemo, useState } from "react";

import type { Category } from "@/entities/category/model/types";
import type { Plan } from "@/entities/plan/model/types";
import { useFinanceWorkspace } from "@/features/finance-workspace";
import { PlanModal } from "@/features/manage-plan";
import { calculateCategoryProgress } from "@/shared/lib/calculations";
import {
  formatMonth,
  getAdjacentMonth,
  getCurrentIsoDate,
} from "@/shared/lib/date";
import { formatMoney } from "@/shared/lib/money";
import { getOwnerLabel } from "@/shared/lib/owners";
import {
  CategoryTypeEnum,
  MonthId,
} from "@/shared/model/finance";
import { Button, ButtonVariantEnum } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { PageLayout } from "@/shared/ui/PageLayout";

import styles from "./MonthPlan.module.scss";

const typeLabels: Record<CategoryTypeEnum, string> = {
  [CategoryTypeEnum.Income]: "Доход",
  [CategoryTypeEnum.Expense]: "Расход",
  [CategoryTypeEnum.Saving]: "Накопление",
};

export function MonthPlan() {
  const {
    currentUser,
    spreadsheetId,
    categories,
    users,
    plans,
    operations,
    isLoading,
    errorMessage,
    signIn,
    addPlan,
    addPlans,
    updatePlan,
    refreshWorkspaceData,
    clearError,
  } = useFinanceWorkspace();
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const planCategories = useMemo(
    () =>
      categories
        .filter(
          (category) =>
            category.isActive &&
            category.type !== CategoryTypeEnum.Income,
        )
        .sort((firstCategory, secondCategory) =>
          firstCategory.name.localeCompare(secondCategory.name, "ru"),
        ),
    [categories],
  );
  const currentPlans = plans.filter((plan) => plan.month === selectedMonth);
  const totalPlanned = currentPlans.reduce(
    (total, plan) => total + plan.plannedAmount,
    0,
  );
  const totalActual = operations
    .filter((operation) => operation.month === selectedMonth)
    .filter((operation) =>
      planCategories.some((category) => category.id === operation.categoryId),
    )
    .reduce((total, operation) => total + operation.amount, 0);

  const openPlanModal = (category: Category, plan: Plan | null) => {
    clearError();
    setNotice(null);
    setSelectedCategory(category);
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  const handleSubmitPlan = async (plan: Plan) => {
    if (selectedPlan) {
      await updatePlan(plan);
      return;
    }

    await addPlan(plan);
  };

  const copyPreviousMonth = async () => {
    clearError();
    setNotice(null);
    const previousMonth = getAdjacentMonth(selectedMonth, -1);
    const existingCategoryIds = new Set(
      currentPlans.map((plan) => plan.categoryId),
    );
    const currentDate = getCurrentIsoDate();
    const plansToCopy = plans
      .filter((plan) => plan.month === previousMonth)
      .filter((plan) => !existingCategoryIds.has(plan.categoryId))
      .filter((plan) =>
        planCategories.some((category) => category.id === plan.categoryId),
      )
      .map<Plan>((plan) => ({
        id: crypto.randomUUID(),
        month: selectedMonth,
        categoryId: plan.categoryId,
        plannedAmount: plan.plannedAmount,
        owner: plan.owner,
        paymentDay: plan.paymentDay,
        createdAt: currentDate,
        updatedAt: currentDate,
      }));

    if (plansToCopy.length === 0) {
      setNotice("Нет новых строк для копирования из прошлого месяца.");
      return;
    }

    await addPlans(plansToCopy);
    setNotice(`Скопировано строк: ${plansToCopy.length}.`);
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
    return <PlanStatus description="Сначала подключите Google Spreadsheet." />;
  }

  if (!currentUser) {
    return (
      <PlanStatus
        actionLabel={isLoading ? "Подключаем..." : "Войти через Google"}
        description="Войдите повторно, чтобы загрузить план."
        onAction={handleReconnect}
      />
    );
  }

  return (
    <PageLayout
      description="Ожидаемые суммы по категориям и сравнение с фактом."
      title="План месяца"
    >
      <Card className={styles.toolbar}>
        <Button
          aria-label="Предыдущий месяц"
          variant={ButtonVariantEnum.Ghost}
          onClick={() =>
            setSelectedMonth(getAdjacentMonth(selectedMonth, -1))
          }
        >
          ←
        </Button>
        <div className={styles.month}>
          <CalendarDays size={19} />
          <strong>{capitalize(formatMonth(selectedMonth))}</strong>
        </div>
        <Button
          aria-label="Следующий месяц"
          variant={ButtonVariantEnum.Ghost}
          onClick={() =>
            setSelectedMonth(getAdjacentMonth(selectedMonth, 1))
          }
        >
          →
        </Button>
        <Button
          disabled={isLoading}
          variant={ButtonVariantEnum.Secondary}
          onClick={() => void copyPreviousMonth()}
        >
          <Copy size={17} />
          Копировать прошлый месяц
        </Button>
      </Card>

      {(errorMessage || notice) && (
        <div
          className={errorMessage ? styles.error : styles.notice}
          role="status"
        >
          {errorMessage ?? notice}
        </div>
      )}

      <section className={styles.summary}>
        <Card>
          <span>План</span>
          <strong>{formatMoney(totalPlanned)}</strong>
        </Card>
        <Card>
          <span>Факт</span>
          <strong>{formatMoney(totalActual)}</strong>
        </Card>
        <Card>
          <span>Остаток</span>
          <strong className={totalPlanned - totalActual < 0 ? styles.negative : ""}>
            {formatMoney(totalPlanned - totalActual)}
          </strong>
        </Card>
      </section>

      <Card className={styles.planCard}>
        {planCategories.length === 0 ? (
          <div className={styles.empty}>
            Активных категорий расходов и накоплений пока нет.
          </div>
        ) : (
          <div className={styles.list}>
            {planCategories.map((category) => {
              const plan =
                currentPlans.find(
                  (currentPlan) => currentPlan.categoryId === category.id,
                ) ?? null;
              const progress = calculateCategoryProgress({
                categoryId: category.id,
                operations,
                plans,
                month: selectedMonth,
              });
              const visibleProgress = Math.min(progress.progressPercent, 100);

              return (
                <article className={styles.row} key={category.id}>
                  <span
                    className={styles.categoryMark}
                    style={{ background: category.color }}
                  />
                  <div className={styles.category}>
                    <strong>{category.name}</strong>
                    <span>
                      {typeLabels[category.type]} ·{" "}
                      {getOwnerLabel(plan?.owner ?? category.owner, users)}
                      {plan?.paymentDay
                        ? ` · оплата ${plan.paymentDay} числа`
                        : ""}
                    </span>
                  </div>
                  <div className={styles.values}>
                    <strong>{formatMoney(progress.actualAmount)}</strong>
                    <span>из {formatMoney(progress.plannedAmount)}</span>
                  </div>
                  <div className={styles.progress}>
                    <span
                      className={
                        progress.progressPercent > 100
                          ? styles.overBudget
                          : undefined
                      }
                      style={{ width: `${visibleProgress}%` }}
                    />
                  </div>
                  <Button
                    variant={plan ? ButtonVariantEnum.Ghost : ButtonVariantEnum.Secondary}
                    onClick={() => openPlanModal(category, plan)}
                  >
                    {plan ? <Edit3 size={17} /> : <Plus size={17} />}
                    {plan ? "Изменить" : "Запланировать"}
                  </Button>
                </article>
              );
            })}
          </div>
        )}
      </Card>

      <PlanModal
        category={selectedCategory}
        isLoading={isLoading}
        isOpen={isModalOpen}
        month={selectedMonth}
        plan={selectedPlan}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitPlan}
        users={users}
      />
    </PageLayout>
  );
}

interface PlanStatusProps {
  actionLabel?: string;
  description: string;
  onAction?: () => void | Promise<void>;
}

function PlanStatus({
  actionLabel,
  description,
  onAction,
}: PlanStatusProps) {
  return (
    <PageLayout title="План месяца">
      <Card className={styles.empty}>
        <p>{description}</p>
        {actionLabel && onAction && (
          <Button onClick={onAction}>{actionLabel}</Button>
        )}
      </Card>
    </PageLayout>
  );
}

function getCurrentMonth(): MonthId {
  const currentDate = new Date();

  return `${currentDate.getFullYear()}-${String(
    currentDate.getMonth() + 1,
  ).padStart(2, "0")}` as MonthId;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
