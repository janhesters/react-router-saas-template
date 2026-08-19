import { config } from "dotenv";

import { clearMockSessions } from "./mocks/handlers/supabase/mock-sessions";
import { ensureStripeProductsAndPricesExist } from "./test-utils";

// Load environment variables from .env file.
config();

let teardownHappened = false;

export default async function setupVitest() {
  await ensureStripeProductsAndPricesExist();

  // Clear mock sessions after all tests are run.
  return async function teardownVitest() {
    if (!teardownHappened) {
      teardownHappened = true;
      await clearMockSessions();
    }
  };
}
