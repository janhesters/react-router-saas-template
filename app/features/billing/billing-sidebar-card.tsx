import * as VisuallyHiddenPrimitive from "@radix-ui/react-visually-hidden";
import { formatDate } from "date-fns";
import { useTranslation } from "react-i18next";
import { useHydrated } from "remix-utils/use-hydrated";

import type { CreateSubscriptionModalContentProps } from "./create-subscription-modal-content";
import { CreateSubscriptionModalContent } from "./create-subscription-modal-content";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { cn } from "~/lib/utils";

export type BillingSidebarCardProps = {
  className?: string;
  createSubscriptionModalProps: CreateSubscriptionModalContentProps;
  state: "trialing" | "trialEnded" | "cancelled";
  showButton: boolean;
  trialEndDate: Date;
};

export function BillingSidebarCard({
  className,
  createSubscriptionModalProps,
  state,
  showButton,
  trialEndDate,
}: BillingSidebarCardProps) {
  const { t } = useTranslation("billing", {
    keyPrefix: "billingSidebarCard",
  });
  const hydrated = useHydrated();

  return (
    <Dialog>
      <Card
        className={cn(
          "gap-4 py-4 shadow-none",
          "bg-linear-to-t from-primary/5 to-card",
          className,
        )}
      >
        <CardHeader
          className={cn(
            "px-4",
            state === "cancelled" &&
              "text-destructive *:data-[slot=card-description]:text-destructive/90",
          )}
        >
          <CardTitle className="text-sm">
            {state === "trialing"
              ? t("activeTrial.title")
              : state === "cancelled"
                ? t("subscriptionInactive.title")
                : t("trialEnded.title")}
          </CardTitle>

          <CardDescription>
            {state === "trialing"
              ? t("activeTrial.description", {
                  date: formatDate(trialEndDate, "MMMM dd, yyyy"),
                })
              : state === "cancelled"
                ? t("subscriptionInactive.description")
                : t("trialEnded.description", {
                    date: formatDate(trialEndDate, "MMMM dd, yyyy"),
                  })}
          </CardDescription>
        </CardHeader>

        {showButton && (
          <CardContent className="px-4">
            <DialogTrigger
              render={
                <Button
                  className="w-full shadow-none"
                  // Playwright shouldn't try to click the button before it's hydrated
                  disabled={!hydrated}
                  size="sm"
                  type="button"
                  variant="outline"
                />
              }
            >
              {state === "trialing"
                ? t("activeTrial.button")
                : state === "cancelled"
                  ? t("subscriptionInactive.button")
                  : t("trialEnded.button")}
            </DialogTrigger>
          </CardContent>
        )}
      </Card>

      <DialogContent className="max-h-[calc(100svh-4rem)] overflow-y-auto sm:max-w-308">
        <DialogHeader>
          <DialogTitle>
            {state === "cancelled"
              ? t("subscriptionInactive.modal.title")
              : t("billingModal.title")}
          </DialogTitle>

          <VisuallyHiddenPrimitive.Root>
            <DialogDescription>
              {t("billingModal.description")}
            </DialogDescription>
          </VisuallyHiddenPrimitive.Root>
        </DialogHeader>

        <CreateSubscriptionModalContent {...createSubscriptionModalProps} />
      </DialogContent>
    </Dialog>
  );
}
