import { useTranslation } from "react-i18next";
import {
  data,
  useActionData,
  useLoaderData,
  useNavigation,
} from "react-router";

import type { Route } from "./+types/login";
import { GeneralErrorBoundary } from "~/components/general-error-boundary";
import { getInstance } from "~/features/localization/i18n-middleware.server";
import { getInviteInfoForAuthRoutes } from "~/features/organizations/organizations-helpers.server";
import type { RegisterActionData } from "~/features/user-authentication/registration/register-action.server";
import { registerAction } from "~/features/user-authentication/registration/register-action.server";
import { RegistrationFormCard } from "~/features/user-authentication/registration/registration-form-card";
import { RegistrationVerificationAwaiting } from "~/features/user-authentication/registration/registration-verification-awaiting";
import { registerIntents } from "~/features/user-authentication/user-authentication-constants";
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
        "user-authentication:register.page-title",
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

export default function RegisterRoute() {
  const { t } = useTranslation("user-authentication");
  const navigation = useNavigation();
  const actionData = useActionData<RegisterActionData>();
  const { inviteLinkInfo } = useLoaderData<typeof loader>();

  const isAwaitingEmailConfirmation =
    getIsAwaitingEmailConfirmation(actionData);
  const errors = getFormErrors(actionData);

  const isRegisteringWithEmail =
    navigation.formData?.get("intent") === registerIntents.registerWithEmail;
  const isRegisteringWithGoogle =
    navigation.formData?.get("intent") === registerIntents.registerWithGoogle;
  const isSubmitting = isRegisteringWithEmail || isRegisteringWithGoogle;

  return (
    <>
      <h1 className="sr-only">{t("register.page-title")}</h1>

      <div className="flex flex-col gap-6">
        {isAwaitingEmailConfirmation ? (
          <RegistrationVerificationAwaiting
            email={actionData?.email}
            isResending={isRegisteringWithEmail}
            isSubmitting={isSubmitting}
          />
        ) : (
          <RegistrationFormCard
            errors={errors}
            inviteLinkInfo={inviteLinkInfo}
            isRegisteringWithEmail={isRegisteringWithEmail}
            isRegisteringWithGoogle={isRegisteringWithGoogle}
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
