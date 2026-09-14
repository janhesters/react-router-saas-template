import type { Route } from "./+types/account";
import { GeneralErrorBoundary } from "~/components/general-error-boundary";
import { Separator } from "~/components/ui/separator";
import { getInstance } from "~/features/localization/i18next-middleware.server";
import { AccountSettings } from "~/features/user-accounts/settings/account/account-settings";
import { accountSettingsAction } from "~/features/user-accounts/settings/account/account-settings-action.server";
import { DangerZone } from "~/features/user-accounts/settings/account/danger-zone";
import { requireAuthenticatedUserWithMembershipsExists } from "~/features/user-accounts/user-accounts-helpers.server";
import { prisma } from "~/utils/database.server";
import { getPageTitle } from "~/utils/get-page-title.server";

export async function loader({ request, context }: Route.LoaderArgs) {
  const auth = await requireAuthenticatedUserWithMembershipsExists({
    context,
    request,
  });
  const i18n = getInstance(context);
  const ownedOrganizations = await prisma.organization.findMany({
    select: {
      memberships: {
        select: { memberId: true, role: true },
        where: {
          OR: [{ deactivatedAt: null }, { deactivatedAt: { gt: new Date() } }],
        },
      },
      name: true,
    },
    where: {
      memberships: {
        some: {
          memberId: auth.user.id,
          OR: [{ deactivatedAt: null }, { deactivatedAt: { gt: new Date() } }],
          role: "owner",
        },
      },
    },
  });
  const implicitlyDeletedOrganizations = ownedOrganizations
    .filter((organization) => organization.memberships.length === 1)
    .map((organization) => organization.name);
  const organizationsBlockingAccountDeletion = ownedOrganizations
    .filter(
      (organization) =>
        organization.memberships.length > 1 &&
        !organization.memberships.some(
          (member) =>
            member.memberId !== auth.user.id && member.role === "owner",
        ),
    )
    .map((organization) => organization.name);

  return {
    implicitlyDeletedOrganizations,
    organizationDeletions: await prisma.organizationDeletion.findMany({
      orderBy: [
        { completedAt: { nulls: "first", sort: "asc" } },
        { createdAt: "desc" },
      ],
      select: { id: true, organizationName: true },
      take: 20,
      where: { requestedById: auth.user.id },
    }),
    organizationsBlockingAccountDeletion,
    pageTitle: getPageTitle(
      i18n.t.bind(i18n),
      "settings:userAccount.pageTitle",
    ),
    user: auth.user,
  };
}

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData?.pageTitle },
];

export async function action(args: Route.ActionArgs) {
  return await accountSettingsAction(args);
}

export default function SettingsAccountRoute({
  actionData,
  loaderData,
}: Route.ComponentProps) {
  const { t } = useTranslation("settings", { keyPrefix: "userAccount" });
  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="space-y-6 px-4 py-4 md:py-6">
        <AccountSettings
          lastResult={actionData?.result}
          user={loaderData.user}
        />

        <Separator />

        {loaderData.organizationDeletions.length > 0 && (
          <section
            aria-labelledby="organization-deletions-title"
            className="space-y-2"
          >
            <h2 className="font-semibold" id="organization-deletions-title">
              {t("organizationDeletions.title")}
            </h2>
            <p className="text-muted-foreground text-sm">
              {t("organizationDeletions.description")}
            </p>
            <ul className="space-y-2">
              {loaderData.organizationDeletions.map((deletion) => (
                <li key={deletion.id}>
                  <Link
                    className="underline"
                    to={href("/organization-deletions/:deletionId", {
                      deletionId: deletion.id,
                    })}
                  >
                    {deletion.organizationName}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <DangerZone
          email={loaderData.user.email}
          implicitlyDeletedOrganizations={
            loaderData.implicitlyDeletedOrganizations
          }
          lastResult={actionData?.result}
          organizationsBlockingAccountDeletion={
            loaderData.organizationsBlockingAccountDeletion
          }
        />
      </div>
    </div>
  );
}

export function ErrorBoundary() {
  return <GeneralErrorBoundary />;
}

import { useTranslation } from "react-i18next";
import { href, Link } from "react-router";
