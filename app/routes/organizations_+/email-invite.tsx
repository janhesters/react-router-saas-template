import { useLoaderData } from 'react-router';

import { getInstance } from '~/features/localization/middleware.server';
import { acceptEmailInviteAction } from '~/features/organizations/accept-email-invite/accept-email-invite-action.server';
import {
  getEmailInviteToken,
  requireEmailInviteDataByTokenExists,
} from '~/features/organizations/accept-email-invite/accept-email-invite-helpers.server';
import { AcceptEmailInvitePage } from '~/features/organizations/accept-email-invite/accept-email-invite-page';
import { getPageTitle } from '~/utils/get-page-title.server';

import type { Route } from './+types/email-invite';

export async function loader({ request, context }: Route.LoaderArgs) {
  const token = getEmailInviteToken(request);
  const data = await requireEmailInviteDataByTokenExists(token);
  const i18n = getInstance(context);

  return {
    title: getPageTitle(
      i18n.t.bind(i18n),
      'organizations:accept-email-invite.page-title',
    ),
    ...data,
  } as const;
}

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData?.title },
];

export async function action(args: Route.ActionArgs) {
  return acceptEmailInviteAction(args);
}

export default function EmailInviteRoute() {
  const { inviterName, organizationName } = useLoaderData<typeof loader>();
  return (
    <AcceptEmailInvitePage
      inviterName={inviterName}
      organizationName={organizationName}
    />
  );
}
