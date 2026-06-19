"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Edit3,
  FilterX,
  PiggyBank,
  Plus,
} from "lucide-react";
import { useMemo, useState } from "react";

import type { Operation } from "@/entities/operation/model/types";
import { AddOperationModal } from "@/features/add-operation";
import { TransferModal } from "@/features/add-transfer";
import { useFinanceWorkspace } from "@/features/finance-workspace";
import { formatMoney } from "@/shared/lib/money";
import { createOwnerOptions, getOwnerLabel } from "@/shared/lib/owners";
import {
  MonthId,
  OperationTypeEnum,
  OwnerId,
} from "@/shared/model/finance";
import { Button, ButtonVariantEnum } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { PageLayout } from "@/shared/ui/PageLayout";
import { Select } from "@/shared/ui/Select";

import styles from "./Operations.module.scss";

enum OperationTypeFilterEnum {
  All = "all",
}

enum OwnerFilterEnum {
  All = "all",
}

const operationTypeLabels: Record<OperationTypeEnum, string> = {
  [OperationTypeEnum.Income]: "Доход",
  [OperationTypeEnum.Expense]: "Расход",
  [OperationTypeEnum.Saving]: "Накопление",
};

export function Operations() {
  const {
    currentUser,
    spreadsheetId,
    categories,
    users,
    operations,
    transfers,
    isLoading,
    errorMessage,
    signIn,
    addOperation,
    addTransfer,
    updateOperation,
    refreshWorkspaceData,
    clearError,
  } = useFinanceWorkspace();
  const [selectedMonth, setSelectedMonth] = useState<MonthId>(
    getCurrentMonth(),
  );
  const [selectedType, setSelectedType] = useState<
    OperationTypeEnum | OperationTypeFilterEnum
  >(OperationTypeFilterEnum.All);
  const [selectedOwner, setSelectedOwner] = useState<
    OwnerId | OwnerFilterEnum
  >(OwnerFilterEnum.All);
  const [modalOperation, setModalOperation] = useState<Operation | null>(null);
  const [initialOperationType, setInitialOperationType] = useState(
    OperationTypeEnum.Expense,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  const monthOptions = useMemo(
    () => createMonthOptions(operations, transfers, selectedMonth),
    [operations, selectedMonth, transfers],
  );
  const filteredOperations = useMemo(
    () =>
      operations
        .filter((operation) => operation.month === selectedMonth)
        .filter(
          (operation) =>
            selectedType === OperationTypeFilterEnum.All ||
            operation.type === selectedType,
        )
        .filter(
          (operation) =>
            selectedOwner === OwnerFilterEnum.All ||
            operation.owner === selectedOwner,
        )
        .sort((firstOperation, secondOperation) =>
          secondOperation.date.localeCompare(firstOperation.date),
        ),
    [operations, selectedMonth, selectedOwner, selectedType],
  );
  const filteredTotal = filteredOperations.reduce(
    (total, operation) =>
      total +
      (operation.type === OperationTypeEnum.Income
        ? operation.amount
        : -operation.amount),
    0,
  );
  const filteredTransfers = useMemo(
    () =>
      transfers
        .filter((transfer) => transfer.month === selectedMonth)
        .filter(
          (transfer) =>
            selectedOwner === OwnerFilterEnum.All ||
            transfer.fromOwner === selectedOwner ||
            transfer.toOwner === selectedOwner,
        )
        .sort((firstTransfer, secondTransfer) =>
          secondTransfer.date.localeCompare(firstTransfer.date),
        ),
    [selectedMonth, selectedOwner, transfers],
  );

  const openCreateModal = (type = OperationTypeEnum.Expense) => {
    clearError();
    setModalOperation(null);
    setInitialOperationType(type);
    setIsModalOpen(true);
  };

  const openEditModal = (operation: Operation) => {
    clearError();
    setModalOperation(operation);
    setInitialOperationType(operation.type);
    setIsModalOpen(true);
  };

  const handleSubmitOperation = async (operation: Operation) => {
    if (modalOperation) {
      await updateOperation(operation);
      return;
    }

    await addOperation(operation);
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

  const resetFilters = () => {
    setSelectedMonth(getCurrentMonth());
    setSelectedType(OperationTypeFilterEnum.All);
    setSelectedOwner(OwnerFilterEnum.All);
  };

  if (!spreadsheetId) {
    return (
      <OperationsStatus
        actionLabel="Подключить таблицу на главной"
        description="Google Spreadsheet не подключён."
      />
    );
  }

  if (!currentUser) {
    return (
      <OperationsStatus
        actionLabel={isLoading ? "Подключаем..." : "Войти через Google"}
        description="Войдите повторно, чтобы прочитать операции."
        onAction={handleReconnect}
      />
    );
  }

  return (
    <PageLayout
      actions={
        <div className={styles.pageActions}>
          <Button
            disabled={isLoading}
            variant={ButtonVariantEnum.Secondary}
            onClick={() => setIsTransferModalOpen(true)}
          >
            <ArrowRightLeft size={18} />
            Перевод
          </Button>
          <Button disabled={isLoading} onClick={() => openCreateModal()}>
            <Plus size={18} />
            Добавить операцию
          </Button>
        </div>
      }
      description="Доходы, расходы и накопления семьи."
      title="Операции"
    >
      {errorMessage && <div className={styles.error}>{errorMessage}</div>}

      <Card className={styles.filters}>
        <Select
          label="Месяц"
          options={monthOptions}
          value={selectedMonth}
          onChange={(event) =>
            setSelectedMonth(event.target.value as MonthId)
          }
        />
        <Select
          label="Тип"
          options={[
            { label: "Все типы", value: OperationTypeFilterEnum.All },
            ...Object.values(OperationTypeEnum).map((type) => ({
              label: operationTypeLabels[type],
              value: type,
            })),
          ]}
          value={selectedType}
          onChange={(event) =>
            setSelectedType(
              event.target.value as
                | OperationTypeEnum
                | OperationTypeFilterEnum,
            )
          }
        />
        <Select
          label="Владелец"
          options={[
            { label: "Все владельцы", value: OwnerFilterEnum.All },
            ...createOwnerOptions(users),
          ]}
          value={selectedOwner}
          onChange={(event) =>
            setSelectedOwner(
              event.target.value as OwnerId | OwnerFilterEnum,
            )
          }
        />
        <Button variant={ButtonVariantEnum.Ghost} onClick={resetFilters}>
          <FilterX size={18} />
          Сбросить
        </Button>
      </Card>

      <section className={styles.summary}>
        <Card>
          <span>Найдено операций</span>
          <strong>{filteredOperations.length}</strong>
        </Card>
        <Card>
          <span>Итог по фильтру</span>
          <strong className={filteredTotal < 0 ? styles.negative : undefined}>
            {formatMoney(filteredTotal)}
          </strong>
        </Card>
      </section>

      <Card className={styles.listCard}>
        {filteredOperations.length === 0 ? (
          <div className={styles.empty}>
            <p>По выбранным фильтрам операций нет.</p>
            <Button onClick={() => openCreateModal()}>
              <Plus size={18} />
              Добавить первую
            </Button>
          </div>
        ) : (
          <div className={styles.list}>
            {filteredOperations.map((operation) => {
              const category = categories.find(
                (item) => item.id === operation.categoryId,
              );

              return (
                <article className={styles.operation} key={operation.id}>
                  <OperationIcon type={operation.type} />
                  <div className={styles.operationMain}>
                    <strong>
                      {operation.comment || category?.name || "Операция"}
                    </strong>
                    <span>
                      {category?.name ?? "Без категории"} ·{" "}
                      {getOwnerLabel(operation.owner, users)}
                    </span>
                  </div>
                  <time dateTime={operation.date}>
                    {formatOperationDate(operation.date)}
                  </time>
                  <div
                    className={`${styles.amount} ${
                      operation.type === OperationTypeEnum.Income
                        ? styles.positive
                        : styles.negative
                    }`}
                  >
                    {operation.type === OperationTypeEnum.Income ? "+" : "−"}
                    {formatMoney(operation.amount)}
                    <small>{operationTypeLabels[operation.type]}</small>
                  </div>
                  <Button
                    aria-label="Редактировать операцию"
                    variant={ButtonVariantEnum.Ghost}
                    onClick={() => openEditModal(operation)}
                  >
                    <Edit3 size={18} />
                  </Button>
                </article>
              );
            })}
          </div>
        )}
      </Card>

      <Card className={styles.listCard}>
        <div className={styles.transferHeading}>
          <div>
            <h2>Переводы</h2>
            <p>Не влияют на общий доход, расход и свободный остаток.</p>
          </div>
          <strong>{filteredTransfers.length}</strong>
        </div>
        {filteredTransfers.length === 0 ? (
          <div className={styles.empty}>
            <p>Переводов за выбранный месяц нет.</p>
          </div>
        ) : (
          <div className={styles.list}>
            {filteredTransfers.map((transfer) => (
              <article className={styles.operation} key={transfer.id}>
                <span className={`${styles.operationIcon} ${styles.transfer}`}>
                  <ArrowRightLeft size={19} />
                </span>
                <div className={styles.operationMain}>
                  <strong>{transfer.comment || "Перевод средств"}</strong>
                  <span>
                    {getOwnerLabel(transfer.fromOwner, users)} →{" "}
                    {getOwnerLabel(transfer.toOwner, users)}
                  </span>
                </div>
                <time dateTime={transfer.date}>
                  {formatOperationDate(transfer.date)}
                </time>
                <div className={styles.amount}>
                  {formatMoney(transfer.amount)}
                  <small>Перевод</small>
                </div>
              </article>
            ))}
          </div>
        )}
      </Card>

      <AddOperationModal
        categories={categories}
        currentUserEmail={currentUser.email}
        initialType={initialOperationType}
        isLoading={isLoading}
        isOpen={isModalOpen}
        operation={modalOperation}
        users={users}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitOperation}
      />
      <TransferModal
        currentUserEmail={currentUser.email}
        isLoading={isLoading}
        isOpen={isTransferModalOpen}
        users={users}
        onClose={() => setIsTransferModalOpen(false)}
        onSubmit={addTransfer}
      />
    </PageLayout>
  );
}

interface OperationsStatusProps {
  actionLabel: string;
  description: string;
  onAction?: () => void | Promise<void>;
}

function OperationsStatus({
  actionLabel,
  description,
  onAction,
}: OperationsStatusProps) {
  return (
    <PageLayout title="Операции">
      <Card className={styles.empty}>
        <p>{description}</p>
        {onAction && <Button onClick={onAction}>{actionLabel}</Button>}
      </Card>
    </PageLayout>
  );
}

function OperationIcon({ type }: { type: OperationTypeEnum }) {
  const icon =
    type === OperationTypeEnum.Income ? (
      <ArrowDownLeft size={19} />
    ) : type === OperationTypeEnum.Saving ? (
      <PiggyBank size={19} />
    ) : (
      <ArrowUpRight size={19} />
    );

  return (
    <span className={`${styles.operationIcon} ${styles[type]}`}>{icon}</span>
  );
}

function getCurrentMonth(): MonthId {
  const currentDate = new Date();

  return `${currentDate.getFullYear()}-${String(
    currentDate.getMonth() + 1,
  ).padStart(2, "0")}` as MonthId;
}

function createMonthOptions(
  operations: Operation[],
  transfers: { month: MonthId }[],
  selectedMonth: MonthId,
): { label: string; value: string }[] {
  const months = new Set(operations.map((operation) => operation.month));
  transfers.forEach((transfer) => months.add(transfer.month));
  months.add(selectedMonth);
  months.add(getCurrentMonth());

  return [...months]
    .sort((firstMonth, secondMonth) => secondMonth.localeCompare(firstMonth))
    .map((month) => ({
      label: new Intl.DateTimeFormat("ru-RU", {
        month: "long",
        year: "numeric",
      }).format(new Date(`${month}-01T00:00:00`)),
      value: month,
    }));
}

function formatOperationDate(date: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}
