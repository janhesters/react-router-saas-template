import type { Organization } from "@prisma/client";
import { Trans, useTranslation } from "react-i18next";
import { Form } from "react-router";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "~/components/ui/item";
import { Spinner } from "~/components/ui/spinner";
import { cn } from "~/lib/utils";

export const DELETE_USER_ACCOUNT_INTENT = "delete-user-account";

export type DangerZoneProps = {
  imlicitlyDeletedOrganizations: Organization["name"][];
  isDeletingAccount?: boolean;
  organizationsBlockingAccountDeletion: Organization["name"][];
};

function Strong({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("text-foreground font-semibold", className)}>
      {children}
    </span>
  );
}

function DeleteAccountDialogComponent({
  imlicitlyDeletedOrganizations,
  isDeletingAccount = false,
  isDeleteBlocked,
}: {
  imlicitlyDeletedOrganizations: Organization["name"][];
  isDeletingAccount: boolean;
  isDeleteBlocked: boolean;
}) {
  const { t } = useTranslation("settings", {
    keyPrefix: "user-account.danger-zone",
  });

  const hasImplicitDeletions = imlicitlyDeletedOrganizations.length > 0;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button disabled={isDeleteBlocked} variant="destructive">
          {t("delete-button")}
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("dialog-title")}</DialogTitle>
          <div className="space-y-2">
            <DialogDescription>{t("dialog-description")}</DialogDescription>

            {hasImplicitDeletions && (
              <div className="text-muted-foreground text-sm">
                <Trans
                  components={{ 1: <Strong /> }}
                  count={imlicitlyDeletedOrganizations.length}
                  i18nKey="settings:user-account.danger-zone.implicitly-deleted-organizations"
                  shouldUnescape
                  values={{
                    organizations: imlicitlyDeletedOrganizations.join(", "),
                  }}
                />
              </div>
            )}
          </div>
        </DialogHeader>

        <DialogFooter className="sm:justify-end">
          <DialogClose asChild>
            <Button
              className="mt-2 sm:mt-0"
              disabled={isDeletingAccount}
              type="button"
              variant="secondary"
            >
              {t("cancel")}
            </Button>
          </DialogClose>

          <Form method="POST" replace>
            <Button
              disabled={isDeletingAccount}
              name="intent"
              type="submit"
              value={DELETE_USER_ACCOUNT_INTENT}
              variant="destructive"
            >
              {isDeletingAccount ? (
                <>
                  <Spinner />
                  {t("deleting")}
                </>
              ) : (
                t("delete-confirm")
              )}
            </Button>
          </Form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DangerZone({
  imlicitlyDeletedOrganizations,
  isDeletingAccount = false,
  organizationsBlockingAccountDeletion,
}: DangerZoneProps) {
  const { t } = useTranslation("settings", {
    keyPrefix: "user-account.danger-zone",
  });

  const isDeleteBlocked = organizationsBlockingAccountDeletion.length > 0;

  return (
    <section
      aria-labelledby="danger-zone-heading"
      className="flex flex-col gap-4"
    >
      <h2 className="font-medium text-destructive" id="danger-zone-heading">
        {t("title")}
      </h2>
      <Item className="border-destructive" variant="outline">
        <ItemContent>
          <ItemTitle>{t("delete-title")}</ItemTitle>
          <ItemDescription>
            {isDeleteBlocked ? (
              <span className="space-y-1">
                <Trans
                  components={{ 1: <Strong /> }}
                  count={organizationsBlockingAccountDeletion.length}
                  i18nKey="settings:user-account.danger-zone.blocking-organizations"
                  shouldUnescape
                  values={{
                    organizations:
                      organizationsBlockingAccountDeletion.join(", "),
                  }}
                />{" "}
                <span>{t("blocking-organizations-help")}</span>
              </span>
            ) : (
              t("delete-description")
            )}
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <DeleteAccountDialogComponent
            imlicitlyDeletedOrganizations={imlicitlyDeletedOrganizations}
            isDeleteBlocked={isDeleteBlocked}
            isDeletingAccount={isDeletingAccount}
          />
        </ItemActions>
      </Item>
    </section>
  );
}
