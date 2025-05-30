import { promiseHash } from 'remix-utils/promise';

import { getInstance } from '~/features/localization/middleware.server';
import { acceptInviteLinkAction } from '~/features/organizations/accept-invite-link/accept-invite-link-action.server';
import {
  getInviteLinkToken,
  requireCreatorAndOrganizationByTokenExists,
} from '~/features/organizations/accept-invite-link/accept-invite-link-helpers.server';
import { AcceptInviteLinkPage } from '~/features/organizations/accept-invite-link/accept-invite-link-page';
import { getPageTitle } from '~/utils/get-page-title.server';

import type { Route } from './+types/invite-link';

export async function loader({ request, context }: Route.LoaderArgs) {
  const i18n = getInstance(context);
  const token = getInviteLinkToken(request);
  const { data } = await promiseHash({
    data: requireCreatorAndOrganizationByTokenExists(token),
  });
  return {
    title: getPageTitle(i18n, 'organizations:accept-invite-link.page-title'),
    token,
    ...data,
  };
}

export const meta: Route.MetaFunction = ({ data }) => [{ title: data?.title }];

export async function action(actionArguments: Route.ActionArgs) {
  return await acceptInviteLinkAction(actionArguments);
}

export default function OrganizationInviteRoute({
  loaderData,
}: Route.ComponentProps) {
  return <AcceptInviteLinkPage {...loaderData} />;
}
