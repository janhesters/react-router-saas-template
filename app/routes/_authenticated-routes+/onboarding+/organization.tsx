import { useForm } from "@conform-to/react/future";
import { coerceFormValue } from "@conform-to/zod/v4/future";
import { BuildingIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { data, Form, useNavigation } from "react-router";

import type { Route } from "./+types/organization";
import {
  AvatarUpload,
  AvatarUploadDescription,
  AvatarUploadInput,
  AvatarUploadPreviewImage,
} from "~/components/avatar-upload";
import { GeneralErrorBoundary } from "~/components/general-error-boundary";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";
import { Textarea } from "~/components/ui/textarea";
import { getInstance } from "~/features/localization/i18next-middleware.server";
import { requireUserNeedsOnboarding } from "~/features/onboarding/onboarding-helpers.server";
import { onboardingOrganizationAction } from "~/features/onboarding/organization/onboarding-organization-action.server";
import { ONBOARDING_ORGANIZATION_INTENT } from "~/features/onboarding/organization/onboarding-organization-consants";
import {
  COMPANY_SIZE_OPTIONS,
  COMPANY_TYPE_OPTIONS,
  onboardingOrganizationSchema,
  REFERRAL_SOURCE_OPTIONS,
} from "~/features/onboarding/organization/onboarding-organization-schemas";
import { getPageTitle } from "~/utils/get-page-title.server";

export async function loader({ request, context }: Route.LoaderArgs) {
  const auth = await requireUserNeedsOnboarding({
    context,
    request,
  });
  const i18n = getInstance(context);

  return data(
    {
      pageTitle: getPageTitle(
        i18n.t.bind(i18n),
        "onboarding:organization.title",
      ),
    },
    { headers: auth.headers },
  );
}

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData?.pageTitle },
];

export async function action(args: Route.ActionArgs) {
  return await onboardingOrganizationAction(args);
}

const ONE_MB = 1_000_000;

export default function OrganizationOnboardingRoute({
  actionData,
}: Route.ComponentProps) {
  const { t } = useTranslation("onboarding", { keyPrefix: "organization" });
  const { form, fields } = useForm({
    lastResult: actionData?.result,
    schema: coerceFormValue(onboardingOrganizationSchema),
  });
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

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
        <FieldGroup>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold">{t("heading")}</h1>
            <p
              className="text-muted-foreground text-sm text-pretty"
              id={form.descriptionId}
            >
              {t("subtitle")}
            </p>
          </div>

          {form.errors && form.errors.length > 0 && (
            <Alert id={form.errorId} variant="destructive">
              <AlertTitle>
                {t("errors.createOrganizationFailedTitle")}
              </AlertTitle>
              <AlertDescription>
                {t("errors.createOrganizationFailedDescription")}
              </AlertDescription>
            </Alert>
          )}

          {/* Organization Name */}
          <Field data-invalid={fields.name.ariaInvalid}>
            <FieldLabel htmlFor={fields.name.id}>{t("nameLabel")}</FieldLabel>
            <FieldDescription id={fields.name.descriptionId}>
              {t("nameDescription")}
            </FieldDescription>
            <Input
              {...fields.name.inputProps}
              autoComplete="organization"
              placeholder={t("namePlaceholder")}
            />
            <FieldError errors={fields.name.errors} id={fields.name.errorId} />
          </Field>

          {/* Logo Upload */}
          <AvatarUpload maxFileSize={ONE_MB}>
            {({ error }) => (
              <>
                <Field
                  data-invalid={
                    fields.logo.ariaInvalid || error ? "true" : undefined
                  }
                >
                  <FieldLabel htmlFor={fields.logo.id}>
                    {t("logoLabel")}
                  </FieldLabel>
                  <FieldDescription id={fields.logo.descriptionId}>
                    {t("logoDescription")}
                  </FieldDescription>
                  <div className="flex items-center gap-x-4 md:gap-x-8">
                    <Avatar className="size-16 md:size-24 rounded-lg">
                      <AvatarUploadPreviewImage
                        alt={t("logoPreviewAlt")}
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
              </>
            )}
          </AvatarUpload>

          {/* Company Website */}
          <Field data-invalid={fields.website.ariaInvalid}>
            <FieldLabel htmlFor={fields.website.id}>
              {t("companyWebsiteLabel")}
            </FieldLabel>
            <FieldDescription id={fields.website.descriptionId}>
              {t("companyWebsiteDescription")}
            </FieldDescription>
            <Input
              {...fields.website.inputProps}
              placeholder={t("companyWebsitePlaceholder")}
              type="url"
            />
            <FieldError
              errors={fields.website.errors}
              id={fields.website.errorId}
            />
          </Field>

          {/* How did you hear about us */}
          <FieldGroup>
            <FieldSet
              aria-describedby={fields.referralSources.ariaDescribedBy}
              aria-invalid={fields.referralSources.ariaInvalid}
            >
              <FieldLegend variant="label">
                {t("referralSourcesLabel")}
              </FieldLegend>
              <FieldDescription id={fields.referralSources.descriptionId}>
                {t("referralSourcesDescription")}
              </FieldDescription>
              <FieldGroup className="flex flex-row flex-wrap gap-2 [--radius:9999rem]">
                {REFERRAL_SOURCE_OPTIONS.map((option) => {
                  const labelId = `referral-source-${option}-label`;
                  return (
                    <FieldLabel
                      className="w-fit!"
                      htmlFor={`referral-source-${option}`}
                      key={option}
                    >
                      <Field
                        className="gap-1.5 overflow-hidden px-3! py-1.5! transition-all duration-100 ease-linear group-has-data-[state=checked]/field-label:px-2!"
                        data-invalid={fields.referralSources.ariaInvalid}
                        orientation="horizontal"
                      >
                        <Checkbox
                          aria-invalid={fields.referralSources.ariaInvalid}
                          aria-labelledby={labelId}
                          className="-ml-6 -translate-x-1 rounded-full transition-all duration-100 ease-linear data-[state=checked]:ml-0 data-[state=checked]:translate-x-0"
                          id={`referral-source-${option}`}
                          name={fields.referralSources.name}
                          value={option}
                        />
                        <FieldTitle id={labelId}>
                          {t(`referralSource.${option}`)}
                        </FieldTitle>
                      </Field>
                    </FieldLabel>
                  );
                })}
              </FieldGroup>
              <FieldError
                errors={fields.referralSources.errors}
                id={fields.referralSources.errorId}
              />
            </FieldSet>
          </FieldGroup>

          {/* What type of company */}
          <FieldGroup>
            <FieldSet
              aria-describedby={fields.companyTypes.ariaDescribedBy}
              aria-invalid={fields.companyTypes.ariaInvalid}
            >
              <FieldLegend variant="label">
                {t("companyTypesLabel")}
              </FieldLegend>
              <FieldDescription id={fields.companyTypes.descriptionId}>
                {t("companyTypesDescription")}
              </FieldDescription>
              <FieldGroup data-slot="checkbox-group">
                {COMPANY_TYPE_OPTIONS.map((option) => (
                  <Field
                    data-invalid={fields.companyTypes.ariaInvalid}
                    key={option}
                    orientation="horizontal"
                  >
                    <Checkbox
                      aria-invalid={fields.companyTypes.ariaInvalid}
                      id={`company-type-${option}`}
                      name={fields.companyTypes.name}
                      value={option}
                    />
                    <FieldLabel
                      className="font-normal"
                      htmlFor={`company-type-${option}`}
                    >
                      {t(`companyType.${option}`)}
                    </FieldLabel>
                  </Field>
                ))}
              </FieldGroup>
              <FieldError
                errors={fields.companyTypes.errors}
                id={fields.companyTypes.errorId}
              />
            </FieldSet>
          </FieldGroup>

          {/* How big is your team */}
          <Field data-invalid={fields.companySize.ariaInvalid}>
            <FieldLabel htmlFor={fields.companySize.id}>
              {t("companySizeLabel")}
            </FieldLabel>
            <FieldDescription id={fields.companySize.descriptionId}>
              {t("companySizeDescription")}
            </FieldDescription>
            <Select name={fields.companySize.name}>
              <SelectTrigger
                aria-describedby={fields.companySize.ariaDescribedBy}
                aria-invalid={fields.companySize.ariaInvalid}
                className="w-full"
                id={fields.companySize.id}
              >
                <SelectValue placeholder={t("companySizePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {COMPANY_SIZE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {t(`companySize.${option}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError
              errors={fields.companySize.errors}
              id={fields.companySize.errorId}
            />
          </Field>

          {/* Recruiting pain point */}
          <Field data-invalid={fields.recruitingPainPoint.ariaInvalid}>
            <FieldLabel htmlFor={fields.recruitingPainPoint.id}>
              {t("recruitingPainPointLabel")}
            </FieldLabel>
            <FieldDescription id={fields.recruitingPainPoint.descriptionId}>
              {t("recruitingPainPointDescription")}
            </FieldDescription>
            <Textarea
              {...fields.recruitingPainPoint.inputProps}
              className="field-sizing-fixed!"
              placeholder={t("recruitingPainPointPlaceholder")}
              rows={3}
            />
            <FieldError
              errors={fields.recruitingPainPoint.errors}
              id={fields.recruitingPainPoint.errorId}
            />
          </Field>

          {/* Early access opt-in */}
          <FieldGroup>
            <FieldSet
              aria-describedby={fields.earlyAccessOptIn.ariaDescribedBy}
              aria-invalid={fields.earlyAccessOptIn.ariaInvalid}
            >
              <FieldLegend variant="label">{t("earlyAccessLabel")}</FieldLegend>
              <FieldLabel
                className="hover:bg-accent/50 flex items-start gap-3 rounded-lg border p-3 has-aria-checked:border-primary has-aria-checked:bg-primary/5 dark:has-aria-checked:border-primary dark:has-aria-checked:bg-primary/10"
                htmlFor={fields.earlyAccessOptIn.id}
              >
                <Checkbox
                  aria-describedby={fields.earlyAccessOptIn.ariaDescribedBy}
                  aria-invalid={fields.earlyAccessOptIn.ariaInvalid}
                  className="data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:border-primary dark:data-[state=checked]:bg-primary"
                  id={fields.earlyAccessOptIn.id}
                  name={fields.earlyAccessOptIn.name}
                />
                <div className="grid gap-1.5 font-normal">
                  <FieldTitle>{t("earlyAccessTitle")}</FieldTitle>
                  <FieldDescription id={fields.earlyAccessOptIn.descriptionId}>
                    {t("earlyAccessDescription")}
                  </FieldDescription>
                </div>
              </FieldLabel>
              <FieldError
                errors={fields.earlyAccessOptIn.errors}
                id={fields.earlyAccessOptIn.errorId}
              />
            </FieldSet>
          </FieldGroup>

          <Field>
            <Button
              name="intent"
              type="submit"
              value={ONBOARDING_ORGANIZATION_INTENT}
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
