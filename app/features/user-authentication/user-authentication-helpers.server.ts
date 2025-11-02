import { redirect } from "react-router";
import { safeRedirect } from "remix-utils/safe-redirect";

import { createSupabaseServerClient } from "./supabase.server";

/**
 * Logs out the current user by signing them out of Supabase auth.
 *
 * @param request - The incoming request object.
 * @param redirectTo - The path to redirect to after logout (defaults to root).
 * @returns Redirect response to the login page.
 */
export async function logout(request: Request, redirectTo = "/") {
  const { supabase, headers } = createSupabaseServerClient({ request });
  await supabase.auth.signOut();
  return redirect(safeRedirect(redirectTo), { headers });
}
