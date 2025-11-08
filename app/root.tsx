import "./app.css";

import { FormOptionsProvider } from "@conform-to/react/future";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { ShouldRevalidateFunctionArgs } from "react-router";
import {
  data,
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useMatches,
  useRouteError,
  useRouteLoaderData,
} from "react-router";
import { HoneypotProvider } from "remix-utils/honeypot/react";
import { promiseHash } from "remix-utils/promise";
import sonnerStyles from "sonner/dist/styles.css?url";

import type { Route } from "./+types/root";
import { NotFound } from "./components/not-found";
import { Toaster } from "./components/ui/sonner";
import { getColorScheme } from "./features/color-scheme/color-scheme.server";
import { useColorScheme } from "./features/color-scheme/use-color-scheme";
import {
  getInstance,
  getLocale,
  i18nextMiddleware,
  localeCookie,
} from "./features/localization/i18next-middleware.server";
import { useToast } from "./hooks/use-toast";
import { cn } from "./lib/utils";
import { combineHeaders } from "./utils/combine-headers.server";
import { defineCustomMetadata } from "./utils/define-custom-metadata";
import { getEnv } from "./utils/env.server";
import { honeypot } from "./utils/honeypot.server";
import { useNonce } from "./utils/nonce-provider";
import { securityMiddleware } from "./utils/security-middleware.server";
import { getToast } from "./utils/toast.server";

export const links: Route.LinksFunction = () => [
  { href: sonnerStyles, rel: "stylesheet" },
];

/**
 * By enabling single fetch, the loaders will no longer revalidate the data when the action status is in the 4xx range.
 * This behavior will prevent toasts from being displayed for failed actions.
 * so, we opt in to revalidate the root loader data when the action status is in the 4xx range.
 */
export const shouldRevalidate = ({
  defaultShouldRevalidate,
  actionStatus,
}: ShouldRevalidateFunctionArgs) => {
  if (actionStatus && actionStatus > 399 && actionStatus < 500) {
    return true;
  }

  return defaultShouldRevalidate;
};

export const middleware = [securityMiddleware, i18nextMiddleware];

export async function loader({ request, context }: Route.LoaderArgs) {
  const { colorScheme, honeypotInputProps, toastData } = await promiseHash({
    colorScheme: getColorScheme(request),
    honeypotInputProps: honeypot.getInputProps(),
    toastData: getToast(request),
  });
  const locale = getLocale(context);
  const i18next = getInstance(context);
  const title = i18next.t("appName");
  const { toast, headers: toastHeaders } = toastData;
  return data(
    {
      colorScheme,
      ENV: getEnv(),
      honeypotInputProps,
      locale,
      title,
      toast,
    },
    {
      headers: combineHeaders(
        { "Set-Cookie": await localeCookie.serialize(locale) },
        toastHeaders,
      ),
    },
  );
}

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData?.title },
];

export function Layout({
  children,
}: { children: React.ReactNode } & Route.ComponentProps) {
  const data = useRouteLoaderData<typeof loader>("root");
  const { i18n } = useTranslation();
  const allowIndexing = data?.ENV.ALLOW_INDEXING !== "false";
  const colorScheme = useColorScheme();
  const error = useRouteError();
  const isErrorFromRoute = isRouteErrorResponse(error);
  const matches = useMatches();
  const nonce = useNonce();
  const hideOverflow = matches.some(
    (match) =>
      match.pathname.startsWith("/onboarding") ||
      match.id === "routes/_auth/_layout",
  );
  useToast(data?.toast);

  return (
    <html
      className={cn(colorScheme, hideOverflow && "overflow-y-hidden")}
      dir={i18n.dir(i18n.language)}
      lang={i18n.language}
    >
      <head>
        <meta charSet="utf-8" />
        <meta content="width=device-width, initial-scale=1" name="viewport" />

        {/* Prevent search engine indexing when ALLOW_INDEXING=false */}
        {allowIndexing ? null : (
          <meta content="noindex, nofollow" name="robots" />
        )}

        <Meta />
        <Links />
        {isErrorFromRoute && (
          <title>{`${error.status} ${error.statusText}`}</title>
        )}
      </head>

      <body className="min-h-svh">
        <FormOptionsProvider
          defineCustomMetadata={defineCustomMetadata}
          shouldRevalidate="onBlur"
          shouldValidate="onSubmit"
        >
          <HoneypotProvider {...data?.honeypotInputProps}>
            {children}
          </HoneypotProvider>
        </FormOptionsProvider>

        {/* Add nonce to inline scripts */}
        <script
          /**
           * biome-ignore lint/security/noDangerouslySetInnerHtml: This is how
           * you're supposed to set variables that are available on the client
           * side with React Router.
           */
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(data?.ENV ?? {})}`,
          }}
          nonce={nonce}
        />

        {/* React Router's built-in components accept nonce prop */}
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}

export default function App({ loaderData: { locale } }: Route.ComponentProps) {
  const { i18n } = useTranslation();

  useEffect(() => {
    if (i18n.language !== locale) {
      i18n.changeLanguage(locale);
    }
  }, [i18n, locale]);

  return <Outlet />;
}

function BaseErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="container mx-auto p-4 pt-16">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full overflow-x-auto p-4">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}

export function ErrorBoundary({ error, ...props }: Route.ErrorBoundaryProps) {
  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFound className="min-h-svh" />;
  }

  return <BaseErrorBoundary error={error} {...props} />;
}
