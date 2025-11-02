import { useTranslation } from "react-i18next";
import { data, useActionData, useNavigation } from "react-router";

import type { Route } from "./+types/login";
import { GeneralErrorBoundary } from "~/components/general-error-boundary";
import { getInstance } from "~/features/localization/i18n-middleware.server";
import { getInviteInfoForAuthRoutes } from "~/features/organizations/organizations-helpers.server";
import type { LoginActionData } from "~/features/user-authentication/login/login-action.server";
import { loginAction } from "~/features/user-authentication/login/login-action.server";
import { LoginFormCard } from "~/features/user-authentication/login/login-form-card";
import { LoginVerificationAwaiting } from "~/features/user-authentication/login/login-verification-awaiting";
import { loginIntents } from "~/features/user-authentication/user-authentication-constants";
import { getIsAwaitingEmailConfirmation } from "~/features/user-authentication/user-authentication-helpers";
import { getFormErrors } from "~/utils/get-form-errors";
import { getPageTitle } from "~/utils/get-page-title.server";

export async function loader({ request, context }: Route.LoaderArgs) {
  const i18n = getInstance(context);
  const linkData = await getInviteInfoForAuthRoutes(request);

  return data(
    {
      inviteLinkInfo: linkData.inviteLinkInfo,
      title: getPageTitle(
        i18n.t.bind(i18n),
        "user-authentication:login.page-title",
      ),
    },
    { headers: linkData.headers },
  );
}

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData?.title },
];

export async function action(args: Route.ActionArgs) {
  return loginAction(args);
}

export default function LoginRoute({ loaderData }: Route.ComponentProps) {
  const { t } = useTranslation("user-authentication");
  const navigation = useNavigation();
  const { inviteLinkInfo } = loaderData;
  const actionData = useActionData<LoginActionData>();

  const isAwaitingEmailConfirmation =
    getIsAwaitingEmailConfirmation(actionData);
  const errors = getFormErrors(actionData);

  const isLoggingInWithEmail =
    navigation.formData?.get("intent") === loginIntents.loginWithEmail;
  const isLoggingInWithGoogle =
    navigation.formData?.get("intent") === loginIntents.loginWithGoogle;
  const isSubmitting = isLoggingInWithEmail || isLoggingInWithGoogle;

  return (
    <>
      <h1 className="sr-only">{t("login.page-title")}</h1>

      <div className="flex flex-col gap-6">
        {isAwaitingEmailConfirmation ? (
          <LoginVerificationAwaiting
            email={actionData?.email}
            isResending={isLoggingInWithEmail}
            isSubmitting={isSubmitting}
          />
        ) : (
          <LoginFormCard
            errors={errors}
            inviteLinkInfo={inviteLinkInfo}
            isLoggingInWithEmail={isLoggingInWithEmail}
            isLoggingInWithGoogle={isLoggingInWithGoogle}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </>
  );
}

export function ErrorBoundary() {
  return <GeneralErrorBoundary />;
}
