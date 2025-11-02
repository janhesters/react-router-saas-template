import { useNavigation, useRouteLoaderData } from "react-router";

import type { ColorScheme } from "./color-scheme-constants";
import { COLOR_SCHEME_FORM_KEY, colorSchemes } from "./color-scheme-constants";
import type { loader as rootLoader } from "~/root";

export function useColorScheme(): ColorScheme {
  const rootLoaderData = useRouteLoaderData<typeof rootLoader>("root");

  const { formData } = useNavigation();
  const optimisticColorScheme = formData?.get(
    COLOR_SCHEME_FORM_KEY,
  ) as ColorScheme | null;

  return (
    optimisticColorScheme ?? rootLoaderData?.colorScheme ?? colorSchemes.system
  );
}
