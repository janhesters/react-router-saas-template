import type { Route } from "./+types/invite-link";
import { getInstance } from "~/features/localization/i18next-middleware.server";
import { acceptInviteLinkAction } from "~/features/organizations/accept-invite-link/accept-invite-link-action.server";
import {
  getInviteLinkToken,
  requireCreatorAndOrganizationByTokenExists,
} from "~/features/organizations/accept-invite-link/accept-invite-link-helpers.server";
import { AcceptInviteLinkPage } from "~/features/organizations/accept-invite-link/accept-invite-link-page";
import { getPageTitle } from "~/utils/get-page-title.server";

export async function loader({ request, context }: Route.LoaderArgs) {
  const token = getInviteLinkToken(request);
  const data = await requireCreatorAndOrganizationByTokenExists(token);
  const i18n = getInstance(context);

  return {
    pageTitle: getPageTitle(
      i18n.t.bind(i18n),
      "organizations:acceptInviteLink.pageTitle",
    ),
    token,
    ...data,
  };
}

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData?.pageTitle },
];

export async function action(actionArguments: Route.ActionArgs) {
  return await acceptInviteLinkAction(actionArguments);
}

export default function OrganizationInviteRoute({
  loaderData,
}: Route.ComponentProps) {
  return <AcceptInviteLinkPage {...loaderData} />;
}
