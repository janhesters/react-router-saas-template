import type { Config } from "@react-router/dev/config";

export default {
  future: {
    unstable_optimizeDeps: true,
    unstable_splitRouteModules: "enforce",
    unstable_subResourceIntegrity: true,
    unstable_viteEnvironmentApi: true,
    v8_middleware: true,
  },
  ssr: true,
} satisfies Config;
