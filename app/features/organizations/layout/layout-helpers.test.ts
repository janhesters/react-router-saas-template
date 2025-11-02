import type { UIMatch } from "react-router";
import { describe, expect, test } from "vitest";

import { findHeaderTitle } from "./layout-helpers";

describe("findHeaderTitle()", () => {
  test("given an array of matches: returns the last item in the array that has a header title", () => {
    const matches: UIMatch<
      { headerTitle?: string } & Record<string, unknown>
    >[] = [
      {
        data: { headerTitle: "wrong-title" },
        handle: {},
        id: "root",
        loaderData: { headerTitle: "wrong-title" },
        params: { organizationSlug: "tromp---schinner" },
        pathname: "/",
      },
      {
        data: { headerTitle: "correct-title" },
        handle: {},
        id: "routes/organization_.$organizationSlug",
        loaderData: { headerTitle: "wrong-title" },
        params: { organizationSlug: "tromp---schinner" },
        pathname: "/organizations/tromp---schinner",
      },
      {
        data: { currentPage: 1, organizationName: "Tromp - Schinner" },
        handle: {},
        id: "routes/organization_.$organizationSlug.recordings",
        loaderData: { headerTitle: "wrong-title" },
        params: { organizationSlug: "tromp---schinner" },
        pathname: "/organizations/tromp---schinner/recordings",
      },
    ];

    const actual = findHeaderTitle(matches);
    const expected = "correct-title";

    expect(actual).toEqual(expected);
  });
});
