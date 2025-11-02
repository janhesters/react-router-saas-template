import type { Route } from "./+types/invite-link";
import { getInstance } from "~/features/localization/i18n-middleware.server";
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
    title: getPageTitle(
      i18n.t.bind(i18n),
      "organizations:accept-invite-link.page-title",
    ),
    token,
    ...data,
  };
}

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData?.title },
];

export async function action(actionArguments: Route.ActionArgs) {
  return await acceptInviteLinkAction(actionArguments);
}

export default function OrganizationInviteRoute({
  loaderData,
}: Route.ComponentProps) {
  return <AcceptInviteLinkPage {...loaderData} />;
}
