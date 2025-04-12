import { data } from 'react-router';
import { promiseHash } from 'remix-utils/promise';
import { z } from 'zod';

import { deleteOrganizationFromDatabaseById } from '~/features/organizations/organizations-model.server';
import { requireAuthenticatedUserWithMembershipsExists } from '~/features/user-accounts/user-accounts-helpers.server';
import {
  deleteUserAccountFromDatabaseById,
  updateUserAccountInDatabaseById,
} from '~/features/user-accounts/user-accounts-model.server';
import { combineHeaders } from '~/utils/combine-headers.server';
import { getIsDataWithResponseInit } from '~/utils/get-is-data-with-response-init.server';
import { badRequest } from '~/utils/http-responses.server';
import i18next from '~/utils/i18next.server';
import { createToastHeaders, redirectWithToast } from '~/utils/toast.server';
import { validateFormData } from '~/utils/validate-form-data.server';

import type { UpdateUserAccountFormErrors } from './account-settings';
import {
  DELETE_USER_ACCOUNT_INTENT,
  UPDATE_USER_ACCOUNT_INTENT,
} from './account-settings-constants';
import { updateUserAccountFormSchema } from './account-settings-schemas';
import type { Route } from '.react-router/types/app/routes/settings+/+types/account';

const schema = z.discriminatedUnion('intent', [
  updateUserAccountFormSchema,
  z.object({ intent: z.literal(DELETE_USER_ACCOUNT_INTENT) }),
]);

export async function accountSettingsAction({ request }: Route.ActionArgs) {
  try {
    const { auth, t } = await promiseHash({
      auth: requireAuthenticatedUserWithMembershipsExists(request),
      t: i18next.getFixedT(request, 'user-accounts', {
        keyPrefix: 'settings.account.toast',
      }),
    });
    const { user, headers } = auth;
    const body = await validateFormData(request, schema);

    switch (body.intent) {
      case UPDATE_USER_ACCOUNT_INTENT: {
        if (body.name && body.name !== user.name) {
          await updateUserAccountInDatabaseById({
            id: user.id,
            user: { name: body.name },
          });
        }

        const toastHeaders = await createToastHeaders({
          title: t('user-account-updated'),
          type: 'success',
        });
        return data({}, { headers: combineHeaders(headers, toastHeaders) });
      }

      case DELETE_USER_ACCOUNT_INTENT: {
        // Check if user is an owner of any organizations with other members
        const orgsBlockingDeletion = user.memberships.filter(
          membership =>
            membership.role === 'owner' &&
            membership.organization._count.memberships > 1,
        );

        if (orgsBlockingDeletion.length > 0) {
          return badRequest({
            error:
              'Cannot delete account while owner of organizations with other members',
          });
        }

        // Delete organizations where user is the sole owner (only member)
        const soleOwnerOrgs = user.memberships.filter(
          membership =>
            membership.role === 'owner' &&
            membership.organization._count.memberships === 1,
        );

        await Promise.all(
          soleOwnerOrgs.map(membership =>
            deleteOrganizationFromDatabaseById(membership.organization.id),
          ),
        );

        // Delete the user account (this will cascade delete their memberships)
        await deleteUserAccountFromDatabaseById(user.id);
        await auth.supabase.auth.signOut();
        await auth.supabase.auth.admin.deleteUser(user.supabaseUserId);

        return redirectWithToast(
          '/',
          {
            title: t('user-account-deleted'),
            type: 'success',
          },
          { headers },
        );
      }
    }
  } catch (error) {
    if (
      getIsDataWithResponseInit<{ errors: UpdateUserAccountFormErrors }>(error)
    ) {
      return error;
    }

    throw error;
  }
}
