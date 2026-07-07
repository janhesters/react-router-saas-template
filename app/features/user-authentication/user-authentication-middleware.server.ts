import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import type { MiddlewareFunction } from "react-router";
import { createContext, href, redirect } from "react-router";
import { safeRedirect } from "remix-utils/safe-redirect";

import { createSupabaseServerClient } from "./supabase.server";

export const authContext = createContext<{
  supabase: SupabaseClient;
  user: User;
}>();

const EXP_BUFFER_SEC = 60;

function isSessionFresh(
  session: Session | null | undefined,
): session is Session {
  if (!session) return false;
  const now = Math.floor(Date.now() / 1000);
  // prefer expires_at, else compute from expires_in if you persisted it
  const exp = session.expires_at ?? now + (session.expires_in ?? 0);
  return exp > now + EXP_BUFFER_SEC;
}

export const authMiddleware: MiddlewareFunction = async (
  { request, context, url },
  next,
) => {
  const { supabase, headers } = createSupabaseServerClient({ request });

  if (request.method === "GET" || request.method === "HEAD") {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (isSessionFresh(session)) {
      context.set(authContext, { supabase, user: session.user });

      const response = (await next()) as Response;

      for (const [key, value] of headers.entries()) {
        response.headers.append(key, value);
      }

      return response;
    }
  }

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
