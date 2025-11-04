import { useForm } from "@conform-to/react/future";
import { Loader2Icon } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Form, useNavigation } from "react-router";
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
import { Field, FieldError, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";

export type DangerZoneProps = {
  organizationName: string;
};

export function DangerZone({ organizationName }: DangerZoneProps) {
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

  return (
    <div className="flex flex-col gap-y-4">
      <h2 className="text-destructive leading-none font-semibold">
        {t("title")}
      </h2>

      <div className="border-destructive rounded-xl border px-4 py-2">
        <div className="flex flex-col justify-between gap-y-2 md:flex-row md:items-center">
          <div className="space-y-1">
            <div className="text-foreground font-medium">
              {t("delete-title")}
            </div>

            <p className="text-muted-foreground text-sm">
              {t("delete-description")}
            </p>
          </div>

          <Dialog
            onOpenChange={(isOpen) => {
              if (!isOpen) {
                intent.reset();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button variant="destructive">{t("trigger-button")}</Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("dialog-title")}</DialogTitle>
                <DialogDescription>{t("dialog-description")}</DialogDescription>
              </DialogHeader>

              <Form method="POST" {...form.props}>
                <fieldset disabled={isSubmitting}>
                  <Field data-invalid={fields.confirmation.ariaInvalid}>
                    <FieldLabel htmlFor={fields.confirmation.id}>
                      {t("confirmation-label", { organizationName })}
                    </FieldLabel>
                    <Input
                      {...fields.confirmation.inputProps}
                      placeholder={t("confirmation-placeholder")}
                    />
                    <FieldError
                      errors={fields.confirmation.errors}
                      id={fields.confirmation.errorId}
                    />
                  </Field>
                </fieldset>
              </Form>

              <DialogFooter className="sm:justify-end">
                <DialogClose asChild>
                  <Button
                    className="mt-2 sm:mt-0"
                    disabled={isSubmitting}
                    type="button"
                    variant="secondary"
                  >
                    {t("cancel-button")}
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
                      <Loader2Icon className="animate-spin" />
                      {t("delete-button-submitting")}
                    </>
                  ) : (
                    t("delete-button")
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
