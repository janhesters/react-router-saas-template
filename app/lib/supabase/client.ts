import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    window.ENV.VITE_SUPABASE_URL,
    window.ENV.VITE_SUPABASE_PUBLISHABLE_KEY,
  );
}
