const developmentAppUrl = "http://localhost:3000";

const isHttpUrl = (url: URL) => ["http:", "https:"].includes(url.protocol);

// React Router reads `*` and `**` in a host as wildcards, so a host must not
// contain one, not even percent-encoded, which `URL` decodes.
const isExplicitHost = (host: string) =>
  !host.includes("*") && URL.parse(`http://${host}`)?.host === host;

const getAppHost = (appUrl: string) => {
  const url = URL.parse(appUrl === "" ? developmentAppUrl : appUrl);

  if (url && isHttpUrl(url) && isExplicitHost(url.host)) {
    return url.host;
  }

  throw new Error(
    `APP_URL must be a full http or https URL with an explicit host, such as https://example.com. Received "${appUrl}".`,
  );
};

const toExplicitHost = (host: string) => {
  if (isExplicitHost(host)) {
    return host;
  }

  throw new Error(
    `ADDITIONAL_ACTION_ORIGINS must list lowercase hosts without a scheme or wildcard, such as www.example.com or localhost:8443. Received "${host}".`,
  );
};

const getAdditionalHosts = (additionalHosts: string) =>
  additionalHosts
    .split(",")
    .map((host) => host.trim())
    .filter((host) => host !== "")
    .map(toExplicitHost);

/**
 * Lists the public hosts whose forms may submit actions to this app.
 *
 * React Router rejects an action when the browser's `Origin` differs from the
 * request URL, unless the origin's host is in `allowedActionOrigins`. Behind a
 * proxy that terminates TLS, `react-router-serve` sees `http://` request URLs
 * while browsers send `Origin: https://...`, so every public host must be
 * listed. The app URL's host comes first, followed by explicit extra hosts.
 *
 * @param options.additionalHosts - Comma-separated hosts, such as
 * `www.example.com,my-app.fly.dev`, for deployments that serve the app under
 * more than one host.
 * @param options.appUrl - The app's public URL. Empty means local development
 * on `http://localhost:3000`.
 * @returns The hosts for React Router's `allowedActionOrigins` option.
 */
export function getAllowedActionOrigins({
  additionalHosts = "",
  appUrl = "",
}: {
  additionalHosts?: string;
  appUrl?: string;
} = {}) {
  return [
    ...new Set([getAppHost(appUrl), ...getAdditionalHosts(additionalHosts)]),
  ];
}
