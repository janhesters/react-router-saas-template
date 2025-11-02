import "./app.css";

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
  useLoaderData,
  useRouteError,
} from "react-router";
import { useChangeLanguage } from "remix-i18next/react";
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
} from "./features/localization/i18n-middleware.server";
import { useToast } from "./hooks/use-toast";
import { getEnv } from "./utils/env.server";
import { honeypot } from "./utils/honeypot.server";
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

export const middleware = [i18nextMiddleware];

export async function loader({ request, context }: Route.LoaderArgs) {
  const { colorScheme, honeypotInputProps, toastData } = await promiseHash({
    colorScheme: getColorScheme(request),
    honeypotInputProps: honeypot.getInputProps(),
    toastData: getToast(request),
  });
  const locale = getLocale(context);
  const i18next = getInstance(context);
  const title = i18next.t("app-name");
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
    { headers: toastHeaders },
  );
}

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData?.title },
];

export function Layout({
  children,
}: { children: React.ReactNode } & Route.ComponentProps) {
  const data = useLoaderData<typeof loader>();
  const locale = data?.locale ?? "en";
  const error = useRouteError();
  const isErrorFromRoute = isRouteErrorResponse(error);
  const colorScheme = useColorScheme();

  const { i18n } = useTranslation();

  useChangeLanguage(locale);
  useToast(data?.toast);

  return (
    <html className={colorScheme} dir={i18n.dir()} lang={locale}>
      <head>
        <meta charSet="utf-8" />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <Meta />
        <Links />
        {isErrorFromRoute && (
          <title>{`${error.status} ${error.statusText}`}</title>
        )}
      </head>

      <body className="min-h-svh">
        <HoneypotProvider {...data?.honeypotInputProps}>
          {children}
        </HoneypotProvider>
        <script
          /**
           * biome-ignore lint/security/noDangerouslySetInnerHtml: This is how
           * you're supposed to set variables that are available on the client
           * side with React Router.
           */
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(data?.ENV ?? {})}`,
          }}
        />
        <ScrollRestoration />
        <Scripts />
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}

export default function App() {
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
