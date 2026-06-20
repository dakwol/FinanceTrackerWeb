"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  BellOff,
  Repeat2,
  Send,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import type { ChatMessage } from "@/entities/message/model/types";
import { useFinanceWorkspace } from "@/features/finance-workspace";
import { formatMoney } from "@/shared/lib/money";
import { getOwnerLabel } from "@/shared/lib/owners";
import { OperationTypeEnum } from "@/shared/model/finance";
import { Button, ButtonVariantEnum } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { PageLayout } from "@/shared/ui/PageLayout";

import {
  appendChatMessage,
  readChatMessages,
  readPushSubscriptions,
  savePushSubscription,
  sendChatPushNotifications,
} from "../model/chatApi";
import styles from "./FamilyChat.module.scss";

const chatRefreshIntervalMs = 8_000;

type ChatFeedItem =
  | {
      kind: "message";
      id: string;
      createdAt: string;
      message: ChatMessage;
    }
  | {
      kind: "operation";
      id: string;
      createdAt: string;
      title: string;
      description: string;
      amount: number;
      type: OperationTypeEnum;
      author: string;
    }
  | {
      kind: "transfer";
      id: string;
      createdAt: string;
      title: string;
      description: string;
      amount: number;
      author: string;
    };

export function FamilyChat() {
  const {
    currentUser,
    spreadsheetId,
    categories,
    users,
    operations,
    transfers,
    isLoading,
    signIn,
  } = useFinanceWorkspace();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pushStatus, setPushStatus] = useState<
    "unsupported" | "default" | "enabled" | "denied"
  >("default");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const feedItems = useMemo<ChatFeedItem[]>(() => {
    const messageItems: ChatFeedItem[] = messages.map((message) => ({
      kind: "message",
      id: `message-${message.id}`,
      createdAt: message.createdAt,
      message,
    }));
    const operationItems: ChatFeedItem[] = operations.map((operation) => {
      const category = categories.find(
        (currentCategory) => currentCategory.id === operation.categoryId,
      );
      const user = users.find(
        (currentUser) =>
          currentUser.email.toLowerCase() ===
          operation.createdByEmail.toLowerCase(),
      );

      return {
        kind: "operation",
        id: `operation-${operation.id}`,
        createdAt: `${operation.createdAt}T12:00:00`,
        title: getOperationTitle(operation.type),
        description: [
          category?.name ?? "Без категории",
          getOwnerLabel(operation.owner, users),
          operation.comment,
        ]
          .filter(Boolean)
          .join(" · "),
        amount: operation.amount,
        type: operation.type,
        author: user?.name || user?.email || operation.createdByEmail,
      };
    });
    const transferItems: ChatFeedItem[] = transfers.map((transfer) => {
      const user = users.find(
        (currentUser) =>
          currentUser.email.toLowerCase() ===
          transfer.createdByEmail.toLowerCase(),
      );

      return {
        kind: "transfer",
        id: `transfer-${transfer.id}`,
        createdAt: `${transfer.createdAt}T12:00:00`,
        title: "Перевод между владельцами",
        description: `${getOwnerLabel(transfer.fromOwner, users)} → ${getOwnerLabel(transfer.toOwner, users)}${transfer.comment ? ` · ${transfer.comment}` : ""}`,
        amount: transfer.amount,
        author: user?.name || user?.email || transfer.createdByEmail,
      };
    });

    return [...messageItems, ...operationItems, ...transferItems].sort(
      (first, second) => first.createdAt.localeCompare(second.createdAt),
    );
  }, [categories, messages, operations, transfers, users]);

  useEffect(() => {
    if (!spreadsheetId || !currentUser) {
      return;
    }

    let isActive = true;

    const refreshMessages = async (showLoading = false) => {
      if (showLoading) {
        setIsChatLoading(true);
      }

      try {
        const nextMessages = await readChatMessages(spreadsheetId);

        if (isActive) {
          setMessages(nextMessages);
          setErrorMessage(null);
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(getErrorMessage(error));
        }
      } finally {
        if (isActive && showLoading) {
          setIsChatLoading(false);
        }
      }
    };

    void refreshMessages(true);
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refreshMessages();
      }
    }, chatRefreshIntervalMs);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshMessages();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [currentUser, spreadsheetId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [feedItems]);

  useEffect(() => {
    if (
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    ) {
      // Browser capability is an external value available only after hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPushStatus("unsupported");
      return;
    }

    if (Notification.permission === "denied") {
      setPushStatus("denied");
      return;
    }

    void navigator.serviceWorker
      .getRegistration()
      .then((registration) => registration?.pushManager.getSubscription())
      .then((subscription) => {
        setPushStatus(subscription ? "enabled" : "default");
      });
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const text = draft.trim();

    if (!spreadsheetId || !currentUser || !text || isSending) {
      return;
    }

    const message: ChatMessage = {
      id: crypto.randomUUID(),
      senderEmail: currentUser.email,
      senderName: currentUser.name,
      text,
      createdAt: new Date().toISOString(),
    };

    setIsSending(true);
    setErrorMessage(null);

    try {
      await appendChatMessage(spreadsheetId, message);
      setMessages((currentMessages) => [...currentMessages, message]);
      setDraft("");

      try {
        const subscriptions = await readPushSubscriptions(spreadsheetId);
        await sendChatPushNotifications({ message, subscriptions });
      } catch (error) {
        setErrorMessage(getErrorMessage(error));
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSending(false);
    }
  };

  const enablePushNotifications = async () => {
    if (!spreadsheetId || !currentUser) {
      return;
    }

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    if (!publicKey) {
      setErrorMessage("Push-уведомления не настроены на сервере.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        setPushStatus("denied");
        return;
      }

      const registration =
        (await navigator.serviceWorker.getRegistration()) ??
        (await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        }));
      const existingSubscription =
        await registration.pushManager.getSubscription();
      const subscription =
        existingSubscription ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        }));

      await savePushSubscription(
        spreadsheetId,
        subscription,
        currentUser.email,
      );
      setPushStatus("enabled");
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  };

  if (!spreadsheetId) {
    return (
      <PageLayout title="Семейный чат">
        <Card className={styles.status}>
          Сначала подключите Google Spreadsheet.
        </Card>
      </PageLayout>
    );
  }

  if (!currentUser) {
    return (
      <PageLayout title="Семейный чат">
        <Card className={styles.status}>
          <p>Войдите в Google, чтобы открыть чат.</p>
          <Button disabled={isLoading} onClick={() => void signIn()}>
            Войти через Google
          </Button>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      actions={
        pushStatus !== "unsupported" && (
          <Button
            disabled={pushStatus === "enabled" || pushStatus === "denied"}
            variant={ButtonVariantEnum.Secondary}
            onClick={() => void enablePushNotifications()}
          >
            {pushStatus === "enabled" ? <Bell size={17} /> : <BellOff size={17} />}
            {getPushButtonLabel(pushStatus)}
          </Button>
        )
      }
      description="Сообщения хранятся в вашей общей Google-таблице."
      title="Семейный чат"
    >
      {errorMessage && (
        <div className={styles.error} role="alert">
          {errorMessage}
        </div>
      )}

      <Card className={styles.chat}>
        <div className={styles.messages} aria-live="polite">
          {isChatLoading && feedItems.length === 0 && (
            <p className={styles.empty}>Загружаем сообщения…</p>
          )}
          {!isChatLoading && feedItems.length === 0 && (
            <p className={styles.empty}>
              Сообщений пока нет. Начните разговор.
            </p>
          )}
          {feedItems.map((item) => {
            if (item.kind !== "message") {
              const Icon =
                item.kind === "transfer"
                  ? Repeat2
                  : item.type === OperationTypeEnum.Expense
                    ? ArrowUpRight
                    : ArrowDownLeft;

              return (
                <article className={styles.event} key={item.id}>
                  <span className={styles.eventIcon}>
                    <Icon size={18} />
                  </span>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.description}</p>
                    <small>{item.author}</small>
                  </div>
                  <div className={styles.eventAmount}>
                    <strong>{formatMoney(item.amount)}</strong>
                    <time dateTime={item.createdAt}>
                      {formatMessageTime(item.createdAt)}
                    </time>
                  </div>
                </article>
              );
            }

            const message = item.message;
            const isOwn =
              message.senderEmail.toLowerCase() ===
              currentUser.email.toLowerCase();

            return (
              <article
                className={`${styles.message} ${isOwn ? styles.own : ""}`}
                key={item.id}
              >
                {!isOwn && <strong>{message.senderName}</strong>}
                <p>{message.text}</p>
                <time dateTime={message.createdAt}>
                  {formatMessageTime(message.createdAt)}
                </time>
              </article>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <form className={styles.composer} onSubmit={handleSubmit}>
          <textarea
            aria-label="Сообщение"
            maxLength={1000}
            placeholder="Написать сообщение…"
            rows={1}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
          />
          <Button
            aria-label="Отправить сообщение"
            disabled={isSending || !draft.trim()}
            type="submit"
          >
            <Send size={18} />
          </Button>
        </form>
      </Card>
    </PageLayout>
  );
}

function getPushButtonLabel(
  status: "unsupported" | "default" | "enabled" | "denied",
): string {
  if (status === "enabled") {
    return "Уведомления включены";
  }

  if (status === "denied") {
    return "Уведомления запрещены";
  }

  return "Включить уведомления";
}

function getOperationTitle(type: OperationTypeEnum): string {
  if (type === OperationTypeEnum.Income) {
    return "Добавлен доход";
  }

  if (type === OperationTypeEnum.Saving) {
    return "Добавлено накопление";
  }

  return "Добавлен расход";
}

function formatMessageTime(value: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function urlBase64ToUint8Array(value: string): ArrayBuffer {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    output[index] = rawData.charCodeAt(index);
  }

  return output.buffer;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Неизвестная ошибка чата.";
}
