import { config } from 'dotenv';
import { afterAll } from 'vitest';

import { clearMockSessions } from './mocks/handlers/supabase/mock-sessions';

// Load environment variables from .env file.
config();

// Clear mock sessions after all tests are run.
afterAll(async () => {
  await clearMockSessions();
});
