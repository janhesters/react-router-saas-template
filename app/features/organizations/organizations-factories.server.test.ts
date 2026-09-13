import { faker } from "@faker-js/faker";
import { afterEach, describe, expect, test, vi } from "vitest";

import { createPopulatedOrganization } from "./organizations-factories.server";
import { slugify } from "~/utils/slugify.server";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createPopulatedOrganization()", () => {
  test("given: repeated company names, should: generate distinct organization slugs", () => {
    vi.spyOn(faker.company, "name").mockReturnValue("Repeated Company");

    const organizations = Array.from({ length: 20 }, () =>
      createPopulatedOrganization(),
    );

    expect(new Set(organizations.map(({ slug }) => slug)).size).toBe(20);
    for (const organization of organizations) {
      expect(organization.name).toBe("Repeated Company");
      expect(organization.slug).toBe(slugify(organization.slug));
    }
  });

  test("given: an explicit colliding slug, should: preserve the override", () => {
    const slug = "existing-company";

    expect(createPopulatedOrganization({ slug }).slug).toBe(slug);
    expect(createPopulatedOrganization({ slug }).slug).toBe(slug);
  });
});
