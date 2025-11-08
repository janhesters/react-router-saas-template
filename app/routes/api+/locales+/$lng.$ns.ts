import { cacheHeader } from "pretty-cache-header";
import { data } from "react-router";
import { z } from "zod";

import type { Route } from "./+types/$lng.$ns";
import resources from "~/features/localization/locales";
import { badRequest } from "~/utils/http-responses.server";

export async function loader({ params }: Route.LoaderArgs) {
  const lng = z
    .enum(Object.keys(resources) as Array<keyof typeof resources>)
    .safeParse(params.lng);

  if (lng.error) {
    return badRequest({ error: lng.error });
  }

  const namespaces = resources[lng.data];

  const ns = z
    .enum(Object.keys(namespaces) as Array<keyof typeof namespaces>)
    .safeParse(params.ns);

  if (ns.error) {
    return badRequest({ error: ns.error });
  }

  const headers = new Headers();

  // On production, we want to add cache headers to the response
  if (process.env.NODE_ENV === "production") {
    headers.set(
      "Cache-Control",
      cacheHeader({
        maxAge: "5m", // Cache in the browser for 5 minutes
        sMaxage: "1d", // Cache in the CDN for 1 day
        // Serve stale content if there's an error for 7 days
        staleIfError: "7d",
        // Serve stale content while revalidating for 7 days
        staleWhileRevalidate: "7d",
      }),
    );
  }

  return data(namespaces[ns.data], { headers });
}
