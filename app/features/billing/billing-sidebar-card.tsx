import { formatDate } from "date-fns";
import { VisuallyHidden as VisuallyHiddenPrimitive } from "radix-ui";
import { useTranslation } from "react-i18next";

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

  return (
    <Dialog>
      <Card
        className={cn(
          "gap-4 py-4 shadow-none",
          "from-primary/5 to-card bg-gradient-to-t",
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
            <DialogTrigger asChild>
              <Button
                className="w-full shadow-none"
                size="sm"
                type="button"
                variant="outline"
              >
                {state === "trialing"
                  ? t("activeTrial.button")
                  : state === "cancelled"
                    ? t("subscriptionInactive.button")
                    : t("trialEnded.button")}
              </Button>
            </DialogTrigger>
          </CardContent>
        )}
      </Card>

      <DialogContent className="max-h-[calc(100svh-4rem)] overflow-y-auto sm:max-w-[77rem]">
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
