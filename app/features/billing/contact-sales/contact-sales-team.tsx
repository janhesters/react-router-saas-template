import type { SubmissionResult } from "@conform-to/react/future";
import { useForm } from "@conform-to/react/future";
import { useTranslation } from "react-i18next";
import { Form } from "react-router";
import { HoneypotInputs } from "remix-utils/honeypot/react";

import { CONTACT_SALES_INTENT } from "./contact-sales-constants";
import { contactSalesFormSchema } from "./contact-sales-schemas";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Field, FieldError, FieldLabel, FieldSet } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";
import { Textarea } from "~/components/ui/textarea";

export type ContactSalesTeamProps = {
  isContactingSales?: boolean;
  lastResult?: SubmissionResult;
};

export function ContactSalesTeam({
  isContactingSales = false,
  lastResult,
}: ContactSalesTeamProps) {
  const { t } = useTranslation("billing", { keyPrefix: "contact-sales" });

  const { form, fields } = useForm({
    lastResult,
    schema: contactSalesFormSchema,
  });

  return (
    <Card>
      <CardHeader className="space-y-6">
        <CardTitle className="text-primary text-5xl">
          {t("contact-sales-title")}
        </CardTitle>

        <CardDescription className="text-2xl">
          {t("contact-sales-description")}
        </CardDescription>
      </CardHeader>

      <Form method="POST" {...form.props}>
        <FieldSet className="space-y-6" disabled={isContactingSales}>
          <CardContent className="space-y-6">
            <Field data-invalid={fields.firstName.ariaInvalid}>
              <FieldLabel htmlFor={fields.firstName.id}>
                {t("first-name-label")}
              </FieldLabel>
              <Input
                {...fields.firstName.inputProps}
                autoComplete="given-name"
                placeholder={t("first-name-placeholder")}
              />
              <FieldError
                errors={fields.firstName.errors}
                id={fields.firstName.errorId}
              />
            </Field>

            <Field data-invalid={fields.lastName.ariaInvalid}>
              <FieldLabel htmlFor={fields.lastName.id}>
                {t("last-name-label")}
              </FieldLabel>
              <Input
                {...fields.lastName.inputProps}
                autoComplete="family-name"
                placeholder={t("last-name-placeholder")}
              />
              <FieldError
                errors={fields.lastName.errors}
                id={fields.lastName.errorId}
              />
            </Field>

            <Field data-invalid={fields.companyName.ariaInvalid}>
              <FieldLabel htmlFor={fields.companyName.id}>
                {t("company-name-label")}
              </FieldLabel>
              <Input
                {...fields.companyName.inputProps}
                autoComplete="organization"
                placeholder={t("company-name-placeholder")}
              />
              <FieldError
                errors={fields.companyName.errors}
                id={fields.companyName.errorId}
              />
            </Field>

            <Field data-invalid={fields.workEmail.ariaInvalid}>
              <FieldLabel htmlFor={fields.workEmail.id}>
                {t("work-email-label")}
              </FieldLabel>
              <Input
                {...fields.workEmail.inputProps}
                autoComplete="email"
                placeholder={t("work-email-placeholder")}
                type="email"
              />
              <FieldError
                errors={fields.workEmail.errors}
                id={fields.workEmail.errorId}
              />
            </Field>

            <Field data-invalid={fields.phoneNumber.ariaInvalid}>
              <FieldLabel htmlFor={fields.phoneNumber.id}>
                {t("phone-number-label")}
              </FieldLabel>
              <Input
                {...fields.phoneNumber.inputProps}
                autoComplete="tel"
                placeholder={t("phone-number-placeholder")}
                type="tel"
              />
              <FieldError
                errors={fields.phoneNumber.errors}
                id={fields.phoneNumber.errorId}
              />
            </Field>

            <Field data-invalid={fields.message.ariaInvalid}>
              <FieldLabel htmlFor={fields.message.id}>
                {t("message-label")}
              </FieldLabel>
              <Textarea
                {...fields.message.inputProps}
                className="min-h-[90px] resize-none"
                placeholder={t("message-placeholder")}
              />
              <FieldError
                errors={fields.message.errors}
                id={fields.message.errorId}
              />
            </Field>

            <HoneypotInputs label="Please leave this field blank" />
          </CardContent>

          <CardFooter className="flex flex-col items-start space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <p className="text-muted-foreground text-sm">
              {t("submit-disclaimer")}
            </p>

            <Button name="intent" type="submit" value={CONTACT_SALES_INTENT}>
              {isContactingSales ? (
                <>
                  <Spinner />
                  {t("submit-button-loading")}
                </>
              ) : (
                t("submit-button")
              )}
            </Button>
          </CardFooter>
        </FieldSet>
      </Form>
    </Card>
  );
}
