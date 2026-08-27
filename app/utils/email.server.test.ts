import { HttpResponse, http } from "msw";
import { afterEach, describe, expect, test, vi } from "vitest";

import { setupMockServerLifecycle } from "~/test/msw-test-utils";

const resendEmailEndpoint = "https://api.resend.com/emails";

const server = setupMockServerLifecycle();

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function sendTestEmail({
  html = "<p>Test email</p>",
  subject = "Test subject",
  text = "Test email",
  to = "recipient@example.com",
}: {
  html?: string;
  subject?: string;
  text?: string;
  to?: string;
} = {}) {
  const { sendEmail } = await import("./email.server");

  return sendEmail({ html, subject, text, to });
}

describe("sendEmail()", () => {
  test("given: production has no RESEND_API_KEY, should: return a delivery error without reporting mocked success", async () => {
    vi.stubEnv("EMAIL_MOCKS", undefined);
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("RESEND_API_KEY", undefined);
    vi.stubEnv("RESEND_FROM_EMAIL", "Example <hello@example.com>");
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const result = await sendTestEmail();
    const actual =
      result.status === "error"
        ? {
            error: {
              message: result.error.message,
              name: result.error.name,
              statusCode: result.error.statusCode,
            },
            status: result.status,
          }
        : result;
    const expected = {
      error: {
        message: "Email delivery is currently unavailable. Please try again.",
        name: "EmailConfigurationError",
        statusCode: 503,
      },
      status: "error",
    };

    expect(actual).toEqual(expected);
  });

  test("given: explicit email mocks are enabled in a local or test environment, should: return the configured mock result", async () => {
    vi.stubEnv("EMAIL_MOCKS", "true");
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("RESEND_API_KEY", undefined);
    vi.stubEnv("RESEND_FROM_EMAIL", undefined);
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const result = await sendTestEmail();
    const actual = { fetchCalls: fetchSpy.mock.calls.length, result };
    const expected = {
      fetchCalls: 0,
      result: { data: { id: "mocked" }, status: "success" },
    };

    expect(actual).toEqual(expected);
  });

  test("given: an invite email contains a bearer token and delivery cannot start, should: omit the recipient, content, and token from logs", async () => {
    vi.stubEnv("EMAIL_MOCKS", undefined);
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("RESEND_API_KEY", undefined);
    vi.stubEnv("RESEND_FROM_EMAIL", "Example <hello@example.com>");
    const errorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const recipient = "invitee+private@example.com";
    const subject = "Private invitation subject";
    const token = "private-bearer-token";
    const inviteUrl = `https://app.example.com/organizations/email-invite?token=${token}`;
    const html = `<a href="${inviteUrl}">Secret invitation content</a>`;
    const text = `Secret invitation content: ${inviteUrl}`;

    await sendTestEmail({ html, subject, text, to: recipient });

    const serializedLogs = JSON.stringify(errorSpy.mock.calls);
    const metadata = errorSpy.mock.calls[0]?.[1] as
      | Record<string, unknown>
      | undefined;
    const actual = {
      correlationIdType: typeof metadata?.correlationId,
      failureCategory: metadata?.failureCategory,
      logCount: errorSpy.mock.calls.length,
      logsContainContent: serializedLogs.includes("Secret invitation content"),
      logsContainInviteUrl: serializedLogs.includes(inviteUrl),
      logsContainRecipient: serializedLogs.includes(recipient),
      logsContainSubject: serializedLogs.includes(subject),
      logsContainToken: serializedLogs.includes(token),
      message: errorSpy.mock.calls[0]?.[0],
      provider: metadata?.provider,
    };
    const expected = {
      correlationIdType: "string",
      failureCategory: "configuration",
      logCount: 1,
      logsContainContent: false,
      logsContainInviteUrl: false,
      logsContainRecipient: false,
      logsContainSubject: false,
      logsContainToken: false,
      message: "Email delivery failed.",
      provider: "resend",
    };

    expect(actual).toEqual(expected);
  });

  test("given: Resend accepts an email, should: return the provider email ID", async () => {
    vi.stubEnv("EMAIL_MOCKS", undefined);
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("RESEND_API_KEY", "re_test_server_only");
    vi.stubEnv("RESEND_FROM_EMAIL", "Example <hello@example.com>");
    server.use(
      http.post(resendEmailEndpoint, () =>
        HttpResponse.json({ id: "provider-email-id" }),
      ),
    );

    const actual = await sendTestEmail();
    const expected = {
      data: { id: "provider-email-id" },
      status: "success",
    };

    expect(actual).toEqual(expected);
  });
});
