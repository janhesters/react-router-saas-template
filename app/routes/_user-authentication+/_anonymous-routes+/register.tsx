import { useForm } from "@conform-to/react/future";
import { MailIcon } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";
import { data, Form, href, Link, useNavigation } from "react-router";
import * as z from "zod";

import type { Route } from "./+types/register";
import { GeneralErrorBoundary } from "~/components/general-error-boundary";
import { GooggleIcon } from "~/components/svgs/google-icon";
import { Button, buttonVariants } from "~/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  FieldSet,
} from "~/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "~/components/ui/input-group";
import { Spinner } from "~/components/ui/spinner";
import { getInstance } from "~/features/localization/i18next-middleware.server";
import { getInviteInfoForAuthRoutes } from "~/features/organizations/organizations-helpers.server";
import { registerAction } from "~/features/user-authentication/registration/register-action.server";
import { registerWithEmailSchema } from "~/features/user-authentication/registration/registration-schemas";
import { RegistrationVerificationAwaiting } from "~/features/user-authentication/registration/registration-verification-awaiting";
import { registerIntents } from "~/features/user-authentication/user-authentication-constants";
import { getIsAwaitingEmailConfirmation } from "~/features/user-authentication/user-authentication-helpers";
import { cn } from "~/lib/utils";
import { getPageTitle } from "~/utils/get-page-title.server";

z.config({ jitless: true });

export const REGISTER_WITH_EMAIL_INTENT = registerIntents.registerWithEmail;
export const REGISTER_WITH_GOOGLE_INTENT = registerIntents.registerWithGoogle;

export async function loader({ request, context }: Route.LoaderArgs) {
  const i18n = getInstance(context);
  const linkData = await getInviteInfoForAuthRoutes(request);

  return data(
    {
      inviteLinkInfo: linkData.inviteLinkInfo,
      title: getPageTitle(
        i18n.t.bind(i18n),
        "userAuthentication:register.pageTitle",
      ),
    },
    { headers: linkData.headers },
  );
}

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData?.title },
];

export async function action(args: Route.ActionArgs) {
  return registerAction(args);
}

export default function RegisterRoute({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { t } = useTranslation("userAuthentication", {
    keyPrefix: "register",
  });
  const { inviteLinkInfo } = loaderData;

  const isAwaitingEmailConfirmation =
    getIsAwaitingEmailConfirmation(actionData);

  const { form, fields } = useForm({
    lastResult: actionData?.result,
    schema: registerWithEmailSchema,
  });

  const navigation = useNavigation();
  const isRegisteringWithEmail =
    navigation.formData?.get("intent") === REGISTER_WITH_EMAIL_INTENT;
  const isRegisteringWithGoogle =
    navigation.formData?.get("intent") === REGISTER_WITH_GOOGLE_INTENT;
  const isSubmitting = isRegisteringWithEmail || isRegisteringWithGoogle;

  if (isAwaitingEmailConfirmation) {
    return (
      <RegistrationVerificationAwaiting
        email={actionData?.email}
        isResending={isRegisteringWithEmail}
        isSubmitting={isSubmitting}
      />
    );
  }

  return (
    <FieldSet disabled={isSubmitting}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">
            {inviteLinkInfo
              ? t("form.joinOrganization", {
                  organizationName: inviteLinkInfo.organizationName,
                })
              : t("title")}
          </h1>
          <p className="text-muted-foreground text-balance text-sm">
            {inviteLinkInfo
              ? t("form.joinOrganizationDescription", {
                  creatorName: inviteLinkInfo.creatorName,
                  organizationName: inviteLinkInfo.organizationName,
                })
              : t("subtitle")}
          </p>
        </div>

        {/* Email Registration Form */}
        <Form method="POST" {...form.props}>
          <FieldGroup>
            <Field data-invalid={fields.email.ariaInvalid}>
              <FieldLabel htmlFor={fields.email.id}>
                {t("emailLabel")}
              </FieldLabel>
              <InputGroup>
                <InputGroupInput
                  {...fields.email.inputProps}
                  autoComplete="email"
                  placeholder={t("emailPlaceholder")}
                  type="email"
                />
                <InputGroupAddon>
                  <MailIcon />
                </InputGroupAddon>
              </InputGroup>
              <FieldError
                errors={fields.email.errors}
                id={fields.email.errorId}
              />
            </Field>

            <Field>
              <Button
                name="intent"
                type="submit"
                value={REGISTER_WITH_EMAIL_INTENT}
              >
                {isRegisteringWithEmail ? (
                  <>
                    <Spinner /> {t("submitButtonSubmitting")}
                  </>
                ) : (
                  t("submitButton")
                )}
              </Button>
            </Field>
          </FieldGroup>
        </Form>

        <FieldSeparator>{t("separator")}</FieldSeparator>

        {/* Google Registration Form */}
        <Form method="POST">
          <Field>
            <Button
              name="intent"
              type="submit"
              value={REGISTER_WITH_GOOGLE_INTENT}
              variant="outline"
            >
              {isRegisteringWithGoogle ? (
                <>
                  <Spinner /> {t("googleButton")}
                </>
              ) : (
                <>
                  <GooggleIcon /> {t("googleButton")}
                </>
              )}
            </Button>
          </Field>
        </Form>

        <Field>
          <FieldDescription className="text-muted-foreground text-center text-sm">
            <Trans
              components={{
                pp: (
                  <Link
                    className={cn(
                      buttonVariants({ variant: "link" }),
                      "text-muted-foreground max-h-min p-0 underline underline-offset-4 hover:text-primary",
                    )}
                    to={href("/privacy-policy")}
                  />
                ),
                tos: (
                  <Link
                    className={cn(
                      buttonVariants({ variant: "link" }),
                      "text-muted-foreground max-h-min p-0 underline underline-offset-4 hover:text-primary",
                    )}
                    to={href("/terms-of-service")}
                  />
                ),
              }}
              i18nKey="register.legal"
              ns="userAuthentication"
            />
          </FieldDescription>
        </Field>

        <FieldSeparator />

        <Field>
          <FieldDescription className="text-center">
            <Trans
              components={{
                login: (
                  <Link
                    className={cn(
                      buttonVariants({ variant: "link" }),
                      "text-muted-foreground max-h-min p-0 hover:text-primary",
                    )}
                    to={href("/login")}
                  />
                ),
              }}
              i18nKey="register.loginCta"
              ns="userAuthentication"
            />
          </FieldDescription>
        </Field>
      </FieldGroup>
    </FieldSet>
  );
}

export function ErrorBoundary() {
  return <GeneralErrorBoundary />;
}
