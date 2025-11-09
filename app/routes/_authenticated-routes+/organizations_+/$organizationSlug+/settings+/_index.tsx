import { useLayoutEffect } from "react";
import { href, redirect, useNavigate } from "react-router";

import type { Route } from "./+types/_index";

export function clientLoader({ params }: Route.ComponentProps) {
  const mediaQuery = window.matchMedia("(max-width: 768px)");

  if (mediaQuery.matches) {
    return { mediaQuery };
  }

  return redirect(
    href("/organizations/:organizationSlug/settings/general", {
      organizationSlug: params.organizationSlug,
    }),
  );
}

export default function OrganizationSettingsIndexRoute({
  loaderData,
  params,
}: Route.ComponentProps) {
  const navigate = useNavigate();

  useLayoutEffect(() => {
    function listener(event: MediaQueryListEvent) {
      if (event.matches) {
        return;
      }

      navigate(
        href("/organizations/:organizationSlug/settings/general", {
          organizationSlug: params.organizationSlug,
        }),
      );
    }

    loaderData.mediaQuery.addEventListener("change", listener);

    return () => {
      loaderData.mediaQuery.removeEventListener("change", listener);
    };
  });

  return null;
}
