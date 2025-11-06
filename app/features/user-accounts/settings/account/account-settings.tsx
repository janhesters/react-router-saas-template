import type { SubmissionResult } from "@conform-to/react/future";
import { useForm } from "@conform-to/react/future";
import { coerceFormValue } from "@conform-to/zod/v4/future";
import type { UserAccount } from "@prisma/client";
import { UserIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Form, useNavigation } from "react-router";

import { UPDATE_USER_ACCOUNT_INTENT } from "./account-settings-constants";
import { updateUserAccountFormSchema } from "./account-settings-schemas";
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
import { Input } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";

const ONE_MB = 1_000_000;

export type AccountSettingsProps = {
  lastResult?: SubmissionResult;
  user: Pick<UserAccount, "email" | "imageUrl" | "name">;
};

export function AccountSettings({ lastResult, user }: AccountSettingsProps) {
  const { t } = useTranslation("settings", {
    keyPrefix: "user-account",
  });

  const { form, fields } = useForm({
    lastResult,
    schema: coerceFormValue(updateUserAccountFormSchema),
  });

  const navigation = useNavigation();
  const isSubmitting =
    navigation.state === "submitting" &&
    navigation.formData?.get("intent") === UPDATE_USER_ACCOUNT_INTENT;

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
          <h1>{t("page-title")}</h1>
        </FieldLegend>
        <FieldDescription>{t("description")}</FieldDescription>

        <FieldGroup className="**:data-[slot=field-error]:mt-1 @md/field-group:[&_[data-slot=field][data-orientation=responsive]]:grid @md/field-group:[&_[data-slot=field][data-orientation=responsive]]:grid-cols-2 @md/field-group:[&_[data-slot=field][data-orientation=responsive]]:gap-x-8">
          {/* Name Field */}
          <Field
            data-invalid={fields.name.ariaInvalid}
            orientation="responsive"
          >
            <FieldContent>
              <FieldLabel htmlFor={fields.name.id}>
                {t("form.name-label")}
              </FieldLabel>
              <FieldDescription id={fields.name.descriptionId}>
                {t("form.name-description")}
              </FieldDescription>
            </FieldContent>

            <div>
              <Input
                {...fields.name.inputProps}
                autoComplete="name"
                defaultValue={user.name}
                placeholder={t("form.name-placeholder")}
              />

              <FieldError
                errors={fields.name.errors}
                id={fields.name.errorId}
              />
            </div>
          </Field>

          {/* Email Field - Read Only */}
          <Field orientation="responsive">
            <FieldContent>
              <FieldLabel htmlFor="email">{t("form.email-label")}</FieldLabel>
              <FieldDescription id="email-description">
                {t("form.email-description")}
              </FieldDescription>
            </FieldContent>
            <div>
              <Input
                autoComplete="email"
                disabled
                id="email"
                name="email"
                placeholder={t("form.email-placeholder")}
                readOnly
                value={user.email}
              />
            </div>
          </Field>

          {/* Avatar Upload */}
          <AvatarUpload maxFileSize={ONE_MB}>
            {({ error }) => (
              <Field
                data-invalid={
                  fields.avatar.ariaInvalid || error ? "true" : undefined
                }
                orientation="responsive"
              >
                <FieldContent>
                  <FieldLabel htmlFor={fields.avatar.id}>
                    {t("form.avatar-label")}
                  </FieldLabel>
                  <FieldDescription id={fields.avatar.descriptionId}>
                    {t("form.avatar-description")}
                  </FieldDescription>
                </FieldContent>
                <div>
                  <div className="flex items-center gap-x-4 md:gap-x-8">
                    <Avatar className="size-16 md:size-24 rounded-lg">
                      <AvatarUploadPreviewImage
                        alt={t("form.avatar-preview-alt")}
                        className="size-16 md:size-24 rounded-lg object-cover"
                        src={user.imageUrl ?? ""}
                      />

                      <AvatarFallback className="border-border dark:bg-input/30 size-16 md:size-24 rounded-lg border">
                        <UserIcon className="size-8 md:size-12" />
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col gap-2">
                      <AvatarUploadInput
                        {...fields.avatar.inputProps}
                        accept="image/*"
                      />

                      <AvatarUploadDescription>
                        {t("form.avatar-formats")}
                      </AvatarUploadDescription>
                    </div>
                  </div>

                  <FieldError
                    errors={[
                      ...(fields.avatar.errors ?? []),
                      ...(error ? [error] : []),
                    ]}
                    id={fields.avatar.errorId}
                  />
                </div>
              </Field>
            )}
          </AvatarUpload>

          <div className="max-w-min">
            <Button
              name="intent"
              type="submit"
              value={UPDATE_USER_ACCOUNT_INTENT}
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
