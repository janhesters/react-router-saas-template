import path from "node:path";
import type { Route } from "@playwright/test";
import { test as base, expect } from "@playwright/test";

import { MOCK_STORAGE_DIR } from "~/test/mocks/handlers/supabase/mock-storage";

export { expect } from "@playwright/test";

export const test = base.extend<{ externalImageRequests: string[] }>({
  externalImageRequests: [
    async ({ baseURL, context }, use) => {
      const externalImageRequests: string[] = [];
      const appOrigin = new URL(baseURL ?? "http://localhost:3000").origin;
      const storageOrigin = new URL(process.env.VITE_SUPABASE_URL).origin;

      const handleRoute = async (route: Route) => {
        const request = route.request();
        const url = new URL(request.url());

        if (request.resourceType() !== "image") {
          await route.fallback();
          return;
        }

        // The server's MSW upload handlers persist these actual uploaded bytes.
        // Browser requests need their own mock because server MSW cannot see them.
        const storagePrefix = "/storage/v1/object/public/";
        if (
          url.origin === storageOrigin &&
          url.pathname.startsWith(storagePrefix)
        ) {
          const objectPath = decodeURIComponent(
            url.pathname.slice(storagePrefix.length),
          );
          const filePath = path.resolve(MOCK_STORAGE_DIR, objectPath);
          expect(filePath.startsWith(`${MOCK_STORAGE_DIR}${path.sep}`)).toBe(
            true,
          );
          await route.fulfill({ path: filePath });
          return;
        }

        if (url.origin !== appOrigin) {
          externalImageRequests.push(request.url());
          await route.abort("blockedbyclient");
          return;
        }

        await route.fallback();
      };

      await context.route("**/*", handleRoute);
      await use(externalImageRequests);
      await context.unroute("**/*", handleRoute);
      expect(
        externalImageRequests,
        "Use TEST_IMAGE_DATA_URL for rendered fixtures or explicitly mock the provider image request.",
      ).toEqual([]);
    },
    { auto: true },
  ],
});
