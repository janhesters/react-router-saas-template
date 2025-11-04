import { useForm } from "@conform-to/react/future";
import { coerceFormValue } from "@conform-to/zod/v4/future";
import { UserIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { data, Form, useNavigation } from "react-router";

import type { Route } from "./+types/user-account";
import {
  AvatarUpload,
  AvatarUploadDescription,
  AvatarUploadInput,
  AvatarUploadPreviewImage,
} from "~/components/avatar-upload";
import { GeneralErrorBoundary } from "~/components/general-error-boundary";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";
import { getInstance } from "~/features/localization/i18n-middleware.server";
import { requireUserNeedsOnboarding } from "~/features/onboarding/onboarding-helpers.server";
import { onboardingUserAccountAction } from "~/features/onboarding/user-account/onboarding-user-account-action.server";
import { ONBOARDING_USER_ACCOUNT_INTENT } from "~/features/onboarding/user-account/onboarding-user-account-constants";
import { onboardingUserAccountSchema } from "~/features/onboarding/user-account/onboarding-user-account-schemas";
import { getPageTitle } from "~/utils/get-page-title.server";

export async function loader({ request, context }: Route.LoaderArgs) {
  const auth = await requireUserNeedsOnboarding({
    context,
    request,
  });
  const i18n = getInstance(context);

  return data(
    {
      title: getPageTitle(i18n.t.bind(i18n), "onboarding:user-account.title"),
      user: auth.user,
    },
    { headers: auth.headers },
  );
}

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData?.title },
];

export async function action(args: Route.ActionArgs) {
  return await onboardingUserAccountAction(args);
}

const ONE_MB = 1_000_000;

export default function UserAccountOnboardingRoute({
  actionData,
  loaderData,
}: Route.ComponentProps) {
  const { t } = useTranslation("onboarding", { keyPrefix: "user-account" });
  const { form, fields } = useForm({
    lastResult: actionData?.result,
    schema: coerceFormValue(onboardingUserAccountSchema),
  });
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <Form encType="multipart/form-data" method="POST" {...form.props}>
      <FieldSet disabled={isSubmitting}>
        <FieldGroup>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold">{t("heading")}</h1>
            <p className="text-muted-foreground text-sm text-pretty">
              {t("subtitle")}
            </p>
          </div>

          <Field data-invalid={fields.name.ariaInvalid}>
            <FieldLabel htmlFor={fields.name.id}>{t("nameLabel")}</FieldLabel>
            <FieldDescription id={fields.name.descriptionId}>
              {t("nameDescription")}
            </FieldDescription>
            <Input
              {...fields.name.inputProps}
              defaultValue={loaderData.user.name ?? ""}
              placeholder={t("namePlaceholder")}
            />
            <FieldError errors={fields.name.errors} id={fields.name.errorId} />
          </Field>

          <AvatarUpload maxFileSize={ONE_MB}>
            {({ error }) => (
              <>
                <Field
                  data-invalid={
                    fields.image.ariaInvalid || error ? "true" : undefined
                  }
                >
                  <FieldLabel htmlFor={fields.image.id}>
                    {t("profilePhotoLabel")}
                  </FieldLabel>
                  <FieldDescription id={fields.image.descriptionId}>
                    {t("profilePhotoDescription")}
                  </FieldDescription>
                  <div className="flex items-center gap-x-4 md:gap-x-8">
                    <Avatar className="size-16 md:size-24 rounded-lg">
                      <AvatarUploadPreviewImage
                        alt={t("profilePhotoPreviewAlt")}
                        className="size-16 md:size-24 rounded-lg"
                        src={loaderData.user.imageUrl}
                      />
                      <AvatarFallback className="border-border dark:bg-input/30 size-16 md:size-24 rounded-lg border">
                        <UserIcon className="size-8 md:size-12" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-2">
                      <AvatarUploadInput
                        {...fields.image.inputProps}
                        accept="image/png,image/jpeg,image/gif,image/webp"
                      />
                      <AvatarUploadDescription>
                        {t("profilePhotoFormats")}
                      </AvatarUploadDescription>
                    </div>
                  </div>
                  <FieldError
                    errors={[
                      ...(fields.image.errors ?? []),
                      ...(error ? [error] : []),
                    ]}
                    id={fields.image.errorId}
                  />
                </Field>
              </>
            )}
          </AvatarUpload>

          <Field>
            <Button
              name="intent"
              type="submit"
              value={ONBOARDING_USER_ACCOUNT_INTENT}
            >
              {isSubmitting ? (
                <>
                  <Spinner /> {t("saving")}
                </>
              ) : (
                t("save")
              )}
            </Button>
          </Field>
        </FieldGroup>
      </FieldSet>
    </Form>
  );
}

export function ErrorBoundary() {
  return <GeneralErrorBoundary />;
}
