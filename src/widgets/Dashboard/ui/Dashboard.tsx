"use client";

import {
  ArrowDownLeft,
  ArrowRightLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  PiggyBank,
  Plus,
  RefreshCw,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import type { Category } from "@/entities/category/model/types";
import type { Operation } from "@/entities/operation/model/types";
import { AddOperationModal } from "@/features/add-operation";
import { TransferModal } from "@/features/add-transfer";
import { useFinanceWorkspace } from "@/features/finance-workspace";
import {
  calculateCategoryProgress,
  calculateMonthSummary,
} from "@/shared/lib/calculations";
import { formatMonth, getAdjacentMonth } from "@/shared/lib/date";
import { formatMoney } from "@/shared/lib/money";
import {
  CategoryTypeEnum,
  MonthId,
  OperationTypeEnum,
} from "@/shared/model/finance";
import { Button, ButtonVariantEnum } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";

import styles from "./Dashboard.module.scss";

interface DashboardProps {
  month: MonthId;
}

const operationTypeLabels: Record<OperationTypeEnum, string> = {
  [OperationTypeEnum.Income]: "Доход",
  [OperationTypeEnum.Expense]: "Расход",
  [OperationTypeEnum.Saving]: "Накопление",
};

export function Dashboard({ month }: DashboardProps) {
  const router = useRouter();
  const {
    currentUser,
    spreadsheetId,
    users,
    categories,
    operations,
    plans,
    isLoading,
    errorMessage,
    signIn,
    addOperation,
    addTransfer,
    refreshWorkspaceData,
    clearError,
  } = useFinanceWorkspace();
  const [isOperationModalOpen, setIsOperationModalOpen] = useState(false);
  const [operationType, setOperationType] = useState(
    OperationTypeEnum.Expense,
  );
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(month);

  const openOperationModal = (type: OperationTypeEnum) => {
    clearError();
    setOperationType(type);
    setIsOperationModalOpen(true);
  };

  const handleGoogleReconnect = async () => {
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
      <StatusCard
        actionLabel="Подключить таблицу"
        description="Для работы dashboard требуется Google Spreadsheet."
        onAction={() => router.push("/onboarding")}
        title="Таблица не подключена"
      />
    );
  }

  if (!currentUser) {
    return (
      <StatusCard
        actionLabel="Войти через Google"
        description="Сессия Google истекла или была завершена. Войдите повторно, чтобы прочитать таблицу."
        isLoading={isLoading}
        onAction={handleGoogleReconnect}
        title="Подтвердите доступ к Google"
      />
    );
  }

  const summary = calculateMonthSummary({
    operations,
    plans,
    categories,
    month: selectedMonth,
  });
  const trackedCategories = categories.filter(
    (category) =>
      category.isActive && category.type !== CategoryTypeEnum.Income,
  );
  const recentOperations = [...operations]
    .filter((operation) => operation.month === selectedMonth)
    .sort((firstOperation, secondOperation) =>
      secondOperation.date.localeCompare(firstOperation.date),
    )
    .slice(0, 4);

  return (
    <div className={styles.dashboard}>
      <div className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>Обзор бюджета</span>
          <div className={styles.monthHeading}>
            <button
              aria-label="Предыдущий месяц"
              type="button"
              onClick={() =>
                setSelectedMonth((currentMonth) =>
                  getAdjacentMonth(currentMonth, -1),
                )
              }
            >
              <ChevronLeft size={21} />
            </button>
            <label>
              <span title="Выбрать месяц">
                {capitalize(formatMonth(selectedMonth))}
              </span>
              <input
                aria-label="Выбрать месяц"
                type="month"
                value={selectedMonth}
                onChange={(event) => {
                  if (event.target.value) {
                    setSelectedMonth(event.target.value as MonthId);
                  }
                }}
              />
            </label>
            <button
              aria-label="Следующий месяц"
              type="button"
              onClick={() =>
                setSelectedMonth((currentMonth) =>
                  getAdjacentMonth(currentMonth, 1),
                )
              }
            >
              <ChevronRight size={21} />
            </button>
          </div>
          <p>План и фактические операции вашей семьи в одном месте.</p>
        </div>
        <Button
          disabled={isLoading}
          onClick={() => openOperationModal(OperationTypeEnum.Expense)}
        >
          <Plus size={18} />
          Добавить операцию
        </Button>
      </div>

      {errorMessage && (
        <div className={styles.error} role="alert">
          <span>{errorMessage}</span>
          <Button
            disabled={isLoading}
            variant={ButtonVariantEnum.Ghost}
            onClick={handleGoogleReconnect}
          >
            <RefreshCw size={17} />
            Повторить
          </Button>
        </div>
      )}

      <section className={styles.summaryGrid}>
        <SummaryCard
          accent="green"
          label="Доход"
          value={formatMoney(summary.totalIncome)}
        />
        <SummaryCard
          accent="red"
          label="Расходы"
          value={formatMoney(summary.totalExpense)}
        />
        <SummaryCard
          accent="yellow"
          label="Накопления"
          value={formatMoney(summary.totalSaving)}
        />
        <SummaryCard
          accent={summary.freeBalance < 0 ? "red" : "purple"}
          label="Свободный остаток"
          value={formatMoney(summary.freeBalance)}
        />
      </section>

      <section className={styles.mainGrid}>
        <Card className={styles.planCard}>
          <div className={styles.sectionHeading}>
            <div>
              <h2>План по категориям</h2>
              <p>Факт относительно бюджета на месяц</p>
            </div>
            <Button
              variant={ButtonVariantEnum.Ghost}
              onClick={() => router.push("/plan")}
            >
              Весь план
            </Button>
          </div>
          <div className={styles.progressList}>
            {trackedCategories.length === 0 && (
              <EmptyState text="Активных категорий пока нет." />
            )}
            {trackedCategories.map((category) => {
              const progress = calculateCategoryProgress({
                categoryId: category.id,
                operations,
                plans,
                month: selectedMonth,
              });

              return (
                <CategoryProgressRow
                  actualAmount={progress.actualAmount}
                  category={category}
                  key={category.id}
                  plannedAmount={progress.plannedAmount}
                  progressPercent={progress.progressPercent}
                />
              );
            })}
          </div>
        </Card>

        <Card className={styles.quickCard}>
          <div className={styles.sectionHeading}>
            <div>
              <h2>Быстрые действия</h2>
              <p>Добавить запись без лишних шагов</p>
            </div>
          </div>
          <div className={styles.quickActions}>
            <QuickAction
              icon={<ArrowDownLeft />}
              label="Доход"
              tone="green"
              onClick={() => openOperationModal(OperationTypeEnum.Income)}
            />
            <QuickAction
              icon={<ArrowUpRight />}
              label="Расход"
              tone="red"
              onClick={() => openOperationModal(OperationTypeEnum.Expense)}
            />
            <QuickAction
              icon={<PiggyBank />}
              label="Накопление"
              tone="yellow"
              onClick={() => openOperationModal(OperationTypeEnum.Saving)}
            />
            <QuickAction
              icon={<ArrowRightLeft />}
              label="Перевод"
              tone="purple"
              onClick={() => setIsTransferModalOpen(true)}
            />
          </div>
        </Card>
      </section>

      <Card>
        <div className={styles.sectionHeading}>
          <div>
            <h2>Последние операции</h2>
            <p>Недавняя активность в семейном бюджете</p>
          </div>
          <Button
            variant={ButtonVariantEnum.Ghost}
            onClick={() => router.push("/operations")}
          >
            Все операции
          </Button>
        </div>
        <div className={styles.operations}>
          {recentOperations.length === 0 && (
            <EmptyState text="Операций пока нет. Добавьте первую запись." />
          )}
          {recentOperations.map((operation) => (
            <OperationRow
              categories={categories}
              key={operation.id}
              operation={operation}
            />
          ))}
        </div>
      </Card>

      <AddOperationModal
        categories={categories}
        currentUserEmail={currentUser.email}
        initialType={operationType}
        isLoading={isLoading}
        isOpen={isOperationModalOpen}
        users={users}
        onClose={() => setIsOperationModalOpen(false)}
        onSubmit={addOperation}
      />
      <TransferModal
        currentUserEmail={currentUser.email}
        isLoading={isLoading}
        isOpen={isTransferModalOpen}
        users={users}
        onClose={() => setIsTransferModalOpen(false)}
        onSubmit={addTransfer}
      />
    </div>
  );
}

interface StatusCardProps {
  actionLabel: string;
  description: string;
  isLoading?: boolean;
  onAction: () => void | Promise<void>;
  title: string;
}

function StatusCard({
  actionLabel,
  description,
  isLoading = false,
  onAction,
  title,
}: StatusCardProps) {
  return (
    <div className={styles.statusPage}>
      <Card className={styles.statusCard}>
        <h1>{title}</h1>
        <p>{description}</p>
        <Button disabled={isLoading} onClick={onAction}>
          {isLoading ? "Подключаем..." : actionLabel}
        </Button>
      </Card>
    </div>
  );
}

interface SummaryCardProps {
  label: string;
  value: string;
  accent: "green" | "red" | "yellow" | "purple";
}

function SummaryCard({ label, value, accent }: SummaryCardProps) {
  return (
    <Card className={styles.summaryCard}>
      <span className={`${styles.summaryMark} ${styles[accent]}`} />
      <span>{label}</span>
      <strong>{value}</strong>
    </Card>
  );
}

interface CategoryProgressRowProps {
  category: Category;
  actualAmount: number;
  plannedAmount: number;
  progressPercent: number;
}

function CategoryProgressRow({
  category,
  actualAmount,
  plannedAmount,
  progressPercent,
}: CategoryProgressRowProps) {
  const visibleProgress = Math.min(progressPercent, 100);

  return (
    <div className={styles.progressItem}>
      <div className={styles.progressMeta}>
        <div className={styles.categoryName}>
          <span style={{ background: category.color }} />
          <strong>{category.name}</strong>
        </div>
        <span>
          {formatMoney(actualAmount)} / {formatMoney(plannedAmount)}
        </span>
      </div>
      <div className={styles.progressTrack}>
        <span
          className={progressPercent > 100 ? styles.overBudget : undefined}
          style={{ width: `${visibleProgress}%` }}
        />
      </div>
    </div>
  );
}

interface QuickActionProps {
  disabled?: boolean;
  icon: ReactNode;
  label: string;
  tone: "green" | "red" | "yellow" | "purple";
  onClick?: () => void;
}

function QuickAction({
  disabled = false,
  icon,
  label,
  tone,
  onClick,
}: QuickActionProps) {
  return (
    <button
      className={styles.quickAction}
      disabled={disabled}
      type="button"
      onClick={onClick}
    >
      <span className={`${styles.quickIcon} ${styles[tone]}`}>{icon}</span>
      <strong>{label}</strong>
    </button>
  );
}

interface OperationRowProps {
  operation: Operation;
  categories: Category[];
}

function OperationRow({ operation, categories }: OperationRowProps) {
  const category = categories.find(
    (currentCategory) => currentCategory.id === operation.categoryId,
  );
  const isIncome = operation.type === OperationTypeEnum.Income;

  return (
    <div className={styles.operation}>
      <span
        className={styles.operationIcon}
        style={{ background: `${category?.color ?? "#64748b"}18` }}
      >
        {isIncome ? <ArrowDownLeft size={19} /> : <ArrowUpRight size={19} />}
      </span>
      <span className={styles.operationText}>
        <strong>{operation.comment || category?.name || "Операция"}</strong>
        <small>
          {category?.name ?? "Без категории"} ·{" "}
          {new Intl.DateTimeFormat("ru-RU", {
            day: "numeric",
            month: "short",
          }).format(new Date(`${operation.date}T00:00:00`))}
        </small>
      </span>
      <span
        className={`${styles.operationAmount} ${isIncome ? styles.income : ""}`}
      >
        {isIncome ? "+" : "−"}
        {formatMoney(operation.amount)}
        <small>{operationTypeLabels[operation.type]}</small>
      </span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className={styles.emptyState}>{text}</p>;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
