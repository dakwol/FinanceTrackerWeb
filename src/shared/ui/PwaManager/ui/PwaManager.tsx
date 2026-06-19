"use client";

import { Download, WifiOff, X } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";

import { Button, ButtonVariantEnum } from "@/shared/ui/Button";

import styles from "./PwaManager.module.scss";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

export function PwaManager() {
  const isOnline = useSyncExternalStore(
    subscribeToNetworkStatus,
    getNetworkStatusSnapshot,
    getServerNetworkStatusSnapshot,
  );
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallDismissed, setIsInstallDismissed] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt,
    );

    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      void navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      });
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  const installApplication = async () => {
    if (!installPrompt) {
      return;
    }

    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  return (
    <>
      {!isOnline && (
        <div className={styles.offline} role="status">
          <WifiOff size={18} />
          <span>
            Нет интернета. Просмотр оболочки доступен, запись в Google Sheets
            временно отключена.
          </span>
        </div>
      )}
      {installPrompt && !isInstallDismissed && (
        <div className={styles.install}>
          <div>
            <strong>Установить приложение</strong>
            <span>Быстрый запуск с главного экрана телефона.</span>
          </div>
          <Button onClick={installApplication}>
            <Download size={17} />
            Установить
          </Button>
          <Button
            aria-label="Скрыть предложение"
            variant={ButtonVariantEnum.Ghost}
            onClick={() => setIsInstallDismissed(true)}
          >
            <X size={18} />
          </Button>
        </div>
      )}
    </>
  );
}

function subscribeToNetworkStatus(onStoreChange: () => void): () => void {
  window.addEventListener("online", onStoreChange);
  window.addEventListener("offline", onStoreChange);

  return () => {
    window.removeEventListener("online", onStoreChange);
    window.removeEventListener("offline", onStoreChange);
  };
}

function getNetworkStatusSnapshot(): boolean {
  return navigator.onLine;
}

function getServerNetworkStatusSnapshot(): true {
  return true;
}
