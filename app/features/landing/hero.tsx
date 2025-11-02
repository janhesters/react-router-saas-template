import { BookTextIcon } from "lucide-react";
import type { CSSProperties } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Link } from "react-router";

import { RRLockupDarkIcon } from "./svgs/rr-lockup-dark-icon";
import { RRLockupLightIcon } from "./svgs/rr-lockup-light-icon";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

const imageClassNames = "border-border rounded-xl border object-contain";
const imageFadeStyle: CSSProperties = {
  maskImage: "linear-gradient(to bottom, black 75%, transparent)",
  WebkitMaskImage: "linear-gradient(to bottom, black 75%, transparent)",
};

export function Hero() {
  const { t } = useTranslation("landing", { keyPrefix: "hero" });
  const { t: tCommon } = useTranslation("common");

  return (
    <section className="relative z-0 py-24 text-center sm:pt-32">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
      >
        <div
          className="from-primary to-secondary relative left-[calc(50%-11rem)] aspect-1155/678 w-144.5 -translate-x-1/2 rotate-30 bg-linear-to-tr opacity-30 sm:left-[calc(50%-30rem)] sm:w-288.75"
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
        />
      </div>

      <div className="mx-auto max-w-2xl px-4">
        <Badge className="mb-8" variant="secondary">
          <Trans
            components={{
              1: <span className="underline" />,
            }}
            i18nKey="landing:hero.badge"
          />
        </Badge>

        <h1 className="">
          <RRLockupLightIcon className="block px-2 dark:hidden" />
          <RRLockupDarkIcon className="hidden px-2 dark:block" />

          <br />

          <span
            aria-hidden="true"
            className="font-mono text-4xl font-semibold sm:text-7xl"
          >
            {t("title")}
          </span>

          <span className="sr-only">{tCommon("app-name")}</span>
        </h1>

        <p className="text-muted-foreground mt-8 text-lg sm:text-xl/8">
          <span className="relative">
            <Trans
              components={{
                1: (
                  <span className="text-primary decoration-primary underline decoration-wavy underline-offset-4">
                    free
                  </span>
                ),
              }}
              i18nKey="landing:hero.description"
            />
          </span>
        </p>

        <div className="mt-10 flex items-center justify-center gap-2">
          <Button asChild>
            <Link to="/register">{t("cta.primary")}</Link>
          </Button>

          <Button asChild className="text-foreground" variant="link">
            <a href="https://github.com/janhesters/react-router-saas-template">
              {t("cta.secondary")}
              <BookTextIcon />
            </a>
          </Button>
        </div>
      </div>

      <div className="mt-16 px-4">
        <img
          alt={t("image.light")}
          className={cn(imageClassNames, "shadow-sm dark:hidden")}
          src="/images/app-light.png"
          style={imageFadeStyle}
        />

        <img
          alt={t("image.dark")}
          className={cn(imageClassNames, "hidden dark:block")}
          src="/images/app-dark.png"
          style={imageFadeStyle}
        />
      </div>

      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-80rem)]"
      >
        <div
          className="from-primary to-secondary relative left-[calc(50%+3rem)] aspect-1155/678 w-144.5 -translate-x-1/2 bg-linear-to-tr opacity-30 sm:left-[calc(50%+36rem)] sm:w-288.75"
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
        />
      </div>
    </section>
  );
}
