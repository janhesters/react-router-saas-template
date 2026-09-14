import type { SubmissionResult } from "@conform-to/react/future";
import { useMemo } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Form, useNavigation } from "react-router";
import { useHydrated } from "remix-utils/use-hydrated";

import { DELETE_USER_ACCOUNT_INTENT } from "./account-settings-constants";
import { deleteUserAccountFormSchema } from "./account-settings-schemas";
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
import { Field, FieldError, FieldLabel, FieldSet } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "~/components/ui/item";
import { Spinner } from "~/components/ui/spinner";
import { useForm } from "~/utils/conform";

export type DangerZoneProps = {
  email: string;
  implicitlyDeletedOrganizations: string[];
  lastResult?: SubmissionResult;
  organizationsBlockingAccountDeletion: string[];
};

function DeleteAccountDialog({
  email,
  implicitlyDeletedOrganizations,
  lastResult,
  organizationsBlockingAccountDeletion,
}: DangerZoneProps) {
  const { t } = useTranslation("settings", {
    keyPrefix: "userAccount.dangerZone",
  });
  const confirmationSchema = useMemo(
    () =>
      deleteUserAccountFormSchema.refine(
        (value) => value.confirmation === email,
        {
          message:
            "settings:userAccount.dangerZone.errors.confirmationMismatch",
          path: ["confirmation"],
        },
      ),
    [email],
  );
  const { form, fields, intent } = useForm(confirmationSchema, {
    lastResult,
    shouldRevalidate: "onInput",
    shouldValidate: "onInput",
  });
  const navigation = useNavigation();
  const isSubmitting =
    navigation.state === "submitting" &&
    navigation.formData?.get("intent") === DELETE_USER_ACCOUNT_INTENT;
  const hydrated = useHydrated();

  return (
    <Dialog
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          intent.reset();
        }
      }}
    >
      <DialogTrigger
        render={
          <Button
            aria-describedby="account-deletion-description"
            disabled={
              !hydrated || organizationsBlockingAccountDeletion.length > 0
            }
            variant="destructive"
          />
        }
      >
        {t("deleteButton")}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("dialogTitle")}</DialogTitle>
          <DialogDescription>{t("dialogDescription")}</DialogDescription>
          <p className="text-muted-foreground text-sm">
            {t("cleanupDescription")}
          </p>
          {implicitlyDeletedOrganizations.length > 0 && (
            <p className="text-muted-foreground text-sm">
              <Trans
                components={{ 1: <strong className="text-foreground" /> }}
                count={implicitlyDeletedOrganizations.length}
                i18nKey="userAccount.dangerZone.implicitlyDeletedOrganizations"
                ns="settings"
                shouldUnescape
                values={{
                  organizations: implicitlyDeletedOrganizations.join(", "),
                }}
              />
            </p>
          )}
        </DialogHeader>

        <Form method="POST" {...form.props}>
          <FieldError errors={form.errors} id={form.errorId} />
          <FieldSet disabled={isSubmitting}>
            <Field data-invalid={fields.confirmation.ariaInvalid}>
              <FieldLabel htmlFor={fields.confirmation.id}>
                {t("confirmationLabel", { email })}
              </FieldLabel>
              <Input
                {...fields.confirmation.inputProps}
                autoComplete="off"
                placeholder={t("confirmationPlaceholder")}
              />
              <FieldError
                errors={fields.confirmation.errors}
                id={fields.confirmation.errorId}
              />
            </Field>
          </FieldSet>
        </Form>

        <DialogFooter className="sm:justify-end">
          <DialogClose
            render={
              <Button
                className="mt-2 sm:mt-0"
                disabled={isSubmitting}
                type="button"
                variant="secondary"
              />
            }
          >
            {t("cancel")}
          </DialogClose>
          <Button
            disabled={isSubmitting}
            form={form.props.id}
            name="intent"
            type="submit"
            value={DELETE_USER_ACCOUNT_INTENT}
            variant="destructive"
          >
            {isSubmitting ? (
              <>
                <Spinner />
                {t("deleting")}
              </>
            ) : (
              t("deleteConfirm")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DangerZone(props: DangerZoneProps) {
  const { t } = useTranslation("settings", {
    keyPrefix: "userAccount.dangerZone",
  });
  const { organizationsBlockingAccountDeletion } = props;

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
          <ItemDescription
            className="line-clamp-none"
            id="account-deletion-description"
          >
            {organizationsBlockingAccountDeletion.length > 0 ? (
              <>
                <Trans
                  components={{ 1: <strong className="text-foreground" /> }}
                  count={organizationsBlockingAccountDeletion.length}
                  i18nKey="userAccount.dangerZone.blockingOrganizations"
                  ns="settings"
                  shouldUnescape
                  values={{
                    organizations:
                      organizationsBlockingAccountDeletion.join(", "),
                  }}
                />{" "}
                {t("blockingOrganizationsHelp")}
              </>
            ) : (
              t("deleteDescription")
            )}
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <DeleteAccountDialog {...props} />
        </ItemActions>
      </Item>
    </section>
  );
}
