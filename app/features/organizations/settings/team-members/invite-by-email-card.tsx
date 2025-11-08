import type { SubmissionResult } from "@conform-to/react/future";
import { useForm } from "@conform-to/react/future";
import { OrganizationMembershipRole } from "@prisma/client";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Form } from "react-router";

import { INVITE_BY_EMAIL_INTENT } from "./team-members-constants";
import { inviteByEmailSchema } from "./team-members-settings-schemas";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";

export type EmailInviteCardProps = {
  currentUserIsOwner: boolean;
  isInvitingByEmail?: boolean;
  lastResult?: SubmissionResult;
  organizationIsFull?: boolean;
  successEmail?: string;
};

export function EmailInviteCard({
  currentUserIsOwner,
  isInvitingByEmail = false,
  lastResult,
  organizationIsFull = false,
  successEmail,
}: EmailInviteCardProps) {
  const { t } = useTranslation("organizations", {
    keyPrefix: "settings.teamMembers.inviteByEmail",
  });

  const { form, fields, intent } = useForm({
    lastResult,
    schema: inviteByEmailSchema,
  });

  // If the invite was successful, clear the email input
  useEffect(() => {
    if (successEmail) {
      intent.reset();
    }
  }, [successEmail, intent]);

  const disabled = isInvitingByEmail || organizationIsFull;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("cardTitle")}</CardTitle>

        <CardDescription>{t("cardDescription")}</CardDescription>
      </CardHeader>

      <CardContent>
        <Form method="POST" {...form.props}>
          <FieldSet disabled={disabled}>
            <div className="space-y-2">
              <div className="flex gap-4">
                <Field
                  className="min-w-0 flex-1 *:w-auto w-auto!"
                  data-invalid={fields.email.ariaInvalid}
                >
                  <FieldLabel htmlFor={fields.email.id}>
                    {t("form.email")}
                  </FieldLabel>

                  <Input
                    {...fields.email.inputProps}
                    autoComplete="email"
                    defaultValue=""
                    key={successEmail}
                    placeholder={t("form.emailPlaceholder")}
                    type="email"
                  />
                </Field>

                <Field
                  className="shrink-0 *:w-auto w-auto!"
                  data-invalid={fields.role.ariaInvalid}
                >
                  <FieldLabel htmlFor={fields.role.id}>
                    {t("form.role")}
                  </FieldLabel>

                  <Select
                    defaultValue={OrganizationMembershipRole.member}
                    name={fields.role.name}
                  >
                    <SelectTrigger
                      aria-describedby={fields.role.ariaDescribedBy}
                      aria-invalid={fields.role.ariaInvalid}
                      className="min-w-28"
                      id={fields.role.id}
                    >
                      <SelectValue placeholder={t("form.rolePlaceholder")} />
                    </SelectTrigger>

                    <SelectContent align="end">
                      <SelectItem value={OrganizationMembershipRole.member}>
                        {t("form.roleMember")}
                      </SelectItem>

                      <SelectItem value={OrganizationMembershipRole.admin}>
                        {t("form.roleAdmin")}
                      </SelectItem>

                      {currentUserIsOwner && (
                        <SelectItem value={OrganizationMembershipRole.owner}>
                          {t("form.roleOwner")}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <FieldError
                errors={fields.email.errors}
                id={fields.email.errorId}
              />
              <FieldError
                errors={fields.role.errors}
                id={fields.role.errorId}
              />
            </div>
          </FieldSet>
        </Form>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          disabled={disabled}
          form={form.props.id}
          name="intent"
          type="submit"
          value={INVITE_BY_EMAIL_INTENT}
        >
          {isInvitingByEmail ? (
            <>
              <Spinner />
              {t("form.inviting")}
            </>
          ) : (
            t("form.submitButton")
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
