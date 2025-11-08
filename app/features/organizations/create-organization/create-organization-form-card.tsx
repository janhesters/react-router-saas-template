import type { SubmissionResult } from "@conform-to/react/future";
import { useForm } from "@conform-to/react/future";
import { coerceFormValue } from "@conform-to/zod/v4/future";
import { BuildingIcon } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";
import { Form, href, Link } from "react-router";

import { CREATE_ORGANIZATION_INTENT } from "./create-organization-constants";
import { createOrganizationFormSchema } from "./create-organization-schemas";
import {
  AvatarUpload,
  AvatarUploadDescription,
  AvatarUploadInput,
  AvatarUploadPreviewImage,
} from "~/components/avatar-upload";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldSet,
} from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";

const ONE_MB = 1_000_000;

export type CreateOrganizationFormCardProps = {
  isCreatingOrganization?: boolean;
  lastResult?: SubmissionResult;
};

export function CreateOrganizationFormCard({
  isCreatingOrganization = false,
  lastResult,
}: CreateOrganizationFormCardProps) {
  const { t } = useTranslation("organizations", { keyPrefix: "new.form" });
  const { form, fields } = useForm({
    lastResult,
    schema: coerceFormValue(createOrganizationFormSchema),
  });

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("cardTitle")}</CardTitle>
          <CardDescription>{t("cardDescription")}</CardDescription>
        </CardHeader>

        <CardContent>
          <Form encType="multipart/form-data" method="POST" {...form.props}>
            <FieldSet
              className="flex flex-col gap-6"
              disabled={isCreatingOrganization}
            >
              <Field data-invalid={fields.name.ariaInvalid}>
                <FieldLabel htmlFor={fields.name.id}>
                  {t("nameLabel")}
                </FieldLabel>
                <FieldDescription id={fields.name.descriptionId}>
                  {/* @ts-expect-error - TypeScript can't infer this key from keyPrefix */}
                  {t("nameDescription")}
                </FieldDescription>
                <Input
                  {...fields.name.inputProps}
                  autoComplete="organization"
                  autoFocus
                  placeholder={t("namePlaceholder")}
                />
                <FieldError
                  errors={fields.name.errors}
                  id={fields.name.errorId}
                />
              </Field>

              <AvatarUpload maxFileSize={ONE_MB}>
                {({ error }) => (
                  <Field
                    data-invalid={
                      fields.logo.ariaInvalid || error ? "true" : undefined
                    }
                  >
                    <FieldLabel htmlFor={fields.logo.id}>
                      {t("logoLabel")}
                    </FieldLabel>
                    <FieldDescription id={fields.logo.descriptionId}>
                      {/* @ts-expect-error - TypeScript can't infer this key from keyPrefix */}
                      {t("logoDescription")}
                    </FieldDescription>
                    <div className="flex items-center gap-x-4 md:gap-x-8">
                      <Avatar className="size-16 md:size-24 rounded-lg">
                        <AvatarUploadPreviewImage
                          alt={
                            // @ts-expect-error - TypeScript can't infer this key from keyPrefix
                            t("logoPreviewAlt")
                          }
                          className="size-16 md:size-24 rounded-lg"
                          src=""
                        />
                        <AvatarFallback className="border-border dark:bg-input/30 size-16 md:size-24 rounded-lg border">
                          <BuildingIcon className="size-8 md:size-12" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col gap-2">
                        <AvatarUploadInput
                          {...fields.logo.inputProps}
                          accept="image/png,image/jpeg,image/gif,image/webp"
                        />
                        <AvatarUploadDescription>
                          {/* @ts-expect-error - TypeScript can't infer this key from keyPrefix */}
                          {t("logoFormats")}
                        </AvatarUploadDescription>
                      </div>
                    </div>
                    <FieldError
                      errors={[
                        ...(fields.logo.errors ?? []),
                        ...(error ? [error] : []),
                      ]}
                      id={fields.logo.errorId}
                    />
                  </Field>
                )}
              </AvatarUpload>
            </FieldSet>
          </Form>
        </CardContent>

        <CardFooter>
          <Button
            className="w-full"
            disabled={isCreatingOrganization}
            form={form.id}
            name="intent"
            type="submit"
            value={CREATE_ORGANIZATION_INTENT}
          >
            {isCreatingOrganization ? (
              <>
                <Spinner />
                {t("saving")}
              </>
            ) : (
              t("submitButton")
            )}
          </Button>
        </CardFooter>
      </Card>

      <div className="text-muted-foreground [&_a]:hover:text-primary text-center text-xs text-balance [&_a]:underline [&_a]:underline-offset-4">
        <Trans
          components={{
            1: <Link to={href("/terms-of-service")} />,
            2: <Link to={href("/privacy-policy")} />,
          }}
          i18nKey="new.form.termsAndPrivacy"
          ns="organizations"
        />
      </div>
    </div>
  );
}
