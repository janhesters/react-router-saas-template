import { BellIcon, CheckCheckIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '~/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover';
import { Separator } from '~/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip';

import { NotificationsDot } from './notification-components';
import type { NotificationsPanelContentProps } from './notifications-panel-content';
import { NotificationsPanelContent } from './notifications-panel-content';

export type NotificationsButtonProps = {
  allNotifications: NotificationsPanelContentProps['notifications'];
  hasUnreadNotifications: boolean;
  unreadNotifications: NotificationsPanelContentProps['notifications'];
  onMarkAllAsRead?: () => void;
};

export function NotificationsButton({
  allNotifications,
  hasUnreadNotifications,
  unreadNotifications,
  onMarkAllAsRead,
}: NotificationsButtonProps) {
  const { t } = useTranslation('notifications', {
    keyPrefix: 'notifications-button',
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          aria-label={
            hasUnreadNotifications
              ? t('open-unread-notifications')
              : t('open-notifications')
          }
          className="relative size-8"
          size="icon"
          variant="outline"
        >
          <BellIcon />
          {hasUnreadNotifications && (
            <NotificationsDot
              blinking={true}
              className="absolute -top-0.5 -right-0.5 motion-reduce:-top-1.5 motion-reduce:-right-1.5"
            />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="min-w-svw p-2 sm:w-md sm:min-w-[unset]"
      >
        <div className="flex items-center justify-between">
          <p className="text-base font-semibold">{t('notifications')}</p>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                aria-label={t('mark-all-as-read')}
                onClick={onMarkAllAsRead}
                size="sm"
                variant="ghost"
              >
                <CheckCheckIcon />
              </Button>
            </TooltipTrigger>

            <TooltipContent side="bottom">
              {t('mark-all-as-read')}
            </TooltipContent>
          </Tooltip>
        </div>

        <Tabs defaultValue="unread">
          <TabsList>
            <TabsTrigger value="unread">{t('unread')}</TabsTrigger>
            <TabsTrigger value="all">{t('all')}</TabsTrigger>
          </TabsList>

          <div className="-mx-2">
            <Separator />
          </div>

          <TabsContent value="unread">
            <NotificationsPanelContent notifications={unreadNotifications} />
          </TabsContent>

          <TabsContent value="all">
            <NotificationsPanelContent notifications={allNotifications} />
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
