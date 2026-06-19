"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { Landmark, LogIn, LogOut, X } from "lucide-react";
import { useEffect, useRef } from "react";

import { useFinanceWorkspace } from "@/features/finance-workspace";
import { navigationItems } from "@/shared/config/navigation";

import styles from "./AppShell.module.scss";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    currentUser,
    spreadsheetId,
    spreadsheet,
    isLoading,
    errorMessage,
    signIn,
    signOut,
    refreshWorkspaceData,
    clearError,
  } = useFinanceWorkspace();
  const loadedWorkspaceKey = useRef<string | null>(null);

  useEffect(() => {
    if (!currentUser || !spreadsheetId) {
      loadedWorkspaceKey.current = null;
      return;
    }

    const workspaceKey = `${currentUser.id}:${spreadsheetId}`;

    if (loadedWorkspaceKey.current === workspaceKey) {
      return;
    }

    loadedWorkspaceKey.current = workspaceKey;
    void refreshWorkspaceData().catch(() => {
      loadedWorkspaceKey.current = null;
    });
  }, [currentUser, refreshWorkspaceData, spreadsheetId]);

  const handleSessionAction = async () => {
    try {
      if (currentUser) {
        await signOut();
        router.push("/login");
        return;
      }

      await signIn();
    } catch {
      return;
    }
  };

  return (
    <div className={styles.shell}>
      {isLoading && <span className={styles.loadingBar} />}
      {errorMessage && (
        <div className={styles.globalError} role="alert">
          <span>{errorMessage}</span>
          <button
            aria-label="Закрыть сообщение"
            type="button"
            onClick={clearError}
          >
            <X size={17} />
          </button>
        </div>
      )}
      <aside className={styles.sidebar}>
        <Link className={styles.brand} href="/dashboard">
          <span className={styles.brandIcon}>
            <Landmark size={20} />
          </span>
          <span>
            <strong>Семейный бюджет</strong>
            <small>
              {spreadsheet?.properties.title ??
                (spreadsheetId ? "Таблица подключена" : "Таблица не подключена")}
            </small>
          </span>
        </Link>
        <nav className={styles.desktopNavigation}>
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                className={clsx(styles.navigationItem, isActive && styles.active)}
                href={item.href}
                key={item.href}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className={styles.profile}>
          <Link className={styles.profileLink} href="/settings">
            {currentUser?.pictureUrl ? (
              <span
                aria-hidden="true"
                className={styles.avatarImage}
                style={{ backgroundImage: `url("${currentUser.pictureUrl}")` }}
              />
            ) : (
              <span className={styles.avatar}>
                {currentUser?.name.slice(0, 1).toUpperCase() ?? "?"}
              </span>
            )}
            <span className={styles.profileText}>
              <strong>{currentUser?.name ?? "Google аккаунт"}</strong>
              <small>
                {currentUser?.email ??
                  (spreadsheetId ? "Требуется вход" : "Не подключён")}
              </small>
            </span>
          </Link>
          <button
            aria-label={currentUser ? "Выйти из Google" : "Войти через Google"}
            className={styles.sessionButton}
            disabled={isLoading}
            type="button"
            onClick={() => void handleSessionAction()}
          >
            {currentUser ? <LogOut size={17} /> : <LogIn size={17} />}
          </button>
        </div>
      </aside>
      <main className={styles.content}>{children}</main>
      <nav className={styles.mobileNavigation}>
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              className={clsx(styles.mobileItem, isActive && styles.active)}
              href={item.href}
              key={item.href}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
