import type { Notification } from '@prisma/client';
import { MoreVerticalIcon } from 'lucide-react';
import type { ComponentProps, MouseEventHandler } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { cn } from '~/lib/utils';

import type { LinkNotificationData } from './notifications-schemas';

/**
 * Base notification stuff
 */

type NotificationsDotProps = ComponentProps<'div'> & {
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
        'text-primary flex items-center justify-center rounded-full',
        // Position + styling depending on blinking.
        !blinking && 'bg-primary/10 p-1',
        // Only apply these reduced-motion tweaks when blinking is enabled.
        blinking && 'motion-reduce:bg-primary/10 motion-reduce:p-1',
        className,
      )}
      {...props}
    >
      {blinking && (
        <span
          className={cn(
            'bg-primary absolute size-2 animate-ping rounded-full opacity-75',
            'motion-reduce:animate-none',
          )}
        />
      )}
      <div className="size-2 rounded-full bg-current" />
    </div>
  );
}

type NotificationMenuProps = {
  onMarkAsRead: MouseEventHandler<HTMLDivElement>;
};

export function NotificationMenu({ onMarkAsRead }: NotificationMenuProps) {
  const { t } = useTranslation('notifications', {
    keyPrefix: 'notification-menu',
  });
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={t('trigger-button')}
          className={cn(
            'opacity-0 group-hover:opacity-100 group-focus:opacity-100 hover:bg-transparent focus:opacity-100 dark:hover:bg-transparent',
            isOpen && 'opacity-100',
          )}
          size="icon"
          variant="ghost"
        >
          <MoreVerticalIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="center" side="left">
        <DropdownMenuItem onClick={onMarkAsRead}>
          {t('mark-as-read')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type BaseNotificationProps = {
  id: Notification['id'];
  isRead: boolean;
} & NotificationMenuProps;

/**
 * Link notification
 */

export type LinkNotificationProps = BaseNotificationProps &
  LinkNotificationData;

export function LinkNotification({
  text,
  href,
  isRead,
  onMarkAsRead,
}: LinkNotificationProps) {
  return (
    <Button
      asChild
      className="text-muted-foreground group h-auto w-full justify-between py-2 break-words whitespace-normal"
      size="sm"
      variant="ghost"
    >
      <Link to={href}>
        {text}

        {isRead ? (
          <div className="flex min-w-15" />
        ) : (
          <div className="flex items-center gap-2">
            <NotificationMenu onMarkAsRead={onMarkAsRead} />
            <NotificationsDot blinking={false} />
          </div>
        )}
      </Link>
    </Button>
  );
}
