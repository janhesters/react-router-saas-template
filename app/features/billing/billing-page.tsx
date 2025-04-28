import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { CircleXIcon, Loader2Icon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Form, href, Link } from 'react-router';

import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Separator } from '~/components/ui/separator';

import {
  CANCEL_SUBSCRIPTION_INTENT,
  OPEN_CUSTOMER_PORTAL_INTENT,
} from './billing-constants';
import { BillingModalContent } from './billing-modal-content';
import {
  DescriptionDetail,
  DescriptionList,
  DescriptionListRow,
  DescriptionTerm,
} from './description-list';

export type BillingPageProps = {
  cancelAtPeriodEnd: boolean;
  currentMonthlyRatePerUser: number;
  currentPeriodEnd: Date;
  currentSeats: number;
  currentTierName: string;
  isAddingPaymentInformation?: boolean;
  isCancellingSubscription?: boolean;
  isEnterprisePlan: boolean;
  isManagingPlan?: boolean;
  isOnFreeTrial: boolean;
  isReactivatingSubscription?: boolean;
  isResumingSubscription?: boolean;
  isViewingInvoices?: boolean;
  maxSeats: number;
  organizationSlug: string;
  projectedTotal: number;
  subscriptionStatus: 'active' | 'inactive' | 'paused';
};

export function BillingPage({
  cancelAtPeriodEnd,
  currentMonthlyRatePerUser,
  currentPeriodEnd,
  currentSeats,
  currentTierName,
  isAddingPaymentInformation = false,
  isCancellingSubscription = false,
  isManagingPlan = false,
  isOnFreeTrial,
  isReactivatingSubscription = false,
  isResumingSubscription = false,
  isViewingInvoices = false,
  maxSeats,
  organizationSlug,
  projectedTotal,
  subscriptionStatus,
}: BillingPageProps) {
  const { t, i18n } = useTranslation('billing', { keyPrefix: 'billing-page' });
  const [isPlanManagementModalOpen, setIsPlanManagementModalOpen] =
    useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const formattedDate = useMemo(() => {
    return new Intl.DateTimeFormat(i18n.language || 'en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(currentPeriodEnd));
  }, [currentPeriodEnd, i18n.language]);

  const isSubmitting =
    isAddingPaymentInformation ||
    isCancellingSubscription ||
    isManagingPlan ||
    isReactivatingSubscription ||
    isResumingSubscription ||
    isViewingInvoices;

  return (
    <div className="px-4 py-4 md:py-6 lg:px-6">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="flex flex-col gap-2">
          <h2 className="leading-none font-semibold">{t('page-title')}</h2>

          <p className="text-muted-foreground text-sm">
            {t('page-description')}
          </p>
        </div>

        <Separator />

        {subscriptionStatus === 'inactive' ? (
          <Form className="@container/alert" method="POST" replace>
            <Alert
              className="flex flex-col gap-2 @xl/alert:block"
              variant="destructive"
            >
              <AlertTitle>
                {t('subscription-cancelled-banner.title')}
              </AlertTitle>

              <AlertDescription>
                {t('subscription-cancelled-banner.description')}
              </AlertDescription>

              <Button
                className="shadow-none @xl/alert:absolute @xl/alert:top-1/2 @xl/alert:right-3 @xl/alert:-translate-y-1/2"
                disabled={isSubmitting}
                name="intent"
                size="sm"
                type="submit"
                value={OPEN_CUSTOMER_PORTAL_INTENT}
              >
                {isReactivatingSubscription ? (
                  <>
                    <Loader2Icon className="animate-spin" />
                    {t('opening-customer-portal')}
                  </>
                ) : (
                  t('subscription-cancelled-banner.button')
                )}
              </Button>
            </Alert>
          </Form>
        ) : cancelAtPeriodEnd ? (
          <Form className="@container/alert" method="POST" replace>
            <Alert
              className="flex flex-col gap-2 @xl/alert:block"
              variant="destructive"
            >
              <AlertTitle>{t('cancel-at-period-end-banner.title')}</AlertTitle>

              <AlertDescription>
                {t('cancel-at-period-end-banner.description', {
                  date: formattedDate,
                })}
              </AlertDescription>

              <Button
                className="shadow-none @xl/alert:absolute @xl/alert:top-1/2 @xl/alert:right-3 @xl/alert:-translate-y-1/2"
                disabled={isSubmitting}
                name="intent"
                size="sm"
                type="submit"
                value={OPEN_CUSTOMER_PORTAL_INTENT}
              >
                {isResumingSubscription ? (
                  <>
                    <Loader2Icon className="animate-spin" />
                    {t('opening-customer-portal')}
                  </>
                ) : (
                  t('cancel-at-period-end-banner.button')
                )}
              </Button>
            </Alert>
          </Form>
        ) : (
          isOnFreeTrial && (
            <Form className="@container/alert" method="POST" replace>
              <Alert className="flex flex-col gap-2 @xl/alert:block">
                <AlertTitle>{t('free-trial-banner.title')}</AlertTitle>

                <AlertDescription>
                  {t('free-trial-banner.description', {
                    date: formattedDate,
                  })}
                </AlertDescription>

                <Button
                  className="shadow-none @xl/alert:absolute @xl/alert:top-1/2 @xl/alert:right-3 @xl/alert:-translate-y-1/2"
                  disabled={isSubmitting}
                  name="intent"
                  size="sm"
                  type="submit"
                  value={OPEN_CUSTOMER_PORTAL_INTENT}
                >
                  {isAddingPaymentInformation ? (
                    <>
                      <Loader2Icon className="animate-spin" />
                      {t('opening-customer-portal')}
                    </>
                  ) : (
                    t('free-trial-banner.button')
                  )}
                </Button>
              </Alert>
            </Form>
          )
        )}

        <div>
          <h3 className="text-base font-medium">
            {t('plan-information.heading')}
          </h3>

          <Form method="POST" replace>
            <fieldset className="@container/form" disabled={isSubmitting}>
              <Card className="mt-2 py-4 md:py-3">
                <DescriptionList>
                  {/* Current Plan */}
                  <DescriptionListRow className="flex-col @xl/form:grid @xl/form:grid-cols-[auto_1fr]">
                    <div className="flex items-center justify-between">
                      <DescriptionTerm className="@xl/form:w-36">
                        {t('plan-information.current-plan')}
                      </DescriptionTerm>

                      <Button
                        className="@xl/form:hidden"
                        onClick={() => setIsPlanManagementModalOpen(true)}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        {t('plan-information.manage-plan')}
                      </Button>
                    </div>

                    <div className="@xl/form:flex @xl/form:items-center @xl/form:justify-between">
                      <div className="flex items-center justify-between @xl/form:block">
                        <DescriptionDetail>{currentTierName}</DescriptionDetail>

                        <DescriptionDetail>
                          <Trans
                            components={{
                              1: <span className="text-muted-foreground" />,
                            }}
                            i18nKey="billing:billing-page.plan-information.rate-format"
                            values={{ amount: currentMonthlyRatePerUser }}
                          />
                        </DescriptionDetail>
                      </div>

                      <Button
                        className="hidden @xl/form:block"
                        onClick={() => setIsPlanManagementModalOpen(true)}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        {t('plan-information.manage-plan')}
                      </Button>
                    </div>
                  </DescriptionListRow>

                  <Separator />

                  {/* Users */}
                  <DescriptionListRow className="items-center justify-between @xl/form:h-10">
                    <div className="flex flex-col gap-2 @xl/form:flex-row">
                      <DescriptionTerm className="@xl/form:w-36">
                        {t('plan-information.users')}
                      </DescriptionTerm>

                      <DescriptionDetail>
                        {t('plan-information.users-format', {
                          current: currentSeats,
                          max: maxSeats,
                        })}
                      </DescriptionDetail>
                    </div>

                    <Button asChild variant="outline" size="sm">
                      <Link
                        to={href(
                          '/organizations/:organizationSlug/settings/members',
                          { organizationSlug },
                        )}
                      >
                        {t('plan-information.manage-users')}
                      </Link>
                    </Button>
                  </DescriptionListRow>

                  <Separator />

                  {/* Projected Total */}
                  <DescriptionListRow className="items-center justify-between @xl/form:h-10 @xl/form:justify-start">
                    <DescriptionTerm className="@xl/form:w-36">
                      {t('plan-information.projected-total')}
                    </DescriptionTerm>

                    <DescriptionDetail>
                      {t('plan-information.amount-format', {
                        amount: projectedTotal,
                      })}
                    </DescriptionDetail>
                  </DescriptionListRow>

                  <Separator />

                  {/* Next Billing Date */}
                  <DescriptionListRow className="items-center justify-between @xl/form:h-10">
                    <div className="flex flex-col gap-2 @xl/form:flex-row">
                      <DescriptionTerm className="@xl/form:w-36">
                        {t('plan-information.next-billing-date')}
                      </DescriptionTerm>

                      <DescriptionDetail>{formattedDate}</DescriptionDetail>
                    </div>

                    <Button
                      name="intent"
                      size="sm"
                      type="submit"
                      value={OPEN_CUSTOMER_PORTAL_INTENT}
                      variant="outline"
                    >
                      {t('plan-information.view-invoices')}
                    </Button>
                  </DescriptionListRow>
                </DescriptionList>
              </Card>
            </fieldset>
          </Form>
        </div>

        <Dialog
          open={isPlanManagementModalOpen}
          onOpenChange={setIsPlanManagementModalOpen}
        >
          <DialogContent className="max-h-[calc(100svh-4rem)] overflow-y-auto sm:max-w-[77rem]">
            <DialogHeader>
              <DialogTitle>{t('pricing-modal.title')}</DialogTitle>

              <VisuallyHidden>
                <DialogDescription>
                  {t('pricing-modal.description')}
                </DialogDescription>
              </VisuallyHidden>
            </DialogHeader>

            <BillingModalContent
              canCancelSubscription={true}
              currentTier="high"
              currentTierInterval="annual"
              isSwitchingToHigh={false}
              isSwitchingToLow={false}
              isSwitchingToMid={false}
              lacksPaymentInformation={isOnFreeTrial}
              onCancelSubscriptionClick={() => {
                setIsPlanManagementModalOpen(false);
                setIsCancelModalOpen(true);
              }}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('cancel-subscription-modal.title')}</DialogTitle>

              <DialogDescription>
                {t('cancel-subscription-modal.description')}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <ul className="flex flex-col gap-2">
                {(
                  t('cancel-subscription-modal.features', {
                    returnObjects: true,
                  }) as string[]
                ).map(feature => (
                  <li className="flex items-center gap-2" key={feature}>
                    <CircleXIcon className="text-destructive size-4" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <DialogFooter>
              <Button
                disabled={isSubmitting}
                onClick={() => {
                  setIsCancelModalOpen(false);
                  setIsPlanManagementModalOpen(true);
                }}
                variant="outline"
              >
                {t('cancel-subscription-modal.change-plan')}
              </Button>

              <Form method="POST" replace>
                <Button
                  disabled={isSubmitting}
                  name="intent"
                  value={CANCEL_SUBSCRIPTION_INTENT}
                  variant="destructive"
                  type="submit"
                >
                  {isCancellingSubscription ? (
                    <>
                      <Loader2Icon className="animate-spin" />
                      {t('cancel-subscription-modal.cancelling-subscription')}
                    </>
                  ) : (
                    t('cancel-subscription-modal.confirm')
                  )}
                </Button>
              </Form>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
