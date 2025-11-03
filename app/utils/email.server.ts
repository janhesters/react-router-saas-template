/**
 * biome-ignore-all lint/suspicious/noConsole:helpful local dev error messages
 */
import { render } from "@react-email/components";
import type { ReactElement } from "react";
import { z } from "zod";

const internalServerErrorStatusCode = 500;

const resendErrorSchema = z.union([
  z.object({
    message: z.string(),
    name: z.string(),
    statusCode: z.number(),
  }),
  z.object({
    cause: z.any(),
    message: z.literal("Unknown Error"),
    name: z.literal("UnknownError"),
    statusCode: z.literal(internalServerErrorStatusCode),
  }),
]);

type ResendError = z.infer<typeof resendErrorSchema>;

const resendSuccessSchema = z.object({
  id: z.string(),
});

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
  const from = "hello@react-router-saas-template.com";

  const email = {
    from,
    ...options,
    ...(react ? await renderReactEmail(react) : {}),
  };

  // feel free to remove this condition once you've set up resend
  if (!process.env.RESEND_API_KEY && !process.env.MOCKS) {
    if (process.env.NODE_ENV !== "test") {
      console.error(`RESEND_API_KEY not set and we're not in mocks mode.`);
      console.error(
        `To send emails, set the RESEND_API_KEY environment variable.`,
      );
      console.error(
        `Would have sent the following email:`,
        JSON.stringify(email),
      );
    }

    return {
      data: { id: "mocked" },
      status: "success",
    } as const;
  }

  const response = await fetch("https://api.resend.com/emails", {
    body: JSON.stringify(email),
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  const data = await response.json();
  const parsedData = resendSuccessSchema.safeParse(data);

  if (response.ok && parsedData.success) {
    return { data: parsedData, status: "success" } as const;
  } else {
    const parseResult = resendErrorSchema.safeParse(data);
    if (parseResult.success) {
      return { error: parseResult.data, status: "error" } as const;
    } else {
      return {
        error: {
          cause: data,
          message: "Unknown Error",
          name: "UnknownError",
          statusCode: 500,
        } satisfies ResendError,
        status: "error",
      } as const;
    }
  }
}

async function renderReactEmail(react: ReactElement) {
  const [html, text] = await Promise.all([
    render(react),
    render(react, { plainText: true }),
  ]);
  return { html, text };
}
