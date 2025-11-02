import { z } from "zod";

import type { NotificationsButtonProps } from "./notifications-button";
import type {
  InitialNotificationsData,
  NotificationQueryResult,
} from "./notifications-model.server";
import type { NotificationType } from "./notifications-panel-content";
import { linkNotificationDataSchema } from "./notifications-schemas";

const allNotificationsSchema = z.discriminatedUnion("type", [
  linkNotificationDataSchema,
]);

function parseNotification(
  notification: NotificationQueryResult,
): NotificationType {
  const parsed = allNotificationsSchema.parse(notification.content);
  return {
    isRead: notification.readAt !== null,
    recipientId: notification.recipientId,
    ...parsed,
  };
}

export function mapInitialNotificationsDataToNotificationButtonProps({
  allNotifications,
  lastOpenedAt,
  unreadNotifications,
}: Omit<InitialNotificationsData, "hasMoreAll" | "hasMoreUnread">): {
  notificationButtonProps: NotificationsButtonProps;
} {
  const latestNotificationDate = allNotifications?.[0]?.createdAt;
  const showBadge = Boolean(
    latestNotificationDate &&
      (!lastOpenedAt ||
        new Date(latestNotificationDate) > new Date(lastOpenedAt)),
  );

  return {
    notificationButtonProps: {
      allNotifications: allNotifications.map(parseNotification),
      showBadge,
      unreadNotifications: unreadNotifications.map(parseNotification),
    },
  };
}
