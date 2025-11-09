/**
 * Gets the domain URL from a request.
 * @param request - The request object
 * @returns The domain URL (e.g., "https://example.com")
 */
export function getDomainUrl(request: Request) {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}
