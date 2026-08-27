/**
 * biome-ignore-all lint/suspicious/noConsole: email delivery failures use
 * structured, allowlisted metadata
 */
import { createId } from "@paralleldrive/cuid2";
import { render } from "@react-email/components";
import type { ReactElement } from "react";
import { z } from "zod";

const emailProvider = "resend";
const internalServerErrorStatusCode = 500;
const mockedEmailId = "mocked";
const serviceUnavailableStatusCode = 503;

const resendErrorSchema = z.object({
  message: z.string(),
  name: z.string(),
  statusCode: z.number(),
});

type EmailDeliveryError = z.infer<typeof resendErrorSchema>;

type EmailDeliveryFailureCategory =
  | "configuration"
  | "invalid-provider-response"
  | "provider-rejected"
  | "rendering"
  | "transport";

const resendSuccessSchema = z.object({
  id: z.string(),
});

function createEmailDeliveryErrorResult({
  correlationId,
  error,
  failureCategory,
}: {
  correlationId: string;
  error: EmailDeliveryError;
  failureCategory: EmailDeliveryFailureCategory;
}) {
  console.error("Email delivery failed.", {
    correlationId,
    failureCategory,
    provider: emailProvider,
  });

  return {
    error: { ...error, correlationId },
    status: "error",
  } as const;
}

export async function sendEmail({
  react,
  ...options
}: {
  to: string;
  subject: string;
} & (
  | { html: string; text: string; react?: never }
  | { react: ReactElement; html?: never; text?: never }
)) {
  const correlationId = createId();
  const emailMocksAreEnabled = process.env.EMAIL_MOCKS === "true";
  const emailMocksAreAllowed =
    emailMocksAreEnabled &&
    ["development", "test"].includes(process.env.NODE_ENV);

  if (emailMocksAreAllowed) {
    return { data: { id: mockedEmailId }, status: "success" } as const;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (emailMocksAreEnabled || !apiKey || !from) {
    return createEmailDeliveryErrorResult({
      correlationId,
      error: {
        message: "Email delivery is currently unavailable. Please try again.",
        name: "EmailConfigurationError",
        statusCode: serviceUnavailableStatusCode,
      },
      failureCategory: "configuration",
    });
  }

  let renderedEmail: Awaited<ReturnType<typeof renderReactEmail>> | undefined;

  try {
    renderedEmail = react ? await renderReactEmail(react) : undefined;
  } catch {
    return createEmailDeliveryErrorResult({
      correlationId,
      error: {
        message: "Email delivery failed. Please try again.",
        name: "EmailRenderingError",
        statusCode: internalServerErrorStatusCode,
      },
      failureCategory: "rendering",
    });
  }

  const email = { from, ...options, ...renderedEmail };
  let response: Response;

  try {
    response = await fetch("https://api.resend.com/emails", {
      body: JSON.stringify(email),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });
  } catch {
    return createEmailDeliveryErrorResult({
      correlationId,
      error: {
        message: "Email delivery failed. Please try again.",
        name: "EmailTransportError",
        statusCode: serviceUnavailableStatusCode,
      },
      failureCategory: "transport",
    });
  }

  let data: unknown;

  try {
    data = await response.json();
  } catch {
    return createEmailDeliveryErrorResult({
      correlationId,
      error: {
        message: "Email delivery failed. Please try again.",
        name: "UnknownError",
        statusCode: internalServerErrorStatusCode,
      },
      failureCategory: "invalid-provider-response",
    });
  }

  const parsedData = resendSuccessSchema.safeParse(data);

  if (response.ok && parsedData.success) {
    return { data: parsedData.data, status: "success" } as const;
  }

  const parseResult = resendErrorSchema.safeParse(data);
  const error = parseResult.success
    ? parseResult.data
    : ({
        message: "Email delivery failed. Please try again.",
        name: "UnknownError",
        statusCode: internalServerErrorStatusCode,
      } satisfies EmailDeliveryError);

  return createEmailDeliveryErrorResult({
    correlationId,
    error,
    failureCategory: response.ok
      ? "invalid-provider-response"
      : "provider-rejected",
  });
}

async function renderReactEmail(react: ReactElement) {
  const [html, text] = await Promise.all([
    render(react),
    render(react, { plainText: true }),
  ]);
  return { html, text };
}
