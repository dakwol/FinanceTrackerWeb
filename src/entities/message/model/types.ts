export interface ChatMessage {
  id: string;
  senderEmail: string;
  senderName: string;
  text: string;
  createdAt: string;
}

export interface StoredPushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
  userEmail: string;
  createdAt: string;
  updatedAt: string;
}
