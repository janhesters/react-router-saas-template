import { asyncPipe } from '~/utils/async-pipe.server';
import { getSearchParameterFromRequest } from '~/utils/get-search-parameter-from-request.server';
import { notFound } from '~/utils/http-responses.server';
import { throwIfEntityIsMissing } from '~/utils/throw-if-entity-is-missing.server';

import { retrieveCreatorAndOrganizationFromDatabaseByToken } from '../organization-invite-link-model.server';

/**
 * Checks if the provided invite link has expired.
 *
 * @param link - The invite link object retrieved from the database.
 * @throws A '403 Forbidden' HTTP response if the invite link has expired.
 */
export const throwIfInviteLinkIsExpired = (
  link: NonNullable<
    Awaited<
      ReturnType<typeof retrieveCreatorAndOrganizationFromDatabaseByToken>
    >
  >,
) => {
  if (new Date() > link.expiresAt) {
    throw notFound();
  }

  return link;
};

/**
 * Validates and returns the organization invite link identified by the provided
 * token.
 *
 * @param token - The unique token identifying the invite link.
 * @returns A Promise that resolves with the invite link object if it exists and
 * has not expired.
 * @throws A '404 Not Found' error if the invite link does not exist in the
 * database or is expired.
 */
export const requireInviteLinkByTokenExists = asyncPipe(
  retrieveCreatorAndOrganizationFromDatabaseByToken,
  throwIfEntityIsMissing,
  throwIfInviteLinkIsExpired,
);

/**
 * Ensures that an invite link identified by the provided token exists in the
 * database.
 *
 * @param token - The unique token for the invite link.
 * @returns An object containing creator and organization data associated with
 * the token.
 * @throws A '404 not found' HTTP response if the invite link identified by the
 * token doesn't exist.
 */
export async function requireCreatorAndOrganizationByTokenExists(
  token: string,
) {
  const inviteLink = await requireInviteLinkByTokenExists(token);
  return {
    inviterName: inviteLink.creator?.name ?? 'Deactivated User',
    organizationName: inviteLink.organization.name,
  };
}

/**
 * Extracts the token for an invite link from the search parameters.
 *
 * @param Request - The request to get the token from.
 * @returns The token from the request params, or null.
 */
export const getInviteLinkToken = getSearchParameterFromRequest('token');
