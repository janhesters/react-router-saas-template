import { IconLayoutList } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { Outlet, useMatch } from "react-router";

import type { Route } from "./+types/_onboarding-layout";
import { TalentMap } from "~/features/onboarding/talent-map";
import { authMiddleware } from "~/features/user-authentication/user-authentication-middleware.server";
import { cn } from "~/lib/utils";

export const middleware = [authMiddleware];

/**
 * Loader for the onboarding layout.
 * Determines whether to show animations based on the environment.
 * We disable animations in test mode to significantly speed up Playwright tests
 * and prevent WebGL-related GPU stalls in CI environments.
 */
export async function loader() {
  return {
    shouldShowAnimations: process.env.NODE_ENV !== "test",
  };
}

export default function OnboardingLayout({ loaderData }: Route.ComponentProps) {
  const { t } = useTranslation("onboarding", { keyPrefix: "layout" });
  const isUserRoute = useMatch("/onboarding/user-account");
  const { shouldShowAnimations } = loaderData;

  return (
    <main className="relative md:h-screen md:overflow-hidden lg:grid lg:grid-cols-2">
      {/* Left side */}
      <div className="relative hidden h-full flex-col overflow-hidden border-r bg-muted/60 p-10 lg:flex">
        <div className="absolute inset-0 z-10 bg-linear-to-t from-background to-transparent" />
        <IconLayoutList className="mr-auto h-5" />
        <div className="z-10 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-xl">&ldquo;{t("quote")}&rdquo;</p>
            <footer className="font-mono font-semibold text-sm">
              {t("quoteAuthor")}
            </footer>
          </blockquote>
        </div>
        <div className="absolute inset-0">
          {shouldShowAnimations && <TalentMap />}
        </div>
      </div>
      {/* Right side */}
      <div
        className={cn(
          "relative flex flex-col overflow-y-auto",
          isUserRoute && "justify-center",
        )}
      >
        <div
          aria-hidden
          className="absolute inset-0 isolate opacity-60 contain-strict"
        >
          <div className="-translate-y-87.5 absolute top-0 right-0 h-320 w-140 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,--theme(--color-foreground/.06)_0,hsla(0,0%,55%,.02)_50%,--theme(--color-foreground/.01)_80%)]" />
          <div className="absolute top-0 right-0 h-320 w-60 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] [translate:5%_-50%]" />
          <div className="-translate-y-87.5 absolute top-0 right-0 h-320 w-60 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)]" />
        </div>
        <div
          className={cn(
            "relative flex flex-col p-4 md:py-10",
            isUserRoute ? "justify-center" : "justify-start",
          )}
        >
          <div className="mx-auto w-full max-w-md">
            <Outlet />
          </div>
        </div>
      </div>
    </main>
  );
}
