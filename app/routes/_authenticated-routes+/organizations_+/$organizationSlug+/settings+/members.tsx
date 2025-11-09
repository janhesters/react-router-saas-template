import { useTranslation } from "react-i18next";
import { data, href, Link, useNavigation } from "react-router";

import type { Route } from "./+types/members";
import { GeneralErrorBoundary } from "~/components/general-error-boundary";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { getInstance } from "~/features/localization/i18next-middleware.server";
import { organizationMembershipContext } from "~/features/organizations/organizations-middleware.server";
import { EmailInviteCard } from "~/features/organizations/settings/team-members/invite-by-email-card";
import { InviteLinkCard } from "~/features/organizations/settings/team-members/invite-link-card";
import { teamMembersAction } from "~/features/organizations/settings/team-members/team-members-action.server";
import { INVITE_BY_EMAIL_INTENT } from "~/features/organizations/settings/team-members/team-members-constants";
import {
  mapOrganizationDataToTeamMemberSettingsProps,
  requireOrganizationWithMembersAndLatestInviteLinkExistsBySlug,
} from "~/features/organizations/settings/team-members/team-members-helpers.server";
import { TeamMembersTable } from "~/features/organizations/settings/team-members/team-members-table";
import { getPageTitle } from "~/utils/get-page-title.server";

export async function loader({ request, params, context }: Route.LoaderArgs) {
  const { user, role, headers } = context.get(organizationMembershipContext);
  const organization =
    await requireOrganizationWithMembersAndLatestInviteLinkExistsBySlug(
      params.organizationSlug,
    );
  const i18n = getInstance(context);
  const t = i18n.t.bind(i18n);

  return data(
    {
      breadcrump: {
        title: t("organizations:settings.teamMembers.breadcrumb"),
        to: href("/organizations/:organizationSlug/settings/members", {
          organizationSlug: params.organizationSlug,
        }),
      },
      pageTitle: getPageTitle(
        t,
        "organizations:settings.teamMembers.pageTitle",
      ),
      ...mapOrganizationDataToTeamMemberSettingsProps({
        currentUsersId: user.id,
        currentUsersRole: role,
        organization,
        request,
      }),
    },
    { headers },
  );
}

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData?.pageTitle },
];

export async function action(args: Route.ActionArgs) {
  return await teamMembersAction(args);
}

export default function OrganizationMembersRoute({
  actionData,
  loaderData,
  params,
}: Route.ComponentProps) {
  const { t } = useTranslation("organizations", {
    keyPrefix: "settings.teamMembers",
  });
  const {
    emailInviteCard,
    inviteLinkCard,
    organizationIsFull,
    teamMemberTable,
  } = loaderData;

  const navigation = useNavigation();
  const isInvitingByEmail =
    navigation.formData?.get("intent") === INVITE_BY_EMAIL_INTENT;

  return (
    <div className="px-4 py-4 md:py-6 lg:px-6">
      <div className="@container/main mx-auto flex w-full max-w-5xl flex-col gap-y-6">
        <div className="flex flex-col gap-2">
          <h2 className="leading-none font-semibold">{t("pageTitle")}</h2>

          <p className="text-muted-foreground text-sm">
            {teamMemberTable.currentUsersRole === "member"
              ? t("descriptionMember")
              : t("description")}
          </p>
        </div>

        <Separator />

        {organizationIsFull && (
          <div className="@container/alert">
            <Alert
              className="flex flex-col gap-2 @2xl/alert:block"
              variant="destructive"
            >
              <AlertTitle>{t("organizationIsFullAlert.title")}</AlertTitle>

              <AlertDescription>
                {t("organizationIsFullAlert.description")}
              </AlertDescription>

              <Button
                asChild
                className="shadow-none @2xl/alert:absolute @2xl/alert:top-1/2 @2xl/alert:right-3 @2xl/alert:-translate-y-1/2"
                size="sm"
              >
                <Link
                  to={href(
                    "/organizations/:organizationSlug/settings/billing",
                    { organizationSlug: params.organizationSlug },
                  )}
                >
                  {t("organizationIsFullAlert.button")}
                </Link>
              </Button>
            </Alert>
          </div>
        )}

        {teamMemberTable.currentUsersRole !== "member" && (
          <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 items-start gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs @3xl/main:grid-cols-2">
            <EmailInviteCard
              {...emailInviteCard}
              isInvitingByEmail={isInvitingByEmail}
              // @ts-expect-error - This is a submission result
              lastResult={actionData?.result}
              successEmail={
                (actionData as unknown as { success?: string })?.success
              }
            />

            <InviteLinkCard {...inviteLinkCard} />
          </div>
        )}

        <TeamMembersTable {...teamMemberTable} />
      </div>
    </div>
  );
}

export function ErrorBoundary() {
  return <GeneralErrorBoundary />;
}
