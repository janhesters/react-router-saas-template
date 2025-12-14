import type { SubmissionResult } from "@conform-to/react/future";
import * as VisuallyHiddenPrimitive from "@radix-ui/react-visually-hidden";
import { IconCircleX } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Form, href, Link, useNavigation } from "react-router";
import { useHydrated } from "remix-utils/use-hydrated";

import type { Interval, Tier } from "./billing-constants";
import {
  CANCEL_SUBSCRIPTION_INTENT,
  KEEP_CURRENT_SUBSCRIPTION_INTENT,
  priceLookupKeysByTierAndInterval,
  RESUME_SUBSCRIPTION_INTENT,
  SWITCH_SUBSCRIPTION_INTENT,
  UPDATE_BILLING_EMAIL_INTENT,
  VIEW_INVOICES_INTENT,
} from "./billing-constants";
import type { CancelOrModifySubscriptionModalContentProps } from "./cancel-or-modify-subscription-modal-content";
import { CancelOrModifySubscriptionModalContent } from "./cancel-or-modify-subscription-modal-content";
import type { CreateSubscriptionModalContentProps } from "./create-subscription-modal-content";
import { CreateSubscriptionModalContent } from "./create-subscription-modal-content";
import {
  DescriptionDetail,
  DescriptionList,
  DescriptionListRow,
  DescriptionTerm,
} from "./description-list";
import { EditBillingEmailModalContent } from "./edit-billing-email-modal-content";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Separator } from "~/components/ui/separator";
import { Spinner } from "~/components/ui/spinner";
import type { Organization } from "~/generated/browser";
import { cn } from "~/lib/utils";

type PendingDowngradeBannerProps = {
  pendingTier: Tier;
  pendingInterval: Interval;
  pendingChangeDate: Date;
  isKeepingCurrentSubscription?: boolean;
  isSubmitting?: boolean;
};

function PendingDowngradeBanner({
  pendingChangeDate,
  pendingInterval,
  pendingTier,
  isKeepingCurrentSubscription,
  isSubmitting,
}: PendingDowngradeBannerProps) {
  const { t, i18n } = useTranslation("billing", {
    keyPrefix: "billingPage.pendingDowngradeBanner",
  });
  const { t: tTier } = useTranslation("billing", {
    keyPrefix: "pricing.plans",
  });

  const formattedDate = useMemo(() => {
    return new Intl.DateTimeFormat(i18n.language || "en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(pendingChangeDate));
  }, [pendingChangeDate, i18n.language]);

  return (
    <Form className="@container/alert" method="POST" replace>
      <Alert className="@4xl/alert:block flex flex-col gap-2">
        <AlertTitle>{t("title")}</AlertTitle>

        <AlertDescription>
          {t("description", {
            billingInterval: t(`intervals.${pendingInterval}`),
            date: formattedDate,
            planName: tTier(`${pendingTier}.title`),
          })}
        </AlertDescription>

        <Button
          className="@4xl/alert:-translate-y-1/2 @4xl/alert:absolute @4xl/alert:top-1/2 @4xl/alert:right-3 shadow-none"
          disabled={isSubmitting}
          name="intent"
          size="sm"
          type="submit"
          value={KEEP_CURRENT_SUBSCRIPTION_INTENT}
        >
          {isKeepingCurrentSubscription ? (
            <>
              <Spinner />
              {t("loadingButton")}
            </>
          ) : (
            t("button")
          )}
        </Button>
      </Alert>
    </Form>
  );
}

export type BillingPageProps = {
  billingEmail: Organization["billingEmail"];
  cancelAtPeriodEnd: boolean;
  cancelOrModifySubscriptionModalProps: CancelOrModifySubscriptionModalContentProps;
  createSubscriptionModalProps: CreateSubscriptionModalContentProps;
  currentMonthlyRatePerUser: number;
  /**
   * During trial, this is the trial end date.
   * Otherwise, this is the end of the current period.
   */
  currentPeriodEnd: Date;
  currentSeats: number;
  currentTier: Tier;
  currentInterval: Interval;
  isCancellingSubscription?: boolean;
  isEnterprisePlan: boolean;
  isKeepingCurrentSubscription?: boolean;
  isOnFreeTrial: boolean;
  isResumingSubscription?: boolean;
  isViewingInvoices?: boolean;
  lastResult?: SubmissionResult;
  maxSeats: number;
  organizationSlug: string;
  pendingChange?: PendingDowngradeBannerProps;
  projectedTotal: number;
  subscriptionStatus: "active" | "inactive" | "paused";
};

export function BillingPage({
  billingEmail,
  cancelAtPeriodEnd,
  cancelOrModifySubscriptionModalProps,
  createSubscriptionModalProps,
  currentMonthlyRatePerUser,
  currentPeriodEnd,
  currentSeats,
  currentTier,
  currentInterval,
  isCancellingSubscription = false,
  isKeepingCurrentSubscription = false,
  isOnFreeTrial,
  isResumingSubscription = false,
  isViewingInvoices = false,
  lastResult,
  maxSeats,
  organizationSlug,
  pendingChange,
  projectedTotal,
  subscriptionStatus,
}: BillingPageProps) {
  const { t, i18n } = useTranslation("billing", { keyPrefix: "billingPage" });
  const { t: tTier } = useTranslation("billing", {
    keyPrefix: "pricing.plans",
  });
  const [isPlanManagementModalOpen, setIsPlanManagementModalOpen] =
    useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const hydrated = useHydrated();

  const formattedDate = useMemo(() => {
    return new Intl.DateTimeFormat(i18n.language || "en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(currentPeriodEnd));
  }, [currentPeriodEnd, i18n.language]);

  const isSubmitting =
    isCancellingSubscription ||
    isKeepingCurrentSubscription ||
    isResumingSubscription ||
    isViewingInvoices;

  /* Switch subscription */
  const navigation = useNavigation();
  const isSwitchingToHigh =
    navigation.formData?.get("intent") === SWITCH_SUBSCRIPTION_INTENT &&
    (
      [
        priceLookupKeysByTierAndInterval.high.annual,
        priceLookupKeysByTierAndInterval.high.monthly,
      ] as string[]
    ).includes(navigation.formData?.get("lookupKey") as string);
  const isSwitchingToLow =
    navigation.formData?.get("intent") === SWITCH_SUBSCRIPTION_INTENT &&
    (
      [
        priceLookupKeysByTierAndInterval.low.annual,
        priceLookupKeysByTierAndInterval.low.monthly,
      ] as string[]
    ).includes(navigation.formData?.get("lookupKey") as string);
  const isSwitchingToMid =
    navigation.formData?.get("intent") === SWITCH_SUBSCRIPTION_INTENT &&
    (
      [
        priceLookupKeysByTierAndInterval.mid.annual,
        priceLookupKeysByTierAndInterval.mid.monthly,
      ] as string[]
    ).includes(navigation.formData?.get("lookupKey") as string);

  /* Update billing email */
  const isUpdatingBillingEmail =
    navigation.formData?.get("intent") === UPDATE_BILLING_EMAIL_INTENT;

  return (
    <div className="px-4 py-4 md:py-6 lg:px-6">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="flex flex-col gap-2">
          <h2 className="font-semibold leading-none">{t("pageTitle")}</h2>

          <p className="text-muted-foreground text-sm">
            {t("pageDescription")}
          </p>
        </div>

        <Separator />

        {subscriptionStatus === "inactive" ? (
          <Dialog>
            <div className="@container/alert">
              <Alert
                className="@xl/alert:block flex flex-col gap-2"
                variant="destructive"
              >
                <AlertTitle>
                  {t("subscriptionCancelledBanner.title")}
                </AlertTitle>

                <AlertDescription>
                  {t("subscriptionCancelledBanner.description")}
                </AlertDescription>

                <DialogTrigger
                  render={
                    <Button
                      className="@xl/alert:-translate-y-1/2 @xl/alert:absolute @xl/alert:top-1/2 @xl/alert:right-3 shadow-none"
                      // Playwright shouldn't try to click the button before it's hydrated
                      disabled={!hydrated}
                      size="sm"
                    />
                  }
                >
                  {t("subscriptionCancelledBanner.button")}
                </DialogTrigger>
              </Alert>
            </div>

            <DialogContent className="max-h-[calc(100svh-4rem)] overflow-y-auto sm:max-w-308">
              <DialogHeader>
                <DialogTitle>
                  {t("subscriptionCancelledBanner.modal.title")}
                </DialogTitle>

                <VisuallyHiddenPrimitive.Root>
                  <DialogDescription>
                    {t("subscriptionCancelledBanner.modal.description")}
                  </DialogDescription>
                </VisuallyHiddenPrimitive.Root>
              </DialogHeader>

              <CreateSubscriptionModalContent
                {...createSubscriptionModalProps}
              />
            </DialogContent>
          </Dialog>
        ) : cancelAtPeriodEnd ? (
          <Form className="@container/alert" method="POST" replace>
            <Alert
              className="@xl/alert:block flex flex-col gap-2"
              variant="destructive"
            >
              <AlertTitle>{t("cancelAtPeriodEndBanner.title")}</AlertTitle>

              <AlertDescription>
                {t("cancelAtPeriodEndBanner.description", {
                  date: formattedDate,
                })}
              </AlertDescription>

              <Button
                className="@xl/alert:-translate-y-1/2 @xl/alert:absolute @xl/alert:top-1/2 @xl/alert:right-3 shadow-none"
                disabled={isSubmitting}
                name="intent"
                size="sm"
                type="submit"
                value={RESUME_SUBSCRIPTION_INTENT}
              >
                {isResumingSubscription ? (
                  <>
                    <Spinner />
                    {t("cancelAtPeriodEndBanner.resumingSubscription")}
                  </>
                ) : (
                  t("cancelAtPeriodEndBanner.button")
                )}
              </Button>
            </Alert>
          </Form>
        ) : pendingChange ? (
          <PendingDowngradeBanner
            {...pendingChange}
            isKeepingCurrentSubscription={isKeepingCurrentSubscription}
            isSubmitting={isSubmitting}
          />
        ) : (
          isOnFreeTrial && (
            <Dialog>
              <div className="@container/alert">
                <Alert className="@xl/alert:block flex flex-col gap-2">
                  <AlertTitle>{t("freeTrialBanner.title")}</AlertTitle>

                  <AlertDescription>
                    {t("freeTrialBanner.description", {
                      date: formattedDate,
                    })}
                  </AlertDescription>

                  <DialogTrigger
                    render={
                      <Button
                        className="@xl/alert:-translate-y-1/2 @xl/alert:absolute @xl/alert:top-1/2 @xl/alert:right-3 shadow-none"
                        // Playwright shouldn't try to click the button before it's hydrated
                        disabled={!hydrated}
                        size="sm"
                      />
                    }
                  >
                    {t("freeTrialBanner.button")}
                  </DialogTrigger>
                </Alert>
              </div>

              <DialogContent className="max-h-[calc(100svh-4rem)] overflow-y-auto sm:max-w-308">
                <DialogHeader>
                  <DialogTitle>{t("freeTrialBanner.modal.title")}</DialogTitle>

                  <VisuallyHiddenPrimitive.Root>
                    <DialogDescription>
                      {t("freeTrialBanner.modal.description")}
                    </DialogDescription>
                  </VisuallyHiddenPrimitive.Root>
                </DialogHeader>

                <CreateSubscriptionModalContent
                  {...createSubscriptionModalProps}
                />
              </DialogContent>
            </Dialog>
          )
        )}

        <div>
          <h3 className="font-medium text-base">
            {t("planInformation.heading")}
          </h3>

          <Form method="POST" replace>
            <fieldset className="@container/form" disabled={isSubmitting}>
              <Card className="mt-2 py-4 shadow-xs md:py-3">
                <DescriptionList>
                  {/* Current Plan */}
                  <DescriptionListRow className="@xl/form:grid @xl/form:grid-cols-[auto_1fr] flex-col">
                    <div className="flex items-center justify-between">
                      <DescriptionTerm className="@xl/form:w-36">
                        {t("planInformation.currentPlan")}
                      </DescriptionTerm>

                      <Button
                        className="@xl/form:hidden"
                        onClick={() => setIsPlanManagementModalOpen(true)}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        {t("planInformation.managePlan")}
                      </Button>
                    </div>

                    <div className="@xl/form:flex @xl/form:items-center @xl/form:justify-between">
                      <div className="@xl/form:block flex items-center justify-between">
                        <DescriptionDetail>
                          {tTier(`${currentTier}.title`)}
                        </DescriptionDetail>

                        <DescriptionDetail>
                          <Trans
                            components={{
                              1: <span className="text-muted-foreground" />,
                            }}
                            i18nKey={
                              currentInterval === "monthly"
                                ? "billingPage.planInformation.rateFormatMonthly"
                                : "billingPage.planInformation.rateFormatAnnual"
                            }
                            ns="billing"
                            values={{ amount: currentMonthlyRatePerUser }}
                          />
                        </DescriptionDetail>
                      </div>

                      <Button
                        className="@xl/form:block hidden"
                        onClick={() => setIsPlanManagementModalOpen(true)}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        {t("planInformation.managePlan")}
                      </Button>
                    </div>
                  </DescriptionListRow>

                  <Separator />

                  {/* Users */}
                  <DescriptionListRow className="@xl/form:h-10 items-center justify-between">
                    <div className="flex @xl/form:flex-row flex-col gap-2">
                      <DescriptionTerm className="@xl/form:w-36">
                        {t("planInformation.users")}
                      </DescriptionTerm>

                      <DescriptionDetail
                        className={cn(
                          currentSeats > maxSeats && "text-destructive",
                        )}
                      >
                        {t("planInformation.usersFormat", {
                          current: currentSeats,
                          max: maxSeats,
                        })}
                      </DescriptionDetail>
                    </div>

                    <Button
                      render={
                        <Link
                          to={href(
                            "/organizations/:organizationSlug/settings/members",
                            { organizationSlug },
                          )}
                        />
                      }
                      size="sm"
                      variant="outline"
                    >
                      {t("planInformation.manageUsers")}
                    </Button>
                  </DescriptionListRow>

                  <Separator />

                  {/* Projected Total */}
                  <DescriptionListRow className="@xl/form:h-10 items-center @xl/form:justify-start justify-between">
                    <DescriptionTerm className="@xl/form:w-36">
                      {t("planInformation.projectedTotal")}
                    </DescriptionTerm>

                    <DescriptionDetail>
                      {t("planInformation.amountFormat", {
                        amount: projectedTotal,
                      })}
                    </DescriptionDetail>
                  </DescriptionListRow>

                  <Separator />

                  {/* Next Billing Date */}
                  <DescriptionListRow className="@xl/form:h-10 items-center justify-between">
                    <div className="flex @xl/form:flex-row flex-col gap-2">
                      <DescriptionTerm className="@xl/form:w-36">
                        {t("planInformation.nextBillingDate")}
                      </DescriptionTerm>

                      <DescriptionDetail>{formattedDate}</DescriptionDetail>
                    </div>

                    <Button
                      disabled={isOnFreeTrial}
                      name="intent"
                      size="sm"
                      type="submit"
                      value={VIEW_INVOICES_INTENT}
                      variant="outline"
                    >
                      {isViewingInvoices ? (
                        <>
                          <Spinner />
                          {t("openingCustomerPortal")}
                        </>
                      ) : (
                        t("planInformation.viewInvoices")
                      )}
                    </Button>
                  </DescriptionListRow>
                </DescriptionList>
              </Card>
            </fieldset>
          </Form>
        </div>

        {billingEmail && (
          <div>
            <h3 className="font-medium text-base">
              {t("paymentInformation.heading")}
            </h3>

            <div className="@container/form">
              <Card className="mt-2 py-4 shadow-xs md:py-3">
                <DescriptionList>
                  {/* Billing Email */}
                  <DescriptionListRow className="@xl/form:h-10 items-center justify-between">
                    <div className="flex @xl/form:flex-row flex-col gap-2">
                      <DescriptionTerm className="@xl/form:w-36">
                        {t("paymentInformation.billingEmail")}
                      </DescriptionTerm>

                      <DescriptionDetail>{billingEmail}</DescriptionDetail>
                    </div>

                    <Dialog>
                      <DialogTrigger
                        render={
                          <Button
                            // Playwright shouldn't try to click the button before it's hydrated
                            disabled={!hydrated}
                            size="sm"
                            variant="outline"
                          />
                        }
                      >
                        {t("paymentInformation.editButton")}
                      </DialogTrigger>

                      <EditBillingEmailModalContent
                        billingEmail={billingEmail}
                        isUpdatingBillingEmail={isUpdatingBillingEmail}
                        lastResult={lastResult}
                      />
                    </Dialog>
                  </DescriptionListRow>
                </DescriptionList>
              </Card>
            </div>
          </div>
        )}

        <Dialog
          onOpenChange={setIsPlanManagementModalOpen}
          open={isPlanManagementModalOpen}
        >
          <DialogContent className="max-h-[calc(100svh-4rem)] overflow-y-auto sm:max-w-308">
            <DialogHeader>
              <DialogTitle>{t("pricingModal.title")}</DialogTitle>

              <VisuallyHiddenPrimitive.Root>
                <DialogDescription>
                  {t("pricingModal.description")}
                </DialogDescription>
              </VisuallyHiddenPrimitive.Root>
            </DialogHeader>

            {subscriptionStatus === "active" && !isOnFreeTrial ? (
              <CancelOrModifySubscriptionModalContent
                {...cancelOrModifySubscriptionModalProps}
                isSwitchingToHigh={isSwitchingToHigh}
                isSwitchingToLow={isSwitchingToLow}
                isSwitchingToMid={isSwitchingToMid}
                onCancelSubscriptionClick={() => {
                  setIsPlanManagementModalOpen(false);
                  setIsCancelModalOpen(true);
                }}
              />
            ) : (
              <CreateSubscriptionModalContent
                {...createSubscriptionModalProps}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Cancel subscription */}
        <Dialog onOpenChange={setIsCancelModalOpen} open={isCancelModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("cancelSubscriptionModal.title")}</DialogTitle>

              <DialogDescription>
                {t("cancelSubscriptionModal.description")}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <ul className="flex flex-col gap-2">
                {(
                  t("cancelSubscriptionModal.features", {
                    returnObjects: true,
                  }) as string[]
                ).map((feature) => (
                  <li className="flex items-center gap-2" key={feature}>
                    <IconCircleX className="size-4 text-destructive" />
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
                {t("cancelSubscriptionModal.changePlan")}
              </Button>

              <Form method="POST" replace>
                <Button
                  disabled={isSubmitting}
                  name="intent"
                  type="submit"
                  value={CANCEL_SUBSCRIPTION_INTENT}
                  variant="destructive"
                >
                  {isCancellingSubscription ? (
                    <>
                      <Spinner />
                      {t("cancelSubscriptionModal.cancellingSubscription")}
                    </>
                  ) : (
                    t("cancelSubscriptionModal.confirm")
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
