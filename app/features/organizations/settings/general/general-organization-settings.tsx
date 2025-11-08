import type { SubmissionResult } from "@conform-to/react/future";
import { useForm } from "@conform-to/react/future";
import { coerceFormValue } from "@conform-to/zod/v4/future";
import type { Organization } from "@prisma/client";
import { Trans, useTranslation } from "react-i18next";
import { Form, useNavigation } from "react-router";

import { UPDATE_ORGANIZATION_INTENT } from "./general-settings-constants";
import { updateOrganizationFormSchema } from "./general-settings-schemas";
import {
  AvatarUpload,
  AvatarUploadDescription,
  AvatarUploadInput,
  AvatarUploadPreviewImage,
} from "~/components/avatar-upload";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "~/components/ui/field";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "~/components/ui/hover-card";
import { Input } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";

const ONE_MB = 1_000_000;

export type GeneralOrganizationSettingsProps = {
  lastResult?: SubmissionResult;
  organization: Pick<Organization, "name" | "imageUrl" | "id">;
};

function WarningHoverCard({
  children,
  content,
}: {
  children?: React.ReactNode;
  content: string;
}) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button className="p-0 h-auto" type="button" variant="link">
          {children}
        </Button>
      </HoverCardTrigger>
      <HoverCardContent align="start" className="w-80">
        <p className="text-sm">{content}</p>
      </HoverCardContent>
    </HoverCard>
  );
}

export function GeneralOrganizationSettings({
  lastResult,
  organization,
}: GeneralOrganizationSettingsProps) {
  const { t } = useTranslation("organizations", {
    keyPrefix: "settings.general",
  });

  const { form, fields } = useForm({
    lastResult,
    schema: coerceFormValue(updateOrganizationFormSchema),
  });

  const navigation = useNavigation();
  const isSubmitting =
    navigation.state === "submitting" &&
    navigation.formData?.get("intent") === UPDATE_ORGANIZATION_INTENT;

  return (
    <Form
      encType="multipart/form-data"
      method="POST"
      {...form.props}
      aria-describedby={
        form.errors && form.errors.length > 0
          ? `${form.descriptionId} ${form.errorId}`
          : form.descriptionId
      }
      aria-invalid={form.errors && form.errors.length > 0 ? true : undefined}
    >
      <FieldSet disabled={isSubmitting}>
        <FieldLegend>
          <h1>{t("pageTitle")}</h1>
        </FieldLegend>
        <FieldDescription>{t("description")}</FieldDescription>

        <FieldGroup className="**:data-[slot=field-error]:mt-1 @md/field-group:[&_[data-slot=field][data-orientation=responsive]]:grid @md/field-group:[&_[data-slot=field][data-orientation=responsive]]:grid-cols-2 @md/field-group:[&_[data-slot=field][data-orientation=responsive]]:gap-x-8">
          {/* Organization Name */}
          <Field
            data-invalid={fields.name.ariaInvalid}
            orientation="responsive"
          >
            <FieldContent>
              <FieldLabel htmlFor={fields.name.id}>
                {t("form.nameLabel")}
              </FieldLabel>

              <FieldDescription id={fields.name.descriptionId}>
                <Trans
                  components={{
                    bold: <span className="font-semibold text-foreground" />,
                    warning: (
                      <WarningHoverCard
                        content={t("form.nameWarningContent")}
                      />
                    ),
                  }}
                  i18nKey="form.nameDescription"
                  parent={null}
                  t={t}
                />
              </FieldDescription>
            </FieldContent>

            <div>
              <Input
                {...fields.name.inputProps}
                autoComplete="organization"
                defaultValue={organization.name}
                placeholder={t("form.namePlaceholder")}
              />

              <FieldError
                errors={fields.name.errors}
                id={fields.name.errorId}
              />
            </div>
          </Field>

          {/* Logo Upload */}
          <AvatarUpload maxFileSize={ONE_MB}>
            {({ error }) => (
              <Field
                data-invalid={
                  fields.logo.ariaInvalid || error ? "true" : undefined
                }
                orientation="responsive"
              >
                <FieldContent>
                  <FieldLabel htmlFor={fields.logo.id}>
                    {t("form.logoLabel")}
                  </FieldLabel>
                  <FieldDescription id={fields.logo.descriptionId}>
                    {t("form.logoDescription")}
                  </FieldDescription>
                </FieldContent>
                <div>
                  <div className="flex items-center gap-x-4 md:gap-x-8">
                    <Avatar className="size-16 md:size-24 rounded-lg">
                      <AvatarUploadPreviewImage
                        alt={t("form.logoPreviewAlt")}
                        className="size-16 md:size-24 rounded-lg object-cover"
                        src={organization.imageUrl ?? ""}
                      />

                      <AvatarFallback className="border-border dark:bg-input/30 size-16 md:size-24 rounded-lg border text-lg md:text-2xl">
                        {organization.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-2">
                      <AvatarUploadInput
                        {...fields.logo.inputProps}
                        accept="image/*"
                      />

                      <AvatarUploadDescription>
                        {t("form.logoFormats")}
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
                </div>
              </Field>
            )}
          </AvatarUpload>

          <div className="max-w-min">
            <Button
              name="intent"
              type="submit"
              value={UPDATE_ORGANIZATION_INTENT}
            >
              {isSubmitting ? (
                <>
                  <Spinner />
                  {t("form.saving")}
                </>
              ) : (
                t("form.save")
              )}
            </Button>
          </div>
        </FieldGroup>
      </FieldSet>
    </Form>
  );
}
