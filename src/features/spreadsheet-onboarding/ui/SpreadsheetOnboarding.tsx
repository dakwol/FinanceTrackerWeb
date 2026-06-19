"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FilePlus2, Link2, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { useFinanceWorkspace } from "@/features/finance-workspace";
import {
  GoogleApiError,
  GoogleApiErrorCodeEnum,
  createFinanceSpreadsheet,
  initializeFinanceSpreadsheet,
  parseSpreadsheetIdFromUrl,
  validateSpreadsheetAccess,
} from "@/shared/api/google";
import { Button, ButtonVariantEnum } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Input } from "@/shared/ui/Input";

import {
  connectSpreadsheetSchema,
  type ConnectSpreadsheetFormValues,
} from "../model/schema";
import styles from "./SpreadsheetOnboarding.module.scss";

export function SpreadsheetOnboarding() {
  const router = useRouter();
  const {
    currentUser,
    isLoading,
    errorMessage,
    signIn,
    connectSpreadsheet,
    clearError,
  } = useFinanceWorkspace();
  const [spreadsheetToInitialize, setSpreadsheetToInitialize] = useState<
    string | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localErrorMessage, setLocalErrorMessage] = useState<string | null>(
    null,
  );
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ConnectSpreadsheetFormValues>({
    resolver: zodResolver(connectSpreadsheetSchema),
    defaultValues: {
      spreadsheetUrl: "",
    },
  });

  const getAuthorizedUser = async () => currentUser ?? signIn();

  const handleCreateSpreadsheet = async () => {
    clearError();
    setSpreadsheetToInitialize(null);
    setLocalErrorMessage(null);
    setIsSubmitting(true);

    try {
      const user = await getAuthorizedUser();
      const spreadsheet = await createFinanceSpreadsheet();

      await initializeFinanceSpreadsheet({
        spreadsheetId: spreadsheet.spreadsheetId,
        ownerName: user.name,
        ownerEmail: user.email,
      });
      await connectSpreadsheet(spreadsheet.spreadsheetId);
      router.push("/dashboard");
    } catch (error) {
      setLocalErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConnectSpreadsheet = handleSubmit(async ({ spreadsheetUrl }) => {
    clearError();
    setSpreadsheetToInitialize(null);
    setLocalErrorMessage(null);
    setIsSubmitting(true);

    try {
      await getAuthorizedUser();
      const spreadsheetId = parseSpreadsheetIdFromUrl(spreadsheetUrl);
      await validateSpreadsheetAccess(spreadsheetId);
      await connectSpreadsheet(spreadsheetId);
      router.push("/dashboard");
    } catch (error) {
      if (
        error instanceof GoogleApiError &&
        error.code === GoogleApiErrorCodeEnum.InvalidSpreadsheet
      ) {
        try {
          setSpreadsheetToInitialize(
            parseSpreadsheetIdFromUrl(spreadsheetUrl),
          );
        } catch {
          setSpreadsheetToInitialize(null);
        }
      }
      setLocalErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  });

  const handleInitializeSpreadsheet = async () => {
    if (!spreadsheetToInitialize) {
      return;
    }

    clearError();
    setLocalErrorMessage(null);
    setIsSubmitting(true);

    try {
      const user = await getAuthorizedUser();
      await initializeFinanceSpreadsheet({
        spreadsheetId: spreadsheetToInitialize,
        ownerName: user.name,
        ownerEmail: user.email,
      });
      await connectSpreadsheet(spreadsheetToInitialize);
      router.push("/dashboard");
    } catch (error) {
      setLocalErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const visibleErrorMessage = localErrorMessage ?? errorMessage;

  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <span className={styles.step}>Шаг 1 из 1</span>
        <h1>Подключите финансовую таблицу</h1>
        <p className={styles.description}>
          Создадим новую структуру Google Sheets или проверим существующую.
        </p>

        {visibleErrorMessage && (
          <div className={styles.error} role="alert">
            <TriangleAlert size={20} />
            <span>{visibleErrorMessage}</span>
          </div>
        )}

        <div className={styles.options}>
          <Card className={styles.option}>
            <span className={styles.icon}>
              <FilePlus2 />
            </span>
            <h2>Новая таблица</h2>
            <p>
              Создать листы, заголовки и стартовые категории автоматически.
            </p>
            <Button
              disabled={isLoading || isSubmitting}
              fullWidth
              onClick={handleCreateSpreadsheet}
            >
              {isLoading || isSubmitting ? "Создаём..." : "Создать таблицу"}
            </Button>
          </Card>

          <Card className={styles.option}>
            <span className={styles.icon}>
              <Link2 />
            </span>
            <h2>Существующая таблица</h2>
            <p>Укажите ссылку или spreadsheetId для проверки структуры.</p>
            <form
              className={styles.form}
              onSubmit={handleConnectSpreadsheet}
            >
              <Input
                error={errors.spreadsheetUrl?.message}
                label="Ссылка Google Sheets"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                {...register("spreadsheetUrl")}
              />
              <Button
                disabled={isLoading || isSubmitting}
                fullWidth
                type="submit"
                variant={ButtonVariantEnum.Secondary}
              >
                {isLoading || isSubmitting
                  ? "Проверяем..."
                  : "Подключить таблицу"}
              </Button>
            </form>

            {spreadsheetToInitialize && (
              <div className={styles.initialize}>
                <p>
                  Инициализация запишет служебные листы и стартовые данные.
                  Используйте её только для пустой таблицы.
                </p>
                <Button
                  disabled={isLoading || isSubmitting}
                  fullWidth
                  onClick={handleInitializeSpreadsheet}
                  variant={ButtonVariantEnum.Secondary}
                >
                  Инициализировать структуру
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </main>
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Произошла неизвестная ошибка.";
}
