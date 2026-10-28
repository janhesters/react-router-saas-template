import type { Config } from "@react-router/dev/config";

import { getAllowedActionOrigins } from "./app/utils/allowed-action-origins";

export default {
  // Read at build time. A proxy that terminates TLS makes `react-router-serve`
  // see `http://` request URLs while browsers send `Origin: https://...`, so
  // forms only work on the hosts listed here. See "Trusted hosts for forms" in
  // the README.
  allowedActionOrigins: getAllowedActionOrigins({
    additionalHosts: process.env.ADDITIONAL_ACTION_ORIGINS,
    appUrl: process.env.APP_URL,
  }),
  future: {
    // unstable_optimizeDeps: true,
    // unstable_splitRouteModules: "enforce",
    // unstable_subResourceIntegrity: true,
    // unstable_viteEnvironmentApi: true,
  },
  ssr: true,
} satisfies Config;
