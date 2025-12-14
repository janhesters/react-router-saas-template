import { IconBook2 } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { Button } from "~/components/ui/button";

export function CTA() {
  const { t } = useTranslation("landing", { keyPrefix: "cta" });

  return (
    <section className="py-12 lg:px-4">
      <div className="relative isolate mx-auto max-w-7xl overflow-hidden border-border bg-foreground px-6 py-16 shadow-2xl sm:rounded-3xl sm:border sm:px-16 dark:bg-background">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-pretty font-semibold text-4xl text-background sm:text-5xl dark:text-foreground">
            {t("title")}
          </h2>

          <p className="mt-4 text-pretty text-lg text-ring dark:text-muted-foreground">
            {t("description")}
          </p>
        </div>

        <div className="mt-8 flex items-center justify-center gap-4">
          <Button render={<Link to="/register" />}>
            {t("buttons.primary")}
          </Button>

          <Button
            className="text-background dark:text-foreground"
            render={
              // biome-ignore lint/a11y/useAnchorContent: anchor receives props
              <a href="https://github.com/janhesters/react-router-saas-template" />
            }
            variant="link"
          >
            {t("buttons.secondary")}
            <IconBook2 />
          </Button>
        </div>

        <div
          aria-hidden="true"
          className="-top-16 -z-10 absolute inset-x-0 flex transform-gpu justify-center overflow-hidden blur-3xl"
        >
          <div
            className="aspect-[1318/752] w-[82.375rem] flex-none bg-gradient-to-r from-primary to-primary opacity-25 dark:to-secondary"
            style={{
              clipPath:
                "polygon(73.6% 51.7%, 91.7% 11.8%, 100% 46.4%, 97.4% 82.2%, 92.5% 84.9%, 75.7% 64%, 55.3% 47.5%, 46.5% 49.4%, 45% 62.9%, 50.3% 87.2%, 21.3% 64.1%, 0.1% 100%, 5.4% 51.1%, 21.4% 63.9%, 58.9% 0.2%, 73.6% 51.7%)",
            }}
          />
        </div>
      </div>
    </section>
  );
}
