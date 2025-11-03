import { createId } from "@paralleldrive/cuid2";
import type { HttpHandler } from "msw";
import { HttpResponse, http } from "msw";

import { requireHeader, writeEmail } from "../utils";

const { json } = HttpResponse;

export const resendHandlers: Array<HttpHandler> = [
  http.post("https://api.resend.com/emails", async ({ request }) => {
    requireHeader(request.headers, "Authorization");
    const body = await request.json();
    console.info("🔶 mocked email contents:", body);

    const email = await writeEmail(body);

    return json({
      created_at: new Date().toISOString(),
      from: email.from,
      id: createId(),
      to: email.to,
    });
  }),
];
