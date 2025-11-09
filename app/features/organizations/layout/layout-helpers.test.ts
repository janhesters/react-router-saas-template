import type { UIMatch } from "react-router";
import { describe, expect, test } from "vitest";

import { findBreadcrumbs } from "./layout-helpers";

describe("findBreadcrumbs()", () => {
  test("given an array of matches: returns all breadcrumbs from matches", () => {
    const matches: UIMatch<
      { breadcrump?: { title: string; to: string } } & Record<string, unknown>
    >[] = [
      {
        data: {},
        handle: {},
        id: "root",
        loaderData: {},
        params: { organizationSlug: "tromp---schinner" },
        pathname: "/",
      },
      {
        data: {
          breadcrump: {
            title: "Organization",
            to: "/organizations/tromp---schinner",
          },
        },
        handle: {},
        id: "routes/organization_.$organizationSlug",
        loaderData: {
          breadcrump: {
            title: "Organization",
            to: "/organizations/tromp---schinner",
          },
        },
        params: { organizationSlug: "tromp---schinner" },
        pathname: "/organizations/tromp---schinner",
      },
      {
        data: {
          breadcrump: {
            title: "Dashboard",
            to: "/organizations/tromp---schinner/dashboard",
          },
        },
        handle: {},
        id: "routes/organization_.$organizationSlug.dashboard",
        loaderData: {
          breadcrump: {
            title: "Dashboard",
            to: "/organizations/tromp---schinner/dashboard",
          },
        },
        params: { organizationSlug: "tromp---schinner" },
        pathname: "/organizations/tromp---schinner/dashboard",
      },
    ];

    const actual = findBreadcrumbs(matches);
    const expected = [
      {
        title: "Organization",
        to: "/organizations/tromp---schinner",
      },
      {
        title: "Dashboard",
        to: "/organizations/tromp---schinner/dashboard",
      },
    ];

    expect(actual).toEqual(expected);
  });

  test("given matches with no breadcrumbs: returns empty array", () => {
    const matches: UIMatch<
      { breadcrump?: { title: string; to: string } } & Record<string, unknown>
    >[] = [
      {
        data: {},
        handle: {},
        id: "root",
        loaderData: {},
        params: {},
        pathname: "/",
      },
      {
        data: { someOtherData: "value" },
        handle: {},
        id: "routes/some-route",
        loaderData: { someOtherData: "value" },
        params: {},
        pathname: "/some-route",
      },
    ];

    const actual = findBreadcrumbs(matches);
    const expected: { title: string; to: string }[] = [];

    expect(actual).toEqual(expected);
  });

  test("given matches with some breadcrumbs: returns only those with breadcrumbs", () => {
    const matches: UIMatch<
      { breadcrump?: { title: string; to: string } } & Record<string, unknown>
    >[] = [
      {
        data: {},
        handle: {},
        id: "root",
        loaderData: {},
        params: {},
        pathname: "/",
      },
      {
        data: {
          breadcrump: {
            title: "First",
            to: "/first",
          },
        },
        handle: {},
        id: "routes/first",
        loaderData: {
          breadcrump: {
            title: "First",
            to: "/first",
          },
        },
        params: {},
        pathname: "/first",
      },
      {
        data: { someOtherData: "value" },
        handle: {},
        id: "routes/middle",
        loaderData: { someOtherData: "value" },
        params: {},
        pathname: "/first/middle",
      },
      {
        data: {
          breadcrump: {
            title: "Last",
            to: "/first/middle/last",
          },
        },
        handle: {},
        id: "routes/last",
        loaderData: {
          breadcrump: {
            title: "Last",
            to: "/first/middle/last",
          },
        },
        params: {},
        pathname: "/first/middle/last",
      },
    ];

    const actual = findBreadcrumbs(matches);
    const expected = [
      {
        title: "First",
        to: "/first",
      },
      {
        title: "Last",
        to: "/first/middle/last",
      },
    ];

    expect(actual).toEqual(expected);
  });
});
