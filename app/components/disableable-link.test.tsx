import { describe, expect, test } from "vitest";

import type { DisableableLinkComponentProps } from "./disableable-link";
import { DisableableLink } from "./disableable-link";
import { createRoutesStub, render, screen } from "~/test/react-test-utils";
import type { Factory } from "~/utils/types";

const createProps: Factory<DisableableLinkComponentProps> = ({
  children = "Click Me",
  disabled = false,
  to = "/test",
  ...rest
} = {}) => ({ children, disabled, to, ...rest });

describe("DisableableLink component", () => {
  test("given: the link is enabled, should: render a link", () => {
    const props = createProps();
    const RouterStub = createRoutesStub([
      { Component: () => <DisableableLink {...props} />, path: "/" },
    ]);

    render(<RouterStub />);

    expect(screen.getByRole("link", { name: /click me/i })).toHaveAttribute(
      "href",
      props.to,
    );
  });

  test("given: the link is disabled, should: NOT render a link", () => {
    const props = createProps({ disabled: true });
    const RouterStub = createRoutesStub([
      { Component: () => <DisableableLink {...props} />, path: "/" },
    ]);

    render(<RouterStub />);

    expect(
      screen.queryByRole("link", { name: /click me/i }),
    ).not.toBeInTheDocument();
  });
});
