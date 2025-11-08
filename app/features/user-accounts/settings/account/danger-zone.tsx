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
    keyPrefix: "userAccount.dangerZone",
  });

  const hasImplicitDeletions = imlicitlyDeletedOrganizations.length > 0;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button disabled={isDeleteBlocked} variant="destructive">
          {t("deleteButton")}
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("dialogTitle")}</DialogTitle>
          <div className="space-y-2">
            <DialogDescription>{t("dialogDescription")}</DialogDescription>

            {hasImplicitDeletions && (
              <div className="text-muted-foreground text-sm">
                <Trans
                  components={{ 1: <Strong /> }}
                  count={imlicitlyDeletedOrganizations.length}
                  i18nKey="userAccount.dangerZone.implicitlyDeletedOrganizations"
                  ns="settings"
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
                t("deleteConfirm")
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
    keyPrefix: "userAccount.dangerZone",
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
          <ItemTitle>{t("deleteTitle")}</ItemTitle>
          <ItemDescription>
            {isDeleteBlocked ? (
              <span className="space-y-1">
                <Trans
                  components={{ 1: <Strong /> }}
                  count={organizationsBlockingAccountDeletion.length}
                  i18nKey="userAccount.dangerZone.blockingOrganizations"
                  ns="settings"
                  shouldUnescape
                  values={{
                    organizations:
                      organizationsBlockingAccountDeletion.join(", "),
                  }}
                />{" "}
                <span>{t("blockingOrganizationsHelp")}</span>
              </span>
            ) : (
              t("deleteDescription")
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
