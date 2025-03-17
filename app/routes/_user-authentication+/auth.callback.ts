import { redirect } from 'react-router';

import {
  retrieveUserAccountFromDatabaseByEmail,
  saveUserAccountToDatabase,
} from '~/features/user-accounts/user-accounts-model.server';
import { requireUserIsAnonymous } from '~/features/user-authentication/user-authentication-helpers.server';
import { getSearchParameterFromRequest } from '~/utils/get-search-parameter-from-request.server';

import type { Route } from './+types/auth.callback';

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase, headers } = await requireUserIsAnonymous(request);

  const code = getSearchParameterFromRequest('code')(request);

  if (!code) {
    throw new Error('Missing code');
  }

  const {
    error,
    data: { user },
  } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error('User not found');
  }

  const { email } = user;

  if (!email) {
    throw new Error('User email not found');
  }

  const maybeUser = await retrieveUserAccountFromDatabaseByEmail(email);

  if (maybeUser) {
    return redirect('/organizations', { headers });
  }

  await saveUserAccountToDatabase({ email, supabaseUserId: user.id });

  return redirect('/onboarding', { headers });
}
