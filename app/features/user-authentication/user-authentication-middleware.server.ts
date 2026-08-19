import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { MiddlewareFunction } from "react-router";
import { createContext, href, redirect } from "react-router";
import { safeRedirect } from "remix-utils/safe-redirect";

import { createSupabaseServerClient } from "./supabase.server";

export const authContext = createContext<{
  supabase: SupabaseClient;
  user: User;
}>();

export const authMiddleware: MiddlewareFunction = async (
  { request, context, url },
  next,
) => {
  const { supabase, headers } = createSupabaseServerClient({ request });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    const redirectTo = url.pathname;
    const searchParameters = new URLSearchParams([["redirectTo", redirectTo]]);
    throw redirect(safeRedirect(`/login?${searchParameters.toString()}`), {
      headers,
    });
  }

  context.set(authContext, { supabase, user });

  const response = (await next()) as Response;

  for (const [key, value] of headers.entries()) {
    response.headers.append(key, value);
  }

  return response;
};

export const anonymousContext = createContext<{
  supabase: SupabaseClient;
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

  context.set(anonymousContext, { supabase });

  const response = (await next()) as Response;

  for (const [key, value] of headers.entries()) {
    response.headers.append(key, value);
  }

  return response;
};
