import { createId } from "@paralleldrive/cuid2";
import type { HttpHandler } from "msw";
import { HttpResponse, http } from "msw";

import { requireHeader, writeEmail } from "../utils";

export const resendHandlers: Array<HttpHandler> = [
  http.post("https://api.resend.com/emails", async ({ request }) => {
    requireHeader(request.headers, "Authorization");
    const body = await request.json();
    const email = await writeEmail(body);

    return HttpResponse.json({
      created_at: new Date().toISOString(),
      from: email.from,
      id: createId(),
      to: email.to,
    });
  }),
];
