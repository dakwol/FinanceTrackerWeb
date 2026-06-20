"use client";

import {
  ExternalLink,
  FileSpreadsheet,
  LogOut,
  RefreshCw,
  Unplug,
  UserRoundPlus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useFinanceWorkspace } from "@/features/finance-workspace";
import { InvitePartnerForm } from "@/features/invite-partner";
import {
  listAvailableGoogleSpreadsheets,
  validateSpreadsheetAccess,
} from "@/shared/api/google";
import type { GoogleDriveFile } from "@/shared/api/google";
import { Button, ButtonVariantEnum } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { PageLayout } from "@/shared/ui/PageLayout";
import { Select } from "@/shared/ui/Select";

import styles from "./Settings.module.scss";

export function Settings() {
  const router = useRouter();
  const {
    currentUser,
    spreadsheetId,
    spreadsheet,
    users,
    isLoading,
    errorMessage,
    signIn,
    signOut,
    invitePartner,
    connectSpreadsheet,
    clearSpreadsheet,
    refreshWorkspaceData,
    clearError,
  } = useFinanceWorkspace();
  const [availableSpreadsheets, setAvailableSpreadsheets] = useState<
    GoogleDriveFile[]
  >([]);
  const [selectedSpreadsheetId, setSelectedSpreadsheetId] = useState("");
  const [isSpreadsheetPickerOpen, setIsSpreadsheetPickerOpen] =
    useState(false);
  const [isLoadingSpreadsheets, setIsLoadingSpreadsheets] = useState(false);
  const [spreadsheetPickerError, setSpreadsheetPickerError] = useState<
    string | null
  >(null);
  const handleReconnect = async () => {
    clearError();

    try {
      await signIn();
      await refreshWorkspaceData();
    } catch {
      return;
    }
  };

  const handleChangeSpreadsheet = async () => {
    clearError();
    setSpreadsheetPickerError(null);
    setIsSpreadsheetPickerOpen(true);
    setIsLoadingSpreadsheets(true);

    try {
      const files = await listAvailableGoogleSpreadsheets();
      const otherFiles = files.filter((file) => file.id !== spreadsheetId);

      setAvailableSpreadsheets(otherFiles);
      setSelectedSpreadsheetId(otherFiles[0]?.id ?? "");
    } catch (error) {
      setSpreadsheetPickerError(getErrorMessage(error));
    } finally {
      setIsLoadingSpreadsheets(false);
    }
  };

  const handleSelectSpreadsheet = async () => {
    if (!selectedSpreadsheetId) {
      return;
    }

    clearError();
    setSpreadsheetPickerError(null);
    setIsLoadingSpreadsheets(true);

    try {
      await validateSpreadsheetAccess(selectedSpreadsheetId);
      await connectSpreadsheet(selectedSpreadsheetId);
      setIsSpreadsheetPickerOpen(false);
    } catch (error) {
      setSpreadsheetPickerError(getErrorMessage(error));
    } finally {
      setIsLoadingSpreadsheets(false);
    }
  };

  const handleConnectAnotherSpreadsheet = () => {
    clearSpreadsheet();
    router.push("/onboarding");
  };

  const handleSignOut = async () => {
    clearError();

    try {
      await signOut();
      router.push("/login");
    } catch {
      return;
    }
  };

  return (
    <PageLayout
      description="Google Sheets workspace и доступ партнёра."
      title="Настройки"
    >
      {errorMessage && (
        <div className={styles.error} role="alert">
          {errorMessage}
        </div>
      )}

      <div className={styles.grid}>
        <Card className={styles.section}>
          <div className={styles.heading}>
            <span className={styles.icon}>
              <FileSpreadsheet size={20} />
            </span>
            <div>
              <h2>Финансовая таблица</h2>
              <p>Источник данных приложения</p>
            </div>
          </div>

          {spreadsheetId ? (
            <div className={styles.details}>
              <Detail label="Название" value={spreadsheet?.properties.title ?? "Google Spreadsheet"} />
              <Detail label="Spreadsheet ID" value={spreadsheetId} monospace />
              <div className={styles.actions}>
                <a
                  href={
                    spreadsheet?.spreadsheetUrl ??
                    `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
                  }
                  rel="noreferrer"
                  target="_blank"
                >
                  <Button variant={ButtonVariantEnum.Secondary}>
                    <ExternalLink size={17} />
                    Открыть таблицу
                  </Button>
                </a>
                <Button
                  disabled={isLoadingSpreadsheets}
                  variant={ButtonVariantEnum.Ghost}
                  onClick={() => void handleChangeSpreadsheet()}
                >
                  <Unplug size={17} />
                  Сменить таблицу
                </Button>
              </div>
              {isSpreadsheetPickerOpen && (
                <div className={styles.spreadsheetPicker}>
                  <Select
                    disabled={
                      isLoadingSpreadsheets ||
                      availableSpreadsheets.length === 0
                    }
                    label="Доступные таблицы приложения"
                    options={
                      availableSpreadsheets.length > 0
                        ? availableSpreadsheets.map((file) => ({
                            label: file.ownedByMe
                              ? `${file.name} — моя`
                              : `${file.name} — общий доступ`,
                            value: file.id,
                          }))
                        : [
                            {
                              label: isLoadingSpreadsheets
                                ? "Загружаем таблицы..."
                                : "Других таблиц не найдено",
                              value: "",
                            },
                          ]
                    }
                    value={selectedSpreadsheetId}
                    onChange={(event) =>
                      setSelectedSpreadsheetId(event.target.value)
                    }
                  />
                  {spreadsheetPickerError && (
                    <p className={styles.pickerError} role="alert">
                      {spreadsheetPickerError}
                    </p>
                  )}
                  <div className={styles.actions}>
                    <Button
                      disabled={
                        isLoadingSpreadsheets || !selectedSpreadsheetId
                      }
                      onClick={() => void handleSelectSpreadsheet()}
                    >
                      {isLoadingSpreadsheets
                        ? "Проверяем..."
                        : "Выбрать таблицу"}
                    </Button>
                    <Button
                      disabled={isLoadingSpreadsheets}
                      variant={ButtonVariantEnum.Ghost}
                      onClick={handleConnectAnotherSpreadsheet}
                    >
                      Подключить по ссылке
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.empty}>
              <p>Таблица не подключена.</p>
              <Button onClick={() => router.push("/onboarding")}>
                Подключить
              </Button>
            </div>
          )}
        </Card>

        <Card className={styles.section}>
          <div className={styles.heading}>
            <span className={styles.icon}>
              <UserRoundPlus size={20} />
            </span>
            <div>
              <h2>Владельцы бюджета</h2>
              <p>Используются в категориях, операциях, планах и переводах</p>
            </div>
          </div>
          <div className={styles.userList}>
            {users.map((user) => (
              <div className={styles.user} key={user.id}>
                <span className={styles.avatar}>
                  {(user.name || user.email).slice(0, 1).toUpperCase()}
                </span>
                <span>
                  <strong>{user.name || "Приглашённый пользователь"}</strong>
                  <small>{user.email}</small>
                </span>
                <span className={styles.role}>
                  {user.role === "owner" ? "Владелец" : "Партнёр"}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className={styles.section}>
          <div className={styles.heading}>
            <span className={styles.icon}>
              <UserRoundPlus size={20} />
            </span>
            <div>
              <h2>Доступ партнёра</h2>
              <p>Writer permission через Google Drive</p>
            </div>
          </div>

          {currentUser && spreadsheetId ? (
            <InvitePartnerForm
              currentUserEmail={currentUser.email}
              isLoading={isLoading}
              onSubmit={invitePartner}
            />
          ) : (
            <div className={styles.empty}>
              <p>Для приглашения подтвердите доступ к Google.</p>
              <Button disabled={isLoading} onClick={handleReconnect}>
                <RefreshCw size={17} />
                Войти через Google
              </Button>
            </div>
          )}
        </Card>

        <Card className={styles.section}>
          <div className={styles.heading}>
            <span className={styles.avatar}>
              {currentUser?.name.slice(0, 1).toUpperCase() ?? "?"}
            </span>
            <div>
              <h2>{currentUser?.name ?? "Google аккаунт"}</h2>
              <p>{currentUser?.email ?? "Сессия не подтверждена"}</p>
            </div>
          </div>
          <div className={styles.actions}>
            {!currentUser && (
              <Button disabled={isLoading} onClick={handleReconnect}>
                Войти через Google
              </Button>
            )}
            {currentUser && (
              <Button
                disabled={isLoading}
                variant={ButtonVariantEnum.Secondary}
                onClick={handleSignOut}
              >
                <LogOut size={17} />
                Выйти
              </Button>
            )}
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}

interface DetailProps {
  label: string;
  monospace?: boolean;
  value: string;
}

function Detail({ label, monospace = false, value }: DetailProps) {
  return (
    <div className={styles.detail}>
      <span>{label}</span>
      <strong className={monospace ? styles.monospace : undefined}>
        {value}
      </strong>
    </div>
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Не удалось загрузить список таблиц.";
}
