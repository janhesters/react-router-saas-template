import { ChevronLeftIcon, GalleryVerticalEndIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { href, Link, Outlet, useMatch } from "react-router";

import type { Route } from "./+types/_user-authentication-layout";
import { Button } from "~/components/ui/button";
import { FloatingPaths } from "~/features/user-authentication/floating-paths";

/**
 * Loader for the auth layout.
 * Determines whether to show animations based on the environment.
 * We disable animations in test mode to significantly speed up Playwright tests
 * and prevent performance issues in CI environments.
 */
export async function loader() {
  return {
    shouldShowAnimations: process.env.NODE_ENV !== "test",
  };
}

export default function UserAuthenticationLayout({
  loaderData,
}: Route.ComponentProps) {
  const { t } = useTranslation("userAuthentication", { keyPrefix: "layout" });
  const { t: tCommon } = useTranslation("translation");
  const loginMatch = useMatch(href("/login"));
  const registerMatch = useMatch(href("/register"));
  const { shouldShowAnimations } = loaderData;

  return (
    <main className="relative md:h-screen md:overflow-hidden lg:grid lg:grid-cols-2">
      {/* Left side */}
      <div className="bg-muted/60 relative hidden h-full flex-col border-r p-10 lg:flex">
        <div className="from-background to-transparent absolute inset-0 z-10 bg-linear-to-t" />
        <Link
          className="z-10 flex items-center gap-2 font-medium"
          to={href("/")}
        >
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEndIcon className="size-4" />
          </div>
          {tCommon("appName")}
        </Link>
        <div className="z-10 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-xl">&ldquo;{t("quote")}&rdquo;</p>
            <footer className="font-mono text-sm font-semibold">
              {t("quoteAuthor")}
            </footer>
          </blockquote>
        </div>
        <div className="absolute inset-0">
          {shouldShowAnimations && (
            <>
              <FloatingPaths position={1} />
              <FloatingPaths position={-1} />
            </>
          )}
        </div>
      </div>

      {/* Right side */}
      <div className="relative flex flex-col justify-center">
        <div
          aria-hidden
          className="absolute inset-0 isolate opacity-60 contain-strict"
        >
          <div className="-translate-y-87.5 absolute top-0 right-0 h-320 w-140 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,--theme(--color-primary/.06)_0,hsla(0,0%,55%,.02)_50%,--theme(--color-primary/.01)_80%)]" />
          <div className="absolute top-0 right-0 h-320 w-60 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-primary/.04)_0,--theme(--color-primary/.01)_80%,transparent_100%)] [translate:5%_-50%]" />
          <div className="-translate-y-87.5 absolute top-0 right-0 h-320 w-60 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-primary/.04)_0,--theme(--color-primary/.01)_80%,transparent_100%)]" />
        </div>
        {(loginMatch || registerMatch) && (
          <Button
            asChild
            className="absolute top-7 left-5 z-10"
            variant="ghost"
          >
            <Link to={href("/")}>
              <ChevronLeftIcon />
              {t("home")}
            </Link>
          </Button>
        )}
        <div className="relative flex min-h-screen flex-col justify-center p-4">
          <div className="mx-auto w-full max-w-sm">
            <Outlet />
          </div>
        </div>
      </div>
    </main>
  );
}
