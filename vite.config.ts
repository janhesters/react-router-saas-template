import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import type { Plugin } from "vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig as defineVitestConfig } from "vitest/config";

// Custom plugin to handle .sudo files
const sudoFilesPlugin = {
  name: "sudo-files",
  transform(code: string, id: string) {
    if (id.endsWith(".sudo")) {
      return {
        code: `export default ${JSON.stringify(code)}`,
        map: undefined,
      };
    }
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
  plugins: [
    tailwindcss(),
    !process.env.VITEST && reactRouter(),
    tsconfigPaths(),
    staticCacheHeaders(),
    sudoFilesPlugin,
  ],
  resolve: {
    alias: {
      ".prisma/client/index-browser":
        "./node_modules/.prisma/client/index-browser.js",
    },
  },
  server: { port: 3000 },
});

const testConfig = defineVitestConfig({
  test: {
    projects: [
      {
        ...rootConfig,
        test: { include: ["app/**/*.test.ts"], name: "unit-tests" },
      },
      {
        ...rootConfig,
        test: {
          globalSetup: "app/test/vitest.global-setup.ts",
          include: ["app/**/*.spec.ts"],
          name: "integration-tests",
          setupFiles: ["app/test/setup-server-test-environment.ts"],
        },
      },
      {
        ...rootConfig,
        test: {
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
