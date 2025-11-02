import {
  createServerClient,
  parseCookieHeader,
  serializeCookieHeader,
} from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

export function createSupabaseServerClient({ request }: { request: Request }) {
  const headers = new Headers();

  const supabase = createServerClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY,
    {
      auth: { flowType: "pkce" },
      cookies: {
        getAll() {
          return parseCookieHeader(request.headers.get("Cookie") ?? "") as {
            name: string;
            value: string;
          }[];
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet)
            headers.append(
              "Set-Cookie",
              serializeCookieHeader(name, value, options),
            );
        },
      },
    },
  );

  return { headers, supabase };
}

export const supabaseAdminClient = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);
