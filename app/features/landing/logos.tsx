import { useTranslation } from "react-i18next";
import { FaStripe } from "react-icons/fa6";
import {
  SiEslint,
  SiMockserviceworker,
  SiPostgresql,
  SiPrettier,
  SiPrisma,
  SiShadcnui,
  SiSupabase,
  SiTailwindcss,
  SiTestinglibrary,
  SiTypescript,
  SiVitest,
} from "react-icons/si";

import { PlaywrightIcon } from "./svgs/playwright-icon";
import { RRLockupDarkIcon } from "./svgs/rr-lockup-dark-icon";
import { RRLockupLightIcon } from "./svgs/rr-lockup-light-icon";
import { Marquee } from "~/components/magicui/marquee";

export function Logos() {
  const { t } = useTranslation("landing", { keyPrefix: "logos" });
  return (
    <section className="py-12 text-center sm:px-4">
      <h2 className="text-center font-semibold text-muted-foreground text-sm">
        {t("title")}
      </h2>

      <div className="relative mt-6">
        {/* Marquee with fading edges */}
        <Marquee className="max-w-full">
          {[
            {
              icon: (
                <>
                  <RRLockupDarkIcon className="hidden h-24 w-auto dark:block" />
                  <RRLockupLightIcon className="block h-24 w-auto dark:hidden" />
                </>
              ),
              key: "react-router",
            },
            {
              icon: <SiTypescript className="size-16" title="TypeScript" />,
              key: "typescript",
            },
            {
              icon: <SiSupabase className="size-16" title="Supabase" />,
              key: "supabase",
            },
            {
              icon: <FaStripe className="size-16" title="Stripe" />,
              key: "stripe",
            },
            {
              icon: <SiTailwindcss className="size-16" title="Tailwind CSS" />,
              key: "tailwind",
            },
            {
              icon: <SiShadcnui className="size-16" title="shadcn/ui" />,
              key: "shadcn",
            },
            {
              icon: <SiVitest className="size-16" title="Vitest" />,
              key: "vitest",
            },
            {
              icon: <PlaywrightIcon className="size-16" />,
              key: "playwright",
            },
            {
              icon: <SiPostgresql className="size-16" title="PostgreSQL" />,
              key: "postgresql",
            },
            {
              icon: <SiPrisma className="size-16" title="Prisma" />,
              key: "prisma",
            },
            {
              icon: (
                <SiMockserviceworker
                  className="size-16"
                  title="MSW (Mock Service Worker)"
                />
              ),
              key: "msw",
            },
            {
              icon: (
                <SiTestinglibrary
                  className="size-16"
                  title="React Testing Library"
                />
              ),
              key: "rtl",
            },
            {
              icon: <SiEslint className="size-16" title="ESLint" />,
              key: "eslint",
            },
            {
              icon: <SiPrettier className="size-16" title="Prettier" />,
              key: "prettier",
            },
          ].map(({ key, icon }) => (
            <div
              className="flex size-32 items-center justify-center text-4xl opacity-60 grayscale transition hover:opacity-100 hover:grayscale-0"
              key={key}
            >
              {icon}
            </div>
          ))}
        </Marquee>

        {/* Fading edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-linear-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-linear-to-l from-background to-transparent" />
      </div>
    </section>
  );
}
