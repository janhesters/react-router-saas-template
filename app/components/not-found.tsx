import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export type NotFoundProps = {
  className?: string;
};

export function NotFound({ className }: NotFoundProps) {
  const { t } = useTranslation("translation");

  return (
    <main
      className={cn(
        "grid min-h-full place-items-center px-6 py-24 sm:py-32 lg:px-8",
        className,
      )}
    >
      <div className="text-center">
        <p className="text-base font-semibold text-primary">
          {t("notFound.status")}
        </p>

        <h1 className="mt-4 text-3xl font-bold tracking-tighter text-foreground sm:text-5xl">
          {t("notFound.title")}
        </h1>

        <p className="mt-6 text-base text-muted-foreground">
          {t("notFound.description")}
        </p>

        <Link className={cn(buttonVariants(), "mt-10")} to="/">
          {t("notFound.homeLink")}
        </Link>
      </div>
    </main>
  );
}
