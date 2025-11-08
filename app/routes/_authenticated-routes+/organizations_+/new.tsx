import { useTranslation } from "react-i18next";
import { TbArrowLeft } from "react-icons/tb";
import { Link, useNavigation } from "react-router";

import type { Route } from "./+types/new";
import { Button } from "~/components/ui/button";
import { ThemeToggle } from "~/features/color-scheme/theme-toggle";
import { getInstance } from "~/features/localization/i18next-middleware.server";
import { createOrganizationAction } from "~/features/organizations/create-organization/create-organization-action.server";
import { CREATE_ORGANIZATION_INTENT } from "~/features/organizations/create-organization/create-organization-constants";
import { CreateOrganizationFormCard } from "~/features/organizations/create-organization/create-organization-form-card";
import { requireAuthenticatedUserExists } from "~/features/user-accounts/user-accounts-helpers.server";
import { getPageTitle } from "~/utils/get-page-title.server";

export async function loader({ request, context }: Route.LoaderArgs) {
  await requireAuthenticatedUserExists({
    context,
    request,
  });
  const i18n = getInstance(context);

  return {
    title: getPageTitle(i18n.t.bind(i18n), "organizations:new.pageTitle"),
  };
}

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData?.title },
];

export async function action(args: Route.ActionArgs) {
  return await createOrganizationAction(args);
}

export default function NewOrganizationRoute({
  actionData,
}: Route.ComponentProps) {
  const { t } = useTranslation("organizations", { keyPrefix: "new" });

  const navigation = useNavigation();
  const isCreatingOrganization =
    navigation.formData?.get("intent") === CREATE_ORGANIZATION_INTENT;

  return (
    <>
      <header className="flex h-(--header-height) items-center border-b">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between p-2">
          <div className="flex items-center gap-2">
            <Button asChild className="size-8" size="icon" variant="outline">
              <Link aria-label={t("backButtonLabel")} to="/organizations">
                <TbArrowLeft />
              </Link>
            </Button>

            <h1 className="text-base font-medium">{t("pageTitle")}</h1>
          </div>

          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100svh-var(--header-height))] w-full max-w-lg flex-col items-center justify-center px-4 py-4 md:py-6 lg:px-6">
        <CreateOrganizationFormCard
          isCreatingOrganization={isCreatingOrganization}
          lastResult={actionData?.result}
        />
      </main>
    </>
  );
}
