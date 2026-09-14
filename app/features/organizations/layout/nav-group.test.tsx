/* oxlint-disable typescript/no-non-null-assertion -- Test code */
import { faker } from "@faker-js/faker";
import { IconHome, IconSettings } from "@tabler/icons-react";
import userEvent from "@testing-library/user-event";
import { createRoutesStub } from "react-router";
import { describe, expect, test } from "vitest";

import type { NavGroupItemWithoutChildren, NavGroupProps } from "./nav-group";
import { NavGroup } from "./nav-group";
import { SidebarProvider } from "~/components/ui/sidebar";
import { render, screen } from "~/test/react-test-utils";
import type { Factory } from "~/utils/types";

const createNavGroupItemWithoutChildren: Factory<
  NavGroupItemWithoutChildren
> = ({
  icon = faker.helpers.arrayElement([IconHome, IconSettings]),
  title = faker.lorem.words(2),
  url = faker.helpers.arrayElement([
    "/account",
    "/dashboard",
    "/home",
    "/profile",
    "/settings",
  ]),
} = {}) => ({ icon, title, url });

const createItemsWithoutChildren = (
  length: number,
): NavGroupItemWithoutChildren[] =>
  faker.helpers
    .uniqueArray(() => createNavGroupItemWithoutChildren().url, length)
    .map((url) => createNavGroupItemWithoutChildren({ url }));

const createProps: Factory<NavGroupProps> = ({
  className = faker.lorem.word(),
  items = createItemsWithoutChildren(2),
  size = "default",
  title,
} = {}) => ({ className, items, size, title });

describe("NavGroup Component", () => {
  test("given: items with icons, should: render navigation group with title and items", () => {
    const title = faker.lorem.words(3);
    const props = createProps({ title });
    const path = "/test";
    const RouterStub = createRoutesStub([
      { Component: () => <NavGroup {...props} />, path },
    ]);

    render(
      <SidebarProvider>
        <RouterStub initialEntries={[path]} />
      </SidebarProvider>,
    );

    // Verify title is rendered.
    expect(screen.getByText(title)).toBeInTheDocument();

    // Verify all items are rendered.
    for (const item of props.items) {
      expect(screen.getByText(item.title)).toBeInTheDocument();
      if ("url" in item) {
        const link = screen.getByRole("link", { name: item.title });
        expect(link).toHaveAttribute("href", item.url);
        expect(link.querySelector("a, button")).toBeNull();
      }
    }
  });

  test("given: collapsible items, should: render collapsible navigation group and expand on click", async () => {
    const user = userEvent.setup();
    const props = createProps({
      items: [
        {
          icon: IconSettings,
          items: [
            { title: "Profile", url: "/settings/profile" },
            { title: "Security", url: "/settings/security" },
          ],
          title: "Settings",
        },
      ],
    });
    const path = "/test";
    const RouterStub = createRoutesStub([
      { Component: () => <NavGroup {...props} />, path },
    ]);

    render(
      <SidebarProvider>
        <RouterStub initialEntries={[path]} />
      </SidebarProvider>,
    );

    // Verify parent item is rendered
    const settingsButton = screen.getByRole("button", { name: /settings/i });
    expect(settingsButton).toBeInTheDocument();

    // Verify child items are initially hidden
    expect(screen.queryByText("Profile")).not.toBeInTheDocument();
    expect(screen.queryByText("Security")).not.toBeInTheDocument();

    // Click the settings button to expand
    await user.click(settingsButton);

    // Verify child items are now visible
    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(screen.getByText("Security")).toBeInTheDocument();

    for (const title of ["Profile", "Security"]) {
      const link = screen.getByRole("link", { name: title });
      expect(link.querySelector("a, button")).toBeNull();
    }
  });

  test.each([
    ["/settings/profile", "Settings"],
    ["/settings-other", undefined],
    ["/", "Home"],
  ])(
    "given: route %s, should: preserve NavLink matching and external links",
    (path, activeTitle) => {
      const props = createProps({
        items: [
          { title: "Home", url: "/" },
          { title: "Settings", url: "/settings" },
          { title: "Documentation", url: "https://example.com/docs" },
        ],
      });
      const RouterStub = createRoutesStub([
        { Component: () => <NavGroup {...props} />, path: "*" },
      ]);

      render(
        <SidebarProvider>
          <RouterStub initialEntries={[path]} />
        </SidebarProvider>,
      );

      for (const title of ["Home", "Settings", "Documentation"]) {
        const link = screen.getByRole("link", { name: title });
        if (title === activeTitle) {
          expect(link).toHaveAttribute("aria-current", "page");
        } else {
          expect(link).not.toHaveAttribute("aria-current");
        }
        expect(link.querySelector("a, button")).toBeNull();
      }
      expect(
        screen.getByRole("link", { name: "Documentation" }),
      ).toHaveAttribute("href", "https://example.com/docs");
    },
  );

  test.each(["/settings/profile", "/settings/profile/details"])(
    "given: child route %s, should: highlight submenu links only for exact matches",
    async (path) => {
      const user = userEvent.setup();
      const childPath = "/settings/profile";
      const props = createProps({
        items: [
          {
            items: [{ title: "Profile", url: childPath }],
            title: "Settings",
          },
        ],
      });
      const RouterStub = createRoutesStub([
        { Component: () => <NavGroup {...props} />, path: "*" },
      ]);

      render(
        <SidebarProvider>
          <RouterStub initialEntries={[path]} />
        </SidebarProvider>,
      );

      if (path !== childPath) {
        await user.click(screen.getByRole("button", { name: "Settings" }));
      }
      const link = screen.getByRole("link", { name: "Profile" });
      expect(link).toHaveAttribute("href", childPath);
      expect(link.querySelector("a, button")).toBeNull();
      if (path === childPath) {
        expect(link).toHaveAttribute("aria-current", "page");
      } else {
        expect(link).not.toHaveAttribute("aria-current");
      }
    },
  );

  test("given: a collapsed sidebar, should: keep navigation links and their tooltips on the same element", async () => {
    const user = userEvent.setup();
    const path = "/settings";
    const props = createProps({
      items: [{ title: "Settings", url: path }],
    });
    const RouterStub = createRoutesStub([
      { Component: () => <NavGroup {...props} />, path },
    ]);

    render(
      <SidebarProvider defaultOpen={false}>
        <RouterStub initialEntries={[path]} />
      </SidebarProvider>,
    );

    const link = screen.getByRole("link", { name: "Settings" });
    expect(link).toHaveAttribute("href", path);
    expect(link).toHaveAttribute("aria-current", "page");
    expect(link.querySelector("a, button")).toBeNull();
    await user.hover(link);
    expect(
      await screen.findByText("Settings", {
        selector: '[data-slot="tooltip-content"]',
      }),
    ).toBeVisible();
  });

  test("given: an active route, should: highlight the active navigation item", () => {
    const items = createItemsWithoutChildren(2);
    const props = createProps({ items });
    const path = items[0]!.url;
    const RouterStub = createRoutesStub([
      { Component: () => <NavGroup {...props} />, path },
    ]);

    render(
      <SidebarProvider>
        <RouterStub initialEntries={[path]} />
      </SidebarProvider>,
    );

    const homeLink = screen.getByRole("link", { name: items[0]!.title });
    expect(homeLink).toHaveAttribute("aria-current", "page");

    const settingsLink = screen.getByRole("link", { name: items[1]!.title });
    expect(settingsLink).not.toHaveAttribute("aria-current");
  });

  test("given: no title, should: render navigation group without title", () => {
    const props = createProps();
    const path = "/test";
    const RouterStub = createRoutesStub([
      { Component: () => <NavGroup {...props} />, path },
    ]);

    // This is a workaround and an absolute exception to check if the title
    // is NOT rendered.
    const { container } = render(
      <SidebarProvider>
        <RouterStub initialEntries={[path]} />
      </SidebarProvider>,
    );

    // Verify title is NOT rendered.
    expect(
      container.querySelector('[data-slot="sidebar-group-label"]'),
    ).not.toBeInTheDocument();
  });

  test("given: custom className, should: apply the className to the navigation group", () => {
    const props = createProps();
    const path = "/test";
    const RouterStub = createRoutesStub([
      { Component: () => <NavGroup {...props} />, path },
    ]);

    const { container } = render(
      <SidebarProvider>
        <RouterStub initialEntries={[path]} />
      </SidebarProvider>,
    );

    expect(container.firstChild?.firstChild).toHaveClass(props.className!);
  });
});
