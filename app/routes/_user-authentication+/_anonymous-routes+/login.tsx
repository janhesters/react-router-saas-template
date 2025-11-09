import { useForm } from "@conform-to/react/future";
import { MailIcon } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";
import { data, Form, href, Link, useNavigation } from "react-router";
import * as z from "zod";

import type { Route } from "./+types/login";
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
import { loginAction } from "~/features/user-authentication/login/login-action.server";
import { loginWithEmailSchema } from "~/features/user-authentication/login/login-schemas";
import { LoginVerificationAwaiting } from "~/features/user-authentication/login/login-verification-awaiting";
import { loginIntents } from "~/features/user-authentication/user-authentication-constants";
import { getIsAwaitingEmailConfirmation } from "~/features/user-authentication/user-authentication-helpers";
import { cn } from "~/lib/utils";
import { getPageTitle } from "~/utils/get-page-title.server";

z.config({ jitless: true });

export const LOGIN_WITH_EMAIL_INTENT = loginIntents.loginWithEmail;
export const LOGIN_WITH_GOOGLE_INTENT = loginIntents.loginWithGoogle;

export async function loader({ request, context }: Route.LoaderArgs) {
  const i18n = getInstance(context);
  const linkData = await getInviteInfoForAuthRoutes(request);

  return data(
    {
      inviteLinkInfo: linkData.inviteLinkInfo,
      pageTitle: getPageTitle(
        i18n.t.bind(i18n),
        "userAuthentication:login.pageTitle",
      ),
    },
    { headers: linkData.headers },
  );
}

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData?.pageTitle },
];

export async function action(args: Route.ActionArgs) {
  return loginAction(args);
}

export default function LoginRoute({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { t } = useTranslation("userAuthentication", { keyPrefix: "login" });
  const { inviteLinkInfo } = loaderData;

  const isAwaitingEmailConfirmation =
    getIsAwaitingEmailConfirmation(actionData);

  const { form, fields } = useForm({
    lastResult: actionData?.result,
    schema: loginWithEmailSchema,
  });

  const navigation = useNavigation();
  const isLoggingInWithEmail =
    navigation.formData?.get("intent") === LOGIN_WITH_EMAIL_INTENT;
  const isLoggingInWithGoogle =
    navigation.formData?.get("intent") === LOGIN_WITH_GOOGLE_INTENT;
  const isSubmitting = isLoggingInWithEmail || isLoggingInWithGoogle;

  if (isAwaitingEmailConfirmation) {
    return (
      <LoginVerificationAwaiting
        email={actionData?.email}
        isResending={isLoggingInWithEmail}
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
                  creatorName: inviteLinkInfo.creatorName,
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

        {/* Email Login Form */}
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
                value={LOGIN_WITH_EMAIL_INTENT}
              >
                {isLoggingInWithEmail ? (
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

        {/* Google Login Form */}
        <Form method="POST">
          <Field>
            <Button
              name="intent"
              type="submit"
              value={LOGIN_WITH_GOOGLE_INTENT}
              variant="outline"
            >
              {isLoggingInWithGoogle ? (
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
          <FieldDescription className="text-center">
            <Trans
              components={{
                signup: (
                  <Link
                    className={cn(
                      buttonVariants({ variant: "link" }),
                      "text-muted-foreground max-h-min p-0 hover:text-primary",
                    )}
                    to={href("/register")}
                  />
                ),
              }}
              i18nKey="login.signupCta"
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
