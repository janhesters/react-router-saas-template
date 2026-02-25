import { IconArrowLeft } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { Link, Outlet } from "react-router";

import { buttonVariants } from "~/components/ui/button";
import { ThemeToggle } from "~/features/color-scheme/theme-toggle";
import { cn } from "~/lib/utils";

export default function SettingsLayout() {
  const { t } = useTranslation("settings", { keyPrefix: "layout" });

  return (
    <>
      <header className="flex h-[var(--header-height)] items-center border-b">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between p-2">
          <div className="flex items-center gap-2">
            <Link
              aria-label={t("backButtonLabel")}
              className={cn(
                buttonVariants({ size: "icon", variant: "outline" }),
                "size-8",
              )}
              to="/organizations"
            >
              <IconArrowLeft />
            </Link>

            <h1 className="font-medium text-base">{t("pageTitle")}</h1>
          </div>

          <ThemeToggle />
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </>
  );
}
