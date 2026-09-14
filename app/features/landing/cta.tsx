import { IconBook2 } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export function CTA() {
  const { t } = useTranslation("landing", { keyPrefix: "cta" });

  return (
    <section className="py-12 lg:px-4">
      <div className="relative isolate mx-auto max-w-7xl overflow-hidden border-border bg-foreground px-6 py-16 shadow-2xl sm:rounded-3xl sm:border sm:px-16 dark:bg-background">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-semibold text-pretty text-background sm:text-5xl dark:text-foreground">
            {t("title")}
          </h2>

          <p className="mt-4 text-lg text-pretty text-ring dark:text-muted-foreground">
            {t("description")}
          </p>
        </div>

        <div className="mt-8 flex items-center justify-center gap-4">
          <Link className={buttonVariants()} to="/register">
            {t("buttons.primary")}
          </Link>

          <a
            className={cn(
              buttonVariants({ variant: "link" }),
              "text-background dark:text-foreground",
            )}
            href="https://github.com/janhesters/react-router-saas-template"
          >
            {t("buttons.secondary")}
            <IconBook2 />
          </a>
        </div>

        <div
          aria-hidden="true"
          className="absolute inset-x-0 -top-16 -z-10 flex transform-gpu justify-center overflow-hidden blur-3xl"
        >
          <div className="aspect-[1318/752] w-[82.375rem] flex-none bg-gradient-to-r from-primary to-primary opacity-25 clip-cta-glow dark:to-secondary" />
        </div>
      </div>
    </section>
  );
}
