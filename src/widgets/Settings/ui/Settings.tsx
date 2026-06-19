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

import { useFinanceWorkspace } from "@/features/finance-workspace";
import { InvitePartnerForm } from "@/features/invite-partner";
import { Button, ButtonVariantEnum } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { PageLayout } from "@/shared/ui/PageLayout";

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
    clearSpreadsheet,
    refreshWorkspaceData,
    clearError,
  } = useFinanceWorkspace();
  const handleReconnect = async () => {
    clearError();

    try {
      await signIn();
      await refreshWorkspaceData();
    } catch {
      return;
    }
  };

  const handleChangeSpreadsheet = () => {
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
                  variant={ButtonVariantEnum.Ghost}
                  onClick={handleChangeSpreadsheet}
                >
                  <Unplug size={17} />
                  Сменить таблицу
                </Button>
              </div>
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
