import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { MiddlewareFunction } from "react-router";
import { createContext, href, redirect } from "react-router";
import { safeRedirect } from "remix-utils/safe-redirect";

import { createSupabaseServerClient } from "./supabase.server";

export const authContext = createContext<{
  supabase: SupabaseClient;
  user: User;
  headers: Headers;
}>();

export const authMiddleware: MiddlewareFunction = async (
  { request, context },
  next,
) => {
  const { supabase, headers } = createSupabaseServerClient({ request });
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    const redirectTo = new URL(request.url).pathname;
    const searchParameters = new URLSearchParams([["redirectTo", redirectTo]]);
    throw redirect(safeRedirect(`/login?${searchParameters.toString()}`), {
      headers,
    });
  }

  context.set(authContext, { headers, supabase, user });

  return await next();
};

export const anonymousContext = createContext<{
  supabase: SupabaseClient;
  headers: Headers;
}>();

export const anonymousMiddleware: MiddlewareFunction = async (
  { request, context },
  next,
) => {
  const { supabase, headers } = createSupabaseServerClient({ request });
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (!error && user) {
    throw redirect(href("/organizations"), { headers });
  }

  context.set(anonymousContext, { headers, supabase });

  return await next();
};
