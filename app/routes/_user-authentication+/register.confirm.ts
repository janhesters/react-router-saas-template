import { redirect } from 'react-router';

import { saveUserAccountToDatabase } from '~/features/user-accounts/user-accounts-model.server';
import { requireUserIsAnonymous } from '~/features/user-authentication/user-authentication-helpers.server';
import { getErrorMessage } from '~/utils/get-error-message';
import { getSearchParameterFromRequest } from '~/utils/get-search-parameter-from-request.server';

import type { Route } from './+types/register.confirm';

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase, headers } = await requireUserIsAnonymous(request);

  const tokenHash = getSearchParameterFromRequest('token_hash')(request);

  const {
    data: { user },
    error,
  } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: 'email',
  });

  if (error) {
    throw error;
  }

  if (!user?.email || !user.id) {
    throw new Error('User not found');
  }

  try {
    await saveUserAccountToDatabase({
      email: user.email,
      supabaseUserId: user.id,
    });
  } catch (error) {
    const message = getErrorMessage(error);

    if (message.includes('Unique constraint failed on the fields')) {
      // Do nothing, the user already exists and we can safely redirect to the
      // onboarding page. This case happens for example when the user
      // accidentally clicks the verification link twice.
    } else {
      throw error;
    }
  }

  return redirect('/onboarding', { headers });
}
