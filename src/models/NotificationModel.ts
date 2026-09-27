export type NotificationType =
  | "ORDER_STATUS"
  | "PROMOTION"
  | "SUPPORT"
  | "SYSTEM";

export interface UserNotification {
  id: string;
  type: NotificationType;
  title: string;
  content: string;
  referenceId?: string;
  targetUrl?: string;
  isRead: boolean;
  createdAt: string;
}
