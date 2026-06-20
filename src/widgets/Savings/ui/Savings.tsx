"use client";

import { Edit3, Landmark, Plus, Target } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

import type { SavingsAccount } from "@/entities/account/model/types";
import type { SavingsGoal } from "@/entities/savings-goal/model/types";
import { useFinanceWorkspace } from "@/features/finance-workspace";
import { categoryColorOptions } from "@/shared/lib/categoryAppearance";
import { getCurrentIsoDate } from "@/shared/lib/date";
import { formatMoney, parseMoneyToKopecks } from "@/shared/lib/money";
import { Button, ButtonVariantEnum } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Input } from "@/shared/ui/Input";
import { Modal } from "@/shared/ui/Modal";
import { MoneyInput } from "@/shared/ui/MoneyInput";
import { PageLayout } from "@/shared/ui/PageLayout";

import styles from "./Savings.module.scss";

type EditorState =
  | { kind: "account"; item: SavingsAccount | null }
  | { kind: "goal"; item: SavingsGoal | null }
  | null;

export function Savings() {
  const {
    spreadsheetId,
    currentUser,
    accounts,
    savingsGoals,
    isLoading,
    errorMessage,
    signIn,
    addAccount,
    updateAccount,
    addSavingsGoal,
    updateSavingsGoal,
  } = useFinanceWorkspace();
  const [editor, setEditor] = useState<EditorState>(null);
  const totalBalance = useMemo(
    () => accounts.reduce((sum, account) => sum + account.balance, 0),
    [accounts],
  );
  const totalGoalAmount = useMemo(
    () => savingsGoals.reduce((sum, goal) => sum + goal.targetAmount, 0),
    [savingsGoals],
  );
  const totalGoalProgress = useMemo(
    () => savingsGoals.reduce((sum, goal) => sum + goal.currentAmount, 0),
    [savingsGoals],
  );

  if (!spreadsheetId) {
    return <SavingsStatus text="Сначала подключите Google Spreadsheet." />;
  }

  if (!currentUser) {
    return (
      <SavingsStatus
        actionLabel="Войти через Google"
        text="Войдите, чтобы открыть счета и цели накопления."
        onAction={signIn}
      />
    );
  }

  return (
    <PageLayout
      actions={
        <div className={styles.pageActions}>
          <Button
            variant={ButtonVariantEnum.Secondary}
            onClick={() => setEditor({ kind: "account", item: null })}
          >
            <Plus size={17} />
            Счёт
          </Button>
          <Button onClick={() => setEditor({ kind: "goal", item: null })}>
            <Plus size={17} />
            Цель
          </Button>
        </div>
      }
      description="Деньги на счетах и прогресс по финансовым целям."
      title="Накопления"
    >
      {errorMessage && <div className={styles.error}>{errorMessage}</div>}

      <section className={styles.summary}>
        <Card>
          <span>Всего на счетах</span>
          <strong>{formatMoney(totalBalance)}</strong>
        </Card>
        <Card>
          <span>Отложено на цели</span>
          <strong>{formatMoney(totalGoalProgress)}</strong>
          <small>из {formatMoney(totalGoalAmount)}</small>
        </Card>
      </section>

      <SavingsSection title="Счета" description="Карты, вклады и наличные.">
        {accounts.length === 0 && (
          <Card className={styles.empty}>Добавьте первый счёт.</Card>
        )}
        {accounts.map((account) => (
          <Card className={styles.item} key={account.id}>
            <ItemHeading
              color={account.color}
              icon={<Landmark size={21} />}
              name={account.name}
              value={formatMoney(account.balance)}
            />
            <Button
              variant={ButtonVariantEnum.Ghost}
              onClick={() => setEditor({ kind: "account", item: account })}
            >
              <Edit3 size={16} />
              Изменить остаток
            </Button>
          </Card>
        ))}
      </SavingsSection>

      <SavingsSection
        title="Цели"
        description="Сколько уже накоплено и сколько осталось."
      >
        {savingsGoals.length === 0 && (
          <Card className={styles.empty}>Добавьте первую цель.</Card>
        )}
        {savingsGoals.map((goal) => {
          const progress =
            goal.targetAmount > 0
              ? Math.min(
                  100,
                  Math.round((goal.currentAmount / goal.targetAmount) * 100),
                )
              : 0;

          return (
            <Card className={styles.item} key={goal.id}>
              <ItemHeading
                color={goal.color}
                icon={<Target size={21} />}
                name={goal.name}
                value={`${progress}%`}
              />
              <div className={styles.progress}>
                <span
                  style={{ background: goal.color, width: `${progress}%` }}
                />
              </div>
              <div className={styles.goalAmounts}>
                <span>{formatMoney(goal.currentAmount)}</span>
                <span>из {formatMoney(goal.targetAmount)}</span>
              </div>
              <small>
                Осталось{" "}
                {formatMoney(
                  Math.max(0, goal.targetAmount - goal.currentAmount),
                )}
              </small>
              <Button
                variant={ButtonVariantEnum.Ghost}
                onClick={() => setEditor({ kind: "goal", item: goal })}
              >
                <Edit3 size={16} />
                Обновить прогресс
              </Button>
            </Card>
          );
        })}
      </SavingsSection>

      {editor && (
        <SavingsEditor
          editor={editor}
          isLoading={isLoading}
          key={`${editor.kind}-${editor.item?.id ?? "new"}`}
          onClose={() => setEditor(null)}
          onSaveAccount={async (account) =>
            account.rowNumber ? updateAccount(account) : addAccount(account)
          }
          onSaveGoal={async (goal) =>
            goal.rowNumber ? updateSavingsGoal(goal) : addSavingsGoal(goal)
          }
        />
      )}
    </PageLayout>
  );
}

function SavingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.block}>
      <div className={styles.blockHeading}>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <div className={styles.grid}>{children}</div>
    </section>
  );
}

function ItemHeading({
  color,
  icon,
  name,
  value,
}: {
  color: string;
  icon: React.ReactNode;
  name: string;
  value: string;
}) {
  return (
    <div className={styles.itemHeading}>
      <span
        className={styles.itemIcon}
        style={{ background: `${color}20`, color }}
      >
        {icon}
      </span>
      <div>
        <h3>{name}</h3>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function SavingsEditor({
  editor,
  isLoading,
  onClose,
  onSaveAccount,
  onSaveGoal,
}: {
  editor: Exclude<EditorState, null>;
  isLoading: boolean;
  onClose: () => void;
  onSaveAccount: (account: SavingsAccount) => Promise<void>;
  onSaveGoal: (goal: SavingsGoal) => Promise<void>;
}) {
  const [name, setName] = useState(editor.item?.name ?? "");
  const [amount, setAmount] = useState(
    formatMoneyInput(
      editor.kind === "account"
        ? (editor.item?.balance ?? 0)
        : (editor.item?.currentAmount ?? 0),
    ),
  );
  const [targetAmount, setTargetAmount] = useState(
    editor.kind === "goal"
      ? formatMoneyInput(editor.item?.targetAmount ?? 0)
      : "",
  );
  const [color, setColor] = useState(
    editor.item?.color ?? categoryColorOptions[0],
  );
  const [formError, setFormError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedName = name.trim();
    const currentAmount = parseMoneyToKopecks(amount);
    const target = parseMoneyToKopecks(targetAmount);

    if (normalizedName.length < 2) {
      setFormError("Название должно содержать минимум 2 символа.");
      return;
    }

    if (currentAmount < 0 || (editor.kind === "goal" && target <= 0)) {
      setFormError("Проверьте указанные суммы.");
      return;
    }

    const date = getCurrentIsoDate();

    if (editor.kind === "account") {
      await onSaveAccount({
        rowNumber: editor.item?.rowNumber,
        id: editor.item?.id ?? crypto.randomUUID(),
        name: normalizedName,
        balance: currentAmount,
        color,
        createdAt: editor.item?.createdAt ?? date,
        updatedAt: date,
      });
    } else {
      await onSaveGoal({
        rowNumber: editor.item?.rowNumber,
        id: editor.item?.id ?? crypto.randomUUID(),
        name: normalizedName,
        targetAmount: target,
        currentAmount,
        color,
        createdAt: editor.item?.createdAt ?? date,
        updatedAt: date,
      });
    }

    onClose();
  };

  return (
    <Modal
      isOpen
      title={getEditorTitle(editor)}
      onClose={onClose}
    >
      <form className={styles.form} onSubmit={(event) => void submit(event)}>
        <Input
          label="Название"
          placeholder={
            editor.kind === "account" ? "Например, вклад" : "Например, отпуск"
          }
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        {editor.kind === "goal" && (
          <MoneyInput
            label="Сколько нужно накопить"
            value={targetAmount}
            onChange={(event) => setTargetAmount(event.target.value)}
          />
        )}
        <MoneyInput
          label={
            editor.kind === "account" ? "Текущий остаток" : "Уже накоплено"
          }
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
        <div className={styles.colorField}>
          <span>Цвет</span>
          <div>
            {categoryColorOptions.map((option) => (
              <button
                aria-label={`Выбрать цвет ${option}`}
                aria-pressed={color === option}
                key={option}
                style={{ background: option }}
                type="button"
                onClick={() => setColor(option)}
              />
            ))}
          </div>
        </div>
        {formError && <p className={styles.formError}>{formError}</p>}
        <Button disabled={isLoading} fullWidth type="submit">
          {isLoading ? "Сохраняем..." : "Сохранить"}
        </Button>
      </form>
    </Modal>
  );
}

function SavingsStatus({
  text,
  actionLabel,
  onAction,
}: {
  text: string;
  actionLabel?: string;
  onAction?: () => Promise<unknown>;
}) {
  return (
    <PageLayout title="Накопления">
      <Card className={styles.empty}>
        <p>{text}</p>
        {actionLabel && onAction && (
          <Button onClick={() => void onAction()}>{actionLabel}</Button>
        )}
      </Card>
    </PageLayout>
  );
}

function getEditorTitle(editor: Exclude<EditorState, null>): string {
  if (editor.kind === "account") {
    return editor.item ? "Изменить счёт" : "Новый счёт";
  }

  return editor.item ? "Изменить цель" : "Новая цель";
}

function formatMoneyInput(amount: number): string {
  return amount === 0 ? "" : String(amount / 100).replace(".", ",");
}
