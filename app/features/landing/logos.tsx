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
      <h2 className="text-muted-foreground text-center text-sm font-semibold">
        {t("title")}
      </h2>

      <div className="relative mt-6">
        {/* Marquee with fading edges */}
        <Marquee className="max-w-full">
          {[
            <>
              <RRLockupDarkIcon className="hidden h-24 w-auto dark:block" />
              <RRLockupLightIcon className="block h-24 w-auto dark:hidden" />
            </>,
            <SiTypescript className="size-16" key="ts" title="TypeScript" />,
            <SiSupabase className="size-16" key="supabase" title="Supabase" />,
            <FaStripe className="size-16" key="stripe" title="Stripe" />,
            <SiTailwindcss
              className="size-16"
              key="tailwind"
              title="Tailwind CSS"
            />,
            <SiShadcnui className="size-16" key="shadcn" title="shadcn/ui" />,
            <SiVitest className="size-16" key="vitest" title="Vitest" />,
            <PlaywrightIcon className="size-16" key="playwright" />,
            <SiPostgresql className="size-16" key="pg" title="PostgreSQL" />,
            <SiPrisma className="size-16" key="prisma" title="Prisma" />,
            <SiMockserviceworker
              className="size-16"
              key="msw"
              title="MSW (Mock Service Worker)"
            />,
            <SiTestinglibrary
              className="size-16"
              key="rtl"
              title="React Testing Library"
            />,
            <SiEslint className="size-16" key="eslint" title="ESLint" />,
            <SiPrettier className="size-16" key="prettier" title="Prettier" />,
          ].map((icon) => (
            <div
              className="flex size-32 items-center justify-center text-4xl opacity-60 grayscale transition hover:opacity-100 hover:grayscale-0"
              key={icon.toString()}
            >
              {icon}
            </div>
          ))}
        </Marquee>

        {/* Fading edges */}
        <div className="from-background pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-linear-to-r to-transparent" />
        <div className="from-background pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-linear-to-l to-transparent" />
      </div>
    </section>
  );
}
