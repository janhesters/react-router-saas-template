import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { formatDate } from 'date-fns';
import { useTranslation } from 'react-i18next';

import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog';
import { cn } from '~/lib/utils';

import { CreateSubscriptionModalContent } from './create-subscription-modal-content';

export type BillingSidebarCardProps = {
  className?: string;
  freeTrialIsActive: boolean;
  showButton: boolean;
  trialEndDate: Date;
};

export function BillingSidebarCard({
  className,
  freeTrialIsActive,
  showButton,
  trialEndDate,
}: BillingSidebarCardProps) {
  const { t } = useTranslation('organizations', {
    keyPrefix: 'layout.app-sidebar.billing-sidebar-card',
  });

  return (
    <Dialog>
      <Card
        className={cn(
          'gap-4 py-4 shadow-none',
          'from-primary/5 to-card bg-gradient-to-t',
          className,
        )}
      >
        <CardHeader className="px-4">
          <CardTitle className="text-sm">
            {freeTrialIsActive
              ? t('active-trial.title')
              : t('trial-ended.title')}
          </CardTitle>

          <CardDescription>
            {freeTrialIsActive
              ? t('active-trial.description', {
                  date: formatDate(trialEndDate, 'MMMM dd, yyyy'),
                })
              : t('trial-ended.description', {
                  date: formatDate(trialEndDate, 'MMMM dd, yyyy'),
                })}
          </CardDescription>
        </CardHeader>

        {showButton && (
          <CardContent className="px-4">
            <DialogTrigger asChild>
              <Button
                className="w-full shadow-none"
                variant="outline"
                size="sm"
                type="button"
              >
                {freeTrialIsActive
                  ? t('active-trial.button')
                  : t('trial-ended.button')}
              </Button>
            </DialogTrigger>
          </CardContent>
        )}
      </Card>

      <DialogContent className="max-h-[calc(100svh-4rem)] overflow-y-auto sm:max-w-[77rem]">
        <DialogHeader>
          <DialogTitle>{t('billing-modal.title')}</DialogTitle>

          <VisuallyHidden>
            <DialogDescription>
              {t('billing-modal.description')}
            </DialogDescription>
          </VisuallyHidden>
        </DialogHeader>

        <CreateSubscriptionModalContent />
      </DialogContent>
    </Dialog>
  );
}
