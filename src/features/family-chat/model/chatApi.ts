import type {
  ChatMessage,
  StoredPushSubscription,
} from "@/entities/message/model/types";
import {
  appendSheetRow,
  ensureFinanceSpreadsheetStructure,
  getGoogleAccessToken,
  readSheetRows,
  updateSheetRow,
} from "@/shared/api/google";
import { SheetNameEnum } from "@/shared/model/finance";

export async function readChatMessages(
  spreadsheetId: string,
): Promise<ChatMessage[]> {
  await ensureFinanceSpreadsheetStructure(spreadsheetId);
  const rows = await readSheetRows(spreadsheetId, SheetNameEnum.Messages);

  return rows
    .slice(1)
    .flatMap((row) => {
      if (!row[0] || !row[1] || !row[3] || !row[4]) {
        return [];
      }

      return [{
        id: String(row[0]),
        senderEmail: String(row[1]),
        senderName: String(row[2] ?? row[1]),
        text: String(row[3]),
        createdAt: String(row[4]),
      }];
    })
    .sort((first, second) => first.createdAt.localeCompare(second.createdAt));
}

export async function appendChatMessage(
  spreadsheetId: string,
  message: ChatMessage,
): Promise<void> {
  await appendSheetRow(spreadsheetId, SheetNameEnum.Messages, [
    message.id,
    message.senderEmail,
    message.senderName,
    message.text,
    message.createdAt,
  ]);
}

export async function savePushSubscription(
  spreadsheetId: string,
  subscription: PushSubscription,
  userEmail: string,
): Promise<void> {
  await ensureFinanceSpreadsheetStructure(spreadsheetId);
  const rows = await readSheetRows(
    spreadsheetId,
    SheetNameEnum.PushSubscriptions,
  );
  const serializedSubscription = subscription.toJSON();
  const p256dh = serializedSubscription.keys?.p256dh;
  const auth = serializedSubscription.keys?.auth;

  if (!p256dh || !auth) {
    throw new Error("Браузер не вернул ключи push-подписки.");
  }

  const now = new Date().toISOString();
  const existingRowIndex = rows
    .slice(1)
    .findIndex((row) => String(row[0] ?? "") === subscription.endpoint);
  const existingCreatedAt =
    existingRowIndex >= 0
      ? String(rows[existingRowIndex + 1]?.[4] ?? now)
      : now;
  const values = [
    subscription.endpoint,
    p256dh,
    auth,
    userEmail,
    existingCreatedAt,
    now,
  ];

  if (existingRowIndex >= 0) {
    await updateSheetRow({
      spreadsheetId,
      sheetName: SheetNameEnum.PushSubscriptions,
      rowNumber: existingRowIndex + 2,
      values,
    });
    return;
  }

  await appendSheetRow(
    spreadsheetId,
    SheetNameEnum.PushSubscriptions,
    values,
  );
}

export async function readPushSubscriptions(
  spreadsheetId: string,
): Promise<StoredPushSubscription[]> {
  const rows = await readSheetRows(
    spreadsheetId,
    SheetNameEnum.PushSubscriptions,
  );

  return rows.slice(1).flatMap((row) => {
    if (!row[0] || !row[1] || !row[2] || !row[3]) {
      return [];
    }

    return [{
      endpoint: String(row[0]),
      p256dh: String(row[1]),
      auth: String(row[2]),
      userEmail: String(row[3]),
      createdAt: String(row[4] ?? ""),
      updatedAt: String(row[5] ?? ""),
    }];
  });
}

export async function sendChatPushNotifications(params: {
  message: ChatMessage;
  subscriptions: StoredPushSubscription[];
}): Promise<void> {
  const { message, subscriptions } = params;
  const recipientSubscriptions = subscriptions.filter(
    (subscription) =>
      subscription.userEmail.toLowerCase() !==
      message.senderEmail.toLowerCase(),
  );

  if (recipientSubscriptions.length === 0) {
    return;
  }

  const response = await fetch("/api/push", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getGoogleAccessToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      senderEmail: message.senderEmail,
      title: message.senderName,
      body: message.text,
      url: "/chat",
      subscriptions: recipientSubscriptions.map((subscription) => ({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      })),
    }),
  });

  if (!response.ok) {
    throw new Error("Сообщение отправлено, но push-уведомление доставить не удалось.");
  }
}
