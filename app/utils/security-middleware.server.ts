import { generalSecurity } from "@nichtsam/helmet/general";
import type { MiddlewareFunction } from "react-router";

export const securityMiddleware: MiddlewareFunction = async (_, next) => {
  const response = (await next()) as Response;

  // Add general security headers (XSS protection, frame options, etc.)
  generalSecurity(response.headers, {
    referrerPolicy: false,
  });

  // Control search engine indexing via X-Robots-Tag header
  const allowIndexing = process.env.ALLOW_INDEXING !== "false";
  if (!allowIndexing) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return response;
};
