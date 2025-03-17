import type { RequestHandler } from 'msw';

import { supabaseAuthHandlers } from './auth';

export const supabaseHandlers: RequestHandler[] = [...supabaseAuthHandlers];

export { createRateLimitedEmail } from './auth';
