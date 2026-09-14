import { reactRouter } from "@react-router/dev/vite";
import transformImports from "@rolldown/plugin-transform-imports";
import tailwindcss from "@tailwindcss/vite";
import type { Plugin } from "vite";
import { defineConfig } from "vite";
import { defineConfig as defineVitestConfig } from "vitest/config";

// Custom plugin to handle .sudo files
const sudoFilesPlugin = {
  name: "sudo-files",
  transform: {
    filter: { id: /\.sudo$/ },
    handler(code: string) {
      return {
        code: `export default ${JSON.stringify(code)}`,
        map: undefined,
      };
    },
  },
};

/**
 * Vite plugin to add cache headers for static assets during development
 */
function staticCacheHeaders(): Plugin {
  return {
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        // Cache font files for 1 year in development
        if (request.url?.startsWith("/fonts/")) {
          response.setHeader(
            "Cache-Control",
            "public, max-age=31536000, immutable",
          );
        }
        next();
      });
    },
    name: "static-cache-headers",
  };
}

const rootConfig = defineConfig({
  // Skip unused re-exports in dependencies declared free of side effects.
  build: { rolldownOptions: { experimental: { lazyBarrel: true } } },
  plugins: [
    // Avoid resolving full dependency barrels through React Router's build hooks.
    transformImports({
      "@tabler/icons-react": {
        preventFullImport: true,
        transform: "@tabler/icons-react/dist/esm/icons/{{member}}.mjs",
      },
      "date-fns": {
        preventFullImport: true,
        transform: [
          ["^formatDate$", "date-fns/format"],
          ["*", "date-fns/{{member}}"],
        ],
      },
    }),
    tailwindcss(),
    !process.env.VITEST && reactRouter(),
    staticCacheHeaders(),
    sudoFilesPlugin,
  ],
  resolve: { tsconfigPaths: true },
  server: { port: Number(process.env.PORT ?? 3000), strictPort: true },
});

const testConfig = defineVitestConfig({
  test: {
    projects: [
      {
        ...rootConfig,
        test: {
          env: { TZ: "UTC" },
          include: ["app/**/*.test.ts"],
          name: "unit-tests",
        },
      },
      {
        ...rootConfig,
        test: {
          env: { TZ: "UTC" },
          globalSetup: "app/test/vitest.global-setup.ts",
          include: ["app/**/*.spec.ts"],
          name: "integration-tests",
          setupFiles: ["app/test/setup-server-test-environment.ts"],
        },
      },
      {
        ...rootConfig,
        test: {
          env: { TZ: "UTC" },
          environment: "happy-dom",
          include: ["app/**/*.test.tsx"],
          name: "react-happy-dom-tests",
          setupFiles: ["app/test/setup-browser-test-environment.ts"],
        },
      },
    ],
  },
});

export default defineConfig({ ...rootConfig, ...testConfig });
