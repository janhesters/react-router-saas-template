import { IconDotsVertical } from "@tabler/icons-react";
import type { ComponentProps } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useFetcher } from "react-router";

import { MARK_ONE_NOTIFICATION_AS_READ_INTENT } from "./notification-constants";
import type { LinkNotificationData } from "./notifications-schemas";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import type { NotificationRecipient } from "~/generated/browser";
import { cn } from "~/lib/utils";
import { toFormData } from "~/utils/to-form-data";

/**
 * Base notification stuff
 */

type NotificationsDotProps = ComponentProps<"div"> & {
  blinking: boolean;
};

export function NotificationsDot({
  blinking,
  className,
  ...props
}: NotificationsDotProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full text-primary",
        // Position + styling depending on blinking.
        !blinking && "bg-primary/10 p-1",
        // Only apply these reduced-motion tweaks when blinking is enabled.
        blinking && "motion-reduce:bg-primary/10 motion-reduce:p-1",
        className,
      )}
      {...props}
    >
      {blinking && (
        <span
          className={cn(
            "absolute size-2 animate-ping rounded-full bg-primary opacity-75",
            "motion-reduce:animate-none",
          )}
        />
      )}
      <div className="size-2 rounded-full bg-current" />
    </div>
  );
}

type NotificationMenuProps = {
  recipientId: NotificationRecipient["id"];
};

export function NotificationMenu({ recipientId }: NotificationMenuProps) {
  const { t } = useTranslation("notifications", {
    keyPrefix: "notificationMenu",
  });
  const [isOpen, setIsOpen] = useState(false);
  const notificationMenuFetcher = useFetcher();

  return (
    <DropdownMenu onOpenChange={setIsOpen} open={isOpen}>
      <DropdownMenuTrigger
        onClick={(event) => {
          event.stopPropagation();
          event.preventDefault();
        }}
        render={
          <Button
            aria-label={t("triggerButton")}
            className={cn(
              "opacity-0 hover:bg-transparent focus:opacity-100 group-hover:opacity-100 group-focus:opacity-100 dark:hover:bg-transparent",
              isOpen && "opacity-100",
            )}
            size="icon"
            variant="outline"
          />
        }
      >
        <IconDotsVertical className="size-4" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="center" side="left">
        <DropdownMenuItem
          onClick={(event) => {
            event.stopPropagation();
            void notificationMenuFetcher.submit(
              toFormData({
                intent: MARK_ONE_NOTIFICATION_AS_READ_INTENT,
                recipientId,
              }),
              { method: "post" },
            );
          }}
        >
          {t("markAsRead")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type BaseNotificationProps = {
  recipientId: NotificationRecipient["id"];
  isRead: boolean;
};

/**
 * Link notification
 */

export type LinkNotificationProps = BaseNotificationProps &
  LinkNotificationData;

export function LinkNotification({
  href,
  isRead,
  recipientId,
  text,
}: LinkNotificationProps) {
  return (
    <Button
      className="group wrap-break-word h-auto w-full justify-between whitespace-normal py-2 text-muted-foreground"
      render={<Link to={href} />}
      size="sm"
      variant="ghost"
    >
      {text}

      {isRead ? (
        <div className="flex h-9 min-w-15">
          {/* Fake offset to prevent layout shift when the notification is read */}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <NotificationMenu recipientId={recipientId} />
          <NotificationsDot blinking={false} />
        </div>
      )}
    </Button>
  );
}
