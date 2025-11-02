import { useTranslation } from "react-i18next";
import { data, href, useNavigation } from "react-router";

import type { Route } from "./+types/organization";
import { GeneralErrorBoundary } from "~/components/general-error-boundary";
import { getInstance } from "~/features/localization/i18n-middleware.server";
import { requireUserNeedsOnboarding } from "~/features/onboarding/onboarding-helpers.server";
import { OnboardingSteps } from "~/features/onboarding/onboarding-steps";
import { onboardingOrganizationAction } from "~/features/onboarding/organization/onboarding-organization-action.server";
import { ONBOARDING_ORGANIZATION_INTENT } from "~/features/onboarding/organization/onboarding-organization-consants";
import { OnboardingOrganizationFormCard } from "~/features/onboarding/organization/onboarding-organization-form-card";
import { getFormErrors } from "~/utils/get-form-errors";
import { getPageTitle } from "~/utils/get-page-title.server";

export async function loader({ request, context }: Route.LoaderArgs) {
  const auth = await requireUserNeedsOnboarding({
    context,
    request,
  });
  const i18n = getInstance(context);

  return data(
    { title: getPageTitle(i18n.t.bind(i18n), "onboarding:organization.title") },
    { headers: auth.headers },
  );
}

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData?.title },
];

export async function action(args: Route.ActionArgs) {
  return await onboardingOrganizationAction(args);
}

export default function OrganizationOnboardingRoute({
  actionData,
}: Route.ComponentProps) {
  const { t } = useTranslation("onboarding");
  const navigation = useNavigation();
  const isCreatingOrganization =
    navigation.formData?.get("intent") === ONBOARDING_ORGANIZATION_INTENT;
  const errors = getFormErrors(actionData);

  return (
    <>
      <header className="sr-only">
        <h1>{t("common.onboarding")}</h1>
      </header>

      <main className="mx-auto flex min-h-svh max-w-7xl flex-col space-y-4 py-4 sm:px-6 md:h-full md:space-y-0 md:px-8">
        <OnboardingSteps
          className="px-4 sm:px-0"
          label={t("common.onboarding-progress")}
          steps={[
            {
              href: href("/onboarding/user-account"),
              name: t("user-account.title"),
              status: "complete",
            },
            {
              href: href("/onboarding/organization"),
              name: t("organization.title"),
              status: "current",
            },
          ]}
        />

        <div className="flex flex-grow flex-col items-center justify-center px-4 py-4">
          <OnboardingOrganizationFormCard
            errors={errors}
            isCreatingOrganization={isCreatingOrganization}
          />
        </div>
      </main>
    </>
  );
}

export function ErrorBoundary() {
  return <GeneralErrorBoundary />;
}
