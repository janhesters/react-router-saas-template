import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import type { CreateOrganizationFormCardProps } from "./create-organization-form-card";
import { CreateOrganizationFormCard } from "./create-organization-form-card";
import { createRoutesStub } from "~/test/react-test-utils";
import type { Factory } from "~/utils/types";

const createProps: Factory<CreateOrganizationFormCardProps> = ({
  isCreatingOrganization = false,
  lastResult,
} = {}) => ({ isCreatingOrganization, lastResult });

describe("CreateOrganizationFormCard Component", () => {
  test("given: component renders with default props, should: render a card with name input, logo upload, and submit button", () => {
    const path = "/organizations/new";
    const RouterStub = createRoutesStub([
      { Component: () => <CreateOrganizationFormCard />, path },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Verify card title and description are displayed
    expect(screen.getByText(/create a new organization/i)).toBeInTheDocument();
    expect(
      screen.getByText(/tell us about your organization/i),
    ).toBeInTheDocument();

    // Verify form elements are present
    expect(
      screen.getByPlaceholderText(/organization name/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/^logo$/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create organization/i }),
    ).toHaveAttribute("type", "submit");
  });

  test("given: isCreatingOrganization is true, should: disable form and show loading state", () => {
    const props = createProps({ isCreatingOrganization: true });
    const path = "/organizations/new";
    const RouterStub = createRoutesStub([
      { Component: () => <CreateOrganizationFormCard {...props} />, path },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Verify form elements are disabled
    expect(screen.getByPlaceholderText(/organization name/i)).toBeDisabled();
    expect(screen.getByRole("button")).toBeDisabled();

    // Verify loading indicator is shown
    expect(screen.getByText(/saving/i)).toBeInTheDocument();
  });

  // Note: Error validation is covered by E2E tests.
  // Unit testing error states with Conform requires complex setup that adds little value
  // compared to the comprehensive E2E tests.

  test("given: component renders, should: display terms and privacy links", () => {
    const path = "/organizations/new";
    const RouterStub = createRoutesStub([
      { Component: () => <CreateOrganizationFormCard />, path },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Verify terms and privacy links are present
    expect(
      screen.getByRole("link", { name: /terms of service/i }),
    ).toHaveAttribute("href", "/terms-of-service");
    expect(
      screen.getByRole("link", { name: /privacy policy/i }),
    ).toHaveAttribute("href", "/privacy-policy");
  });
});
