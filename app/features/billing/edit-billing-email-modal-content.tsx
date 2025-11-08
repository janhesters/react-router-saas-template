import type { SubmissionResult } from "@conform-to/react/future";
import { useForm } from "@conform-to/react/future";
import { useTranslation } from "react-i18next";
import { Form } from "react-router";

import { UPDATE_BILLING_EMAIL_INTENT } from "./billing-constants";
import { updateBillingEmailSchema } from "./billing-schemas";
import { Button } from "~/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Field, FieldError, FieldLabel, FieldSet } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";

type EditBillingEmailModalContentProps = {
  billingEmail: string;
  isUpdatingBillingEmail?: boolean;
  lastResult?: SubmissionResult;
};

export function EditBillingEmailModalContent({
  billingEmail,
  isUpdatingBillingEmail = false,
  lastResult,
}: EditBillingEmailModalContentProps) {
  const { t } = useTranslation("billing", {
    keyPrefix: "billingPage.updateBillingEmailModal",
  });

  const { form, fields } = useForm({
    lastResult,
    schema: updateBillingEmailSchema,
  });

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>{t("title")}</DialogTitle>

        <DialogDescription>{t("description")}</DialogDescription>
      </DialogHeader>

      <Form
        {...form.props}
        className="py-2"
        id="edit-billing-email-form"
        method="POST"
      >
        <FieldSet disabled={isUpdatingBillingEmail}>
          <Field data-invalid={fields.billingEmail.ariaInvalid}>
            <FieldLabel htmlFor={fields.billingEmail.id}>
              {t("emailLabel")}
            </FieldLabel>

            <Input
              {...fields.billingEmail.inputProps}
              className="col-span-3"
              defaultValue={billingEmail}
              placeholder={t("emailPlaceholder")}
            />

            <FieldError
              errors={fields.billingEmail.errors}
              id={fields.billingEmail.errorId}
            />
          </Field>
        </FieldSet>
      </Form>

      <DialogFooter>
        <Button
          disabled={isUpdatingBillingEmail}
          form="edit-billing-email-form"
          name="intent"
          type="submit"
          value={UPDATE_BILLING_EMAIL_INTENT}
        >
          {isUpdatingBillingEmail ? (
            <>
              <Spinner />
              {t("savingChanges")}
            </>
          ) : (
            t("submitButton")
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
