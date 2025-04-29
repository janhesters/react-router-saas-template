import { formatDate } from 'date-fns';
import { Loader2Icon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Form, useNavigation } from 'react-router';

import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { cn } from '~/lib/utils';

import { OPEN_CUSTOMER_PORTAL_INTENT } from './billing-constants';

export type BillingSidebarCardProps = {
  className?: string;
  freeTrialIsActive: boolean;
  showButton: boolean;
  trialEndDate: Date;
};

export function BillingSidebarCard({
  freeTrialIsActive,
  showButton,
  trialEndDate,
  ...props
}: BillingSidebarCardProps) {
  const { t } = useTranslation('organizations', {
    keyPrefix: 'layout.app-sidebar.billing-sidebar-card',
  });

  const navigation = useNavigation();
  const isSubmitting =
    navigation.formData?.get('intent') === OPEN_CUSTOMER_PORTAL_INTENT;

  return (
    <Form method="post" replace {...props}>
      <Card
        className={cn(
          'gap-4 py-4 shadow-none',
          'from-primary/5 to-card bg-gradient-to-t',
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
            <Button
              className="w-full shadow-none"
              disabled={isSubmitting}
              name="intent"
              variant="outline"
              size="sm"
              type="submit"
              value={OPEN_CUSTOMER_PORTAL_INTENT}
            >
              {isSubmitting ? (
                <>
                  <Loader2Icon className="animate-spin" />
                  {t('loading')}
                </>
              ) : freeTrialIsActive ? (
                t('active-trial.button')
              ) : (
                t('trial-ended.button')
              )}
            </Button>
          </CardContent>
        )}
      </Card>
    </Form>
  );
}
