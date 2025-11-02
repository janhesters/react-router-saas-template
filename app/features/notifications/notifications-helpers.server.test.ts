import { describe, expect, test } from "vitest";

import { LINK_NOTIFICATION_TYPE } from "./notification-constants";
import { createPopulatedNotificationQueryResult } from "./notifications-factories.server";
import { mapInitialNotificationsDataToNotificationButtonProps } from "./notifications-helpers.server";
import type { NotificationQueryResult } from "./notifications-model.server";
import type { LinkNotificationData } from "./notifications-schemas";

function sortByCreatedAt(
  notifications: NotificationQueryResult[],
): NotificationQueryResult[] {
  return notifications.toSorted(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
}

describe("mapInitialNotificationsDataToNotificationButtonProps()", () => {
  test("given: no notifications and no panel data, should: return empty notifications and no badge", () => {
    const initialData = {
      allNotifications: [],
      lastOpenedAt: null,
      unreadNotifications: [],
    };

    const actual =
      mapInitialNotificationsDataToNotificationButtonProps(initialData);
    const expected = {
      notificationButtonProps: {
        allNotifications: [],
        showBadge: false,
        unreadNotifications: [],
      },
    };

    expect(actual).toEqual(expected);
  });

  test("given: notifications exist and panel was opened after latest notification, should: return notifications with no badge", () => {
    // Fixed notification content for stable assertions
    const content1: LinkNotificationData = {
      href: "/first",
      text: "First",
      type: LINK_NOTIFICATION_TYPE,
    };
    const content2: LinkNotificationData = {
      href: "/second",
      text: "Second",
      type: LINK_NOTIFICATION_TYPE,
    };

    // Two notifications, one newer than the other
    const n1 = createPopulatedNotificationQueryResult({
      content: content1,
      createdAt: new Date("2025-04-20T10:00:00Z"),
      notificationId: "n1",
      readAt: null,
      recipientId: "r1",
    });
    const n2 = createPopulatedNotificationQueryResult({
      content: content2,
      createdAt: new Date("2025-04-19T10:00:00Z"),
      notificationId: "n2",
      readAt: null,
      recipientId: "r2",
    });
    const allNotifications = sortByCreatedAt([n1, n2]);

    const initialData = {
      allNotifications,
      lastOpenedAt: new Date("2025-04-21T00:00:00Z"), // after the latest notification
      unreadNotifications: allNotifications,
    };

    const actual =
      mapInitialNotificationsDataToNotificationButtonProps(initialData);
    const expected = {
      notificationButtonProps: {
        allNotifications: [
          { isRead: false, recipientId: "r1", ...content1 },
          { isRead: false, recipientId: "r2", ...content2 },
        ],
        showBadge: false,
        unreadNotifications: [
          { isRead: false, recipientId: "r1", ...content1 },
          { isRead: false, recipientId: "r2", ...content2 },
        ],
      },
    };

    expect(actual).toEqual(expected);
  });

  test("given: notifications exist and panel was opened before latest notification, should: return notifications with badge", () => {
    // Fixed notification content for stable assertions
    const content1: LinkNotificationData = {
      href: "/first",
      text: "First",
      type: LINK_NOTIFICATION_TYPE,
    };
    const content2: LinkNotificationData = {
      href: "/second",
      text: "Second",
      type: LINK_NOTIFICATION_TYPE,
    };

    // Two notifications, one newer than the other
    const n1 = createPopulatedNotificationQueryResult({
      content: content1,
      createdAt: new Date("2025-04-20T10:00:00Z"),
      notificationId: "n1",
      readAt: null,
      recipientId: "r1",
    });
    const n2 = createPopulatedNotificationQueryResult({
      content: content2,
      createdAt: new Date("2025-04-19T10:00:00Z"),
      notificationId: "n2",
      readAt: null,
      recipientId: "r2",
    });
    const allNotifications = sortByCreatedAt([n1, n2]);

    const initialData = {
      allNotifications,
      lastOpenedAt: new Date("2025-04-18T00:00:00Z"), // before the latest notification
      unreadNotifications: allNotifications,
    };

    const actual =
      mapInitialNotificationsDataToNotificationButtonProps(initialData);
    const expected = {
      notificationButtonProps: {
        allNotifications: [
          { isRead: false, recipientId: "r1", ...content1 },
          { isRead: false, recipientId: "r2", ...content2 },
        ],
        showBadge: true,
        unreadNotifications: [
          { isRead: false, recipientId: "r1", ...content1 },
          { isRead: false, recipientId: "r2", ...content2 },
        ],
      },
    };

    expect(actual).toEqual(expected);
  });

  test("given: notifications with one read and one unread, should: map isRead flags correctly", () => {
    const content1: LinkNotificationData = {
      href: "/read",
      text: "Read",
      type: LINK_NOTIFICATION_TYPE,
    };
    const content2: LinkNotificationData = {
      href: "/unread",
      text: "Unread",
      type: LINK_NOTIFICATION_TYPE,
    };

    const n1 = createPopulatedNotificationQueryResult({
      content: content1,
      createdAt: new Date("2025-04-20T10:00:00Z"),
      notificationId: "n1",
      readAt: new Date("2025-04-20T12:00:00Z"),
      recipientId: "r1",
    });
    const n2 = createPopulatedNotificationQueryResult({
      content: content2,
      createdAt: new Date("2025-04-19T10:00:00Z"),
      notificationId: "n2",
      readAt: null,
      recipientId: "r2",
    });
    const allNotifications = sortByCreatedAt([n1, n2]);

    const initialData = {
      allNotifications,
      lastOpenedAt: null,
      unreadNotifications: [n2],
    };

    const actual =
      mapInitialNotificationsDataToNotificationButtonProps(initialData);
    const expected = {
      notificationButtonProps: {
        allNotifications: [
          { isRead: true, recipientId: "r1", ...content1 },
          { isRead: false, recipientId: "r2", ...content2 },
        ],
        showBadge: true,
        unreadNotifications: [
          { isRead: false, recipientId: "r2", ...content2 },
        ],
      },
    };

    expect(actual).toEqual(expected);
  });

  test("given: panel was opened at exactly the same time as latest notification, should: return notifications with no badge", () => {
    const content = {
      href: "/exact",
      text: "Exact",
      type: LINK_NOTIFICATION_TYPE,
    };

    const createdAt = new Date("2025-04-20T10:00:00Z");

    const n = createPopulatedNotificationQueryResult({
      content,
      createdAt,
      notificationId: "n1",
      readAt: null,
      recipientId: "r1",
    });

    const initialData = {
      allNotifications: [n],
      lastOpenedAt: createdAt,
      unreadNotifications: [n],
    };

    const actual =
      mapInitialNotificationsDataToNotificationButtonProps(initialData);

    const expected = {
      notificationButtonProps: {
        allNotifications: [{ isRead: false, recipientId: "r1", ...content }],
        showBadge: false,
        unreadNotifications: [{ isRead: false, recipientId: "r1", ...content }],
      },
    };

    expect(actual).toEqual(expected);
  });

  test("given: no unread notifications but a newer notification exists, should: return notifications with badge", () => {
    const content = {
      href: "/read",
      text: "Read but new",
      type: LINK_NOTIFICATION_TYPE,
    };

    const createdAt = new Date("2025-04-20T10:00:00Z");

    const n = createPopulatedNotificationQueryResult({
      content,
      createdAt,
      notificationId: "n1",
      readAt: new Date("2025-04-20T11:00:00Z"),
      recipientId: "r1",
    });

    const initialData = {
      allNotifications: [n],
      lastOpenedAt: new Date("2025-04-19T10:00:00Z"),
      unreadNotifications: [],
    };

    const actual =
      mapInitialNotificationsDataToNotificationButtonProps(initialData);

    const expected = {
      notificationButtonProps: {
        allNotifications: [{ isRead: true, recipientId: "r1", ...content }],
        showBadge: true,
        unreadNotifications: [],
      },
    };

    expect(actual).toEqual(expected);
  });

  test("given: future dated notification, should: return notifications with badge", () => {
    const content = {
      href: "/future",
      text: "Future",
      type: LINK_NOTIFICATION_TYPE,
    };

    const futureDate = new Date("3025-01-01T00:00:00Z");

    const n = createPopulatedNotificationQueryResult({
      content,
      createdAt: futureDate,
      notificationId: "n1",
      readAt: null,
      recipientId: "r1",
    });

    const initialData = {
      allNotifications: [n],
      lastOpenedAt: new Date("2025-04-27T00:00:00Z"),
      unreadNotifications: [n],
    };

    const actual =
      mapInitialNotificationsDataToNotificationButtonProps(initialData);

    const expected = {
      notificationButtonProps: {
        allNotifications: [{ isRead: false, recipientId: "r1", ...content }],
        showBadge: true,
        unreadNotifications: [{ isRead: false, recipientId: "r1", ...content }],
      },
    };

    expect(actual).toEqual(expected);
  });

  test("given: no notifications but lastOpenedAt exists, should: return empty notifications with no badge", () => {
    const initialData = {
      allNotifications: [],
      lastOpenedAt: new Date("2025-04-27T00:00:00Z"),
      unreadNotifications: [],
    };

    const actual =
      mapInitialNotificationsDataToNotificationButtonProps(initialData);

    const expected = {
      notificationButtonProps: {
        allNotifications: [],
        showBadge: false,
        unreadNotifications: [],
      },
    };

    expect(actual).toEqual(expected);
  });

  test("given: lastOpenedAt is null and notifications exist, should: return notifications with badge", () => {
    const content = {
      href: "/new",
      text: "New notification",
      type: LINK_NOTIFICATION_TYPE,
    };

    const createdAt = new Date("2025-04-20T10:00:00Z");

    const n = createPopulatedNotificationQueryResult({
      content,
      createdAt,
      notificationId: "n1",
      readAt: null,
      recipientId: "r1",
    });

    const initialData = {
      allNotifications: [n],
      lastOpenedAt: null,
      unreadNotifications: [n],
    };

    const actual =
      mapInitialNotificationsDataToNotificationButtonProps(initialData);

    const expected = {
      notificationButtonProps: {
        allNotifications: [{ isRead: false, recipientId: "r1", ...content }],
        showBadge: true,
        unreadNotifications: [{ isRead: false, recipientId: "r1", ...content }],
      },
    };

    expect(actual).toEqual(expected);
  });
});
