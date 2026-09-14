import { parseSubmission, report } from "@conform-to/react/future";
import { useActionData } from "react-router";
import { describe, expect, test, vi } from "vitest";

import { DangerZone } from "./danger-zone";
import {
  createRoutesStub,
  render,
  screen,
  userEvent,
  waitFor,
} from "~/test/react-test-utils";

const organizationName = "Acme Studio";

function renderDangerZone(action = vi.fn(() => ({ result: undefined }))) {
  const RouterStub = createRoutesStub([
    {
      action,
      Component: () => (
        <DangerZone
          lastResult={useActionData()?.result}
          organizationName={organizationName}
        />
      ),
      path: "/",
    },
  ]);
  render(<RouterStub initialEntries={["/"]} />);
}

describe("DangerZone component", () => {
  test("given: an owner opens deletion, should: require the exact organization name before submitting", async () => {
    const user = userEvent.setup();
    const action = vi.fn(() => ({ result: undefined }));
    renderDangerZone(action);

    await user.click(
      screen.getByRole("button", { name: /^delete organization$/i }),
    );
    const confirmation = screen.getByRole("textbox", {
      name: /to confirm, type/i,
    });
    await user.type(confirmation, "acme studio");
    await user.click(
      screen.getByRole("button", { name: /delete this organization/i }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "The confirmation text doesn't match the organization name.",
    );
    expect(action).not.toHaveBeenCalled();

    await user.clear(confirmation);
    await user.type(confirmation, organizationName);
    await user.click(
      screen.getByRole("button", { name: /delete this organization/i }),
    );
    await waitFor(() => expect(action).toHaveBeenCalledOnce());
  });

  test("given: an owner cancels deletion, should: close the dialog without submitting", async () => {
    const user = userEvent.setup();
    const action = vi.fn(() => ({ result: undefined }));
    renderDangerZone(action);
    await user.click(
      screen.getByRole("button", { name: /^delete organization$/i }),
    );
    await user.type(
      screen.getByRole("textbox", { name: /to confirm, type/i }),
      organizationName,
    );
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(action).not.toHaveBeenCalled();
  });

  test("given: a server form error, should: display the error in the open deletion dialog", async () => {
    const user = userEvent.setup();
    const RouterStub = createRoutesStub([
      {
        action: async ({ request }) => ({
          result: report(parseSubmission(await request.formData()), {
            error: {
              fieldErrors: {},
              formErrors: ["Deletion could not start. Please retry."],
            },
          }),
        }),
        Component: () => (
          <DangerZone
            lastResult={useActionData()?.result}
            organizationName={organizationName}
          />
        ),
        path: "/",
      },
    ]);
    render(<RouterStub initialEntries={["/"]} />);
    await user.click(
      screen.getByRole("button", { name: /^delete organization$/i }),
    );
    await user.type(
      screen.getByRole("textbox", { name: /to confirm, type/i }),
      organizationName,
    );
    await user.click(
      screen.getByRole("button", { name: /delete this organization/i }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Deletion could not start. Please retry.",
    );
    expect(screen.getByRole("dialog")).toBeVisible();
  });
});
