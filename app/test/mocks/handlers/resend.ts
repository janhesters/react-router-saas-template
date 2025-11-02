import { createId } from "@paralleldrive/cuid2";
import type { RequestHandler } from "msw";
import { HttpResponse, http } from "msw";
import { z } from "zod";

// Schema for validating incoming email requests
const emailRequestSchema = z.object({
  from: z.string(),
  html: z.string().optional(),
  subject: z.string(),
  text: z.string().optional(),
  to: z.union([z.string(), z.array(z.string())]),
});

const sendEmailMock = http.post(
  "https://api.resend.com/emails",
  async ({ request }) => {
    // Check for Authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return HttpResponse.json(
        {
          message: "Invalid API key provided",
          name: "UnauthorizedError",
          statusCode: 401,
        },
        { status: 401 },
      );
    }

    try {
      const body = await request.json();
      const parseResult = emailRequestSchema.safeParse(body);

      if (!parseResult.success) {
        return HttpResponse.json(
          {
            cause: parseResult.error.format(),
            message: "Invalid request data",
            name: "ValidationError",
            statusCode: 400,
          },
          { status: 400 },
        );
      }

      // At least one of html or text must be provided
      if (!parseResult.data.html && !parseResult.data.text) {
        return HttpResponse.json(
          {
            message: "Either html or text content must be provided",
            name: "ValidationError",
            statusCode: 400,
          },
          { status: 400 },
        );
      }

      // Generate a UUID-like id for the email
      const id = createId();

      return HttpResponse.json({ id });
    } catch (error) {
      return HttpResponse.json(
        {
          cause: error,
          message: "Failed to process email request",
          name: "UnknownError",
          statusCode: 500,
        },
        { status: 500 },
      );
    }
  },
);

export const resendHandlers: RequestHandler[] = [sendEmailMock];
