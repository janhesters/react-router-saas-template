import { useForm } from "@conform-to/react/future";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Form, useNavigation } from "react-router";
import { useHydrated } from "remix-utils/use-hydrated";
import { z } from "zod";

import { DELETE_ORGANIZATION_INTENT } from "./general-settings-constants";
import { deleteOrganizationFormSchema } from "./general-settings-schemas";
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

export type DangerZoneProps = {
  organizationName: string;
};

function DeleteOrganizationDialogComponent({
  organizationName,
}: DangerZoneProps) {
  const { t } = useTranslation("organizations", {
    keyPrefix: "settings.general.dangerZone",
  });

  const localDeleteOrganizationFormSchema = useMemo(
    () =>
      deleteOrganizationFormSchema.and(
        z.object({
          confirmation: z
            .string()
            .min(1, {
              message:
                "organizations:settings.general.dangerZone.errors.confirmationRequired",
            })
            .refine((value) => value === organizationName, {
              message:
                "organizations:settings.general.dangerZone.errors.confirmationMismatch",
            }),
        }),
      ),
    [organizationName],
  );

  const { form, fields, intent } = useForm({
    schema: localDeleteOrganizationFormSchema,
    shouldRevalidate: "onInput",
    shouldValidate: "onInput",
  });

  const navigation = useNavigation();
  const isSubmitting =
    navigation.state === "submitting" &&
    navigation.formData?.get("intent") === DELETE_ORGANIZATION_INTENT;
  const hydrated = useHydrated();

  return (
    <Dialog
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          intent.reset();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          // Playwright shouldn't try to click the button before it's hydrated
          disabled={!hydrated}
          variant="destructive"
        >
          {t("triggerButton")}
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("dialogTitle")}</DialogTitle>
          <DialogDescription>{t("dialogDescription")}</DialogDescription>
        </DialogHeader>

        <Form method="POST" {...form.props}>
          <FieldSet disabled={isSubmitting}>
            <Field data-invalid={fields.confirmation.ariaInvalid}>
              <FieldLabel htmlFor={fields.confirmation.id}>
                {t("confirmationLabel", { organizationName })}
              </FieldLabel>
              <Input
                {...fields.confirmation.inputProps}
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
          <DialogClose asChild>
            <Button
              className="mt-2 sm:mt-0"
              disabled={isSubmitting}
              type="button"
              variant="secondary"
            >
              {t("cancelButton")}
            </Button>
          </DialogClose>

          <Button
            disabled={
              isSubmitting ||
              !fields.confirmation.touched ||
              !fields.confirmation.valid
            }
            form={form.props.id}
            name="intent"
            type="submit"
            value={DELETE_ORGANIZATION_INTENT}
            variant="destructive"
          >
            {isSubmitting ? (
              <>
                <Spinner />
                {t("deleteButtonSubmitting")}
              </>
            ) : (
              t("deleteButton")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DangerZone({ organizationName }: DangerZoneProps) {
  const { t } = useTranslation("organizations", {
    keyPrefix: "settings.general.dangerZone",
  });

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
          <ItemDescription>{t("deleteDescription")}</ItemDescription>
        </ItemContent>
        <ItemActions>
          <DeleteOrganizationDialogComponent
            organizationName={organizationName}
          />
        </ItemActions>
      </Item>
    </section>
  );
}
