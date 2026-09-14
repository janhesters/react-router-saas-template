import { parseSubmission, report } from "@conform-to/react/future";
import type { ActionFunction } from "react-router";
import { useActionData } from "react-router";
import { describe, expect, test, vi } from "vitest";

import type { DangerZoneProps } from "./danger-zone";
import { DangerZone } from "./danger-zone";
import {
  createRoutesStub,
  render,
  screen,
  userEvent,
  waitFor,
} from "~/test/react-test-utils";

const email = "alex@example.com";

function renderDangerZone({
  action = vi.fn(() => ({ result: undefined })),
  ...props
}: Partial<DangerZoneProps> & {
  action?: ActionFunction;
} = {}) {
  const RouterStub = createRoutesStub([
    {
      action,
      Component: () => (
        <DangerZone
          email={email}
          implicitlyDeletedOrganizations={[]}
          lastResult={useActionData()?.result}
          organizationsBlockingAccountDeletion={[]}
          {...props}
        />
      ),
      path: "/",
    },
  ]);
  render(<RouterStub initialEntries={["/"]} />);
}

describe("DangerZone component", () => {
  test("given: an account without ownership blockers, should: require the exact email address before submitting deletion", async () => {
    const user = userEvent.setup();
    const action = vi.fn(() => ({ result: undefined }));
    renderDangerZone({ action });

    await user.click(screen.getByRole("button", { name: /^delete account$/i }));
    const confirmation = screen.getByRole("textbox", {
      name: /to confirm, type/i,
    });
    await user.type(confirmation, "another@example.com");
    await user.click(
      screen.getByRole("button", { name: /delete this account/i }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "The confirmation text doesn't match your email address.",
    );
    expect(action).not.toHaveBeenCalled();

    await user.clear(confirmation);
    await user.type(confirmation, email);
    await user.click(
      screen.getByRole("button", { name: /delete this account/i }),
    );
    await waitFor(() => expect(action).toHaveBeenCalledOnce());
  });

  test("given: an account owns organizations with no other members, should: identify every organization that will be deleted before confirmation", async () => {
    const user = userEvent.setup();
    renderDangerZone({
      implicitlyDeletedOrganizations: ["Acme Studio", "Personal Workspace"],
    });

    await user.click(screen.getByRole("button", { name: /^delete account$/i }));

    expect(screen.getByRole("dialog")).toHaveTextContent(
      "The following organizations will be deleted: Acme Studio, Personal Workspace",
    );
    expect(screen.getByRole("dialog")).toHaveTextContent(
      "You will lose access immediately. Your memberships will be removed, and organizations with other members will be preserved.",
    );
  });

  test("given: the account is an organization's last active owner with other active members, should: identify the ownership blocker and prevent deletion", async () => {
    const user = userEvent.setup();
    renderDangerZone({
      organizationsBlockingAccountDeletion: ["Shared Workspace"],
    });

    const deleteButton = screen.getByRole("button", {
      name: /^delete account$/i,
    });
    expect(deleteButton).toBeDisabled();
    expect(deleteButton).toHaveAccessibleDescription(
      /You are the last active owner of this organization: Shared Workspace\s*\. Transfer ownership to another member or delete the organization before deleting your account\./,
    );

    await user.click(deleteButton);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("given: an account holder cancels deletion, should: close the dialog without submitting", async () => {
    const user = userEvent.setup();
    const action = vi.fn(() => ({ result: undefined }));
    renderDangerZone({ action });
    await user.click(screen.getByRole("button", { name: /^delete account$/i }));
    await user.type(
      screen.getByRole("textbox", { name: /to confirm, type/i }),
      email,
    );
    await user.click(screen.getByRole("button", { name: /cancel/i }));

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(action).not.toHaveBeenCalled();
  });

  test("given: a server rejects deletion admission, should: display the error and keep the confirmation dialog open", async () => {
    const user = userEvent.setup();
    renderDangerZone({
      action: vi.fn(async ({ request }: { request: Request }) => ({
        result: report(parseSubmission(await request.formData()), {
          error: {
            fieldErrors: {},
            formErrors: ["Deletion could not start. Please retry."],
          },
        }),
      })),
    });
    await user.click(screen.getByRole("button", { name: /^delete account$/i }));
    await user.type(
      screen.getByRole("textbox", { name: /to confirm, type/i }),
      email,
    );
    await user.click(
      screen.getByRole("button", { name: /delete this account/i }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Deletion could not start. Please retry.",
    );
    expect(screen.getByRole("dialog")).toBeVisible();
  });
});
