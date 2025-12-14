import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { Button } from "~/components/ui/button";
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
        <p className="font-semibold text-base text-primary">
          {t("notFound.status")}
        </p>

        <h1 className="mt-4 font-bold text-3xl text-foreground tracking-tighter sm:text-5xl">
          {t("notFound.title")}
        </h1>

        <p className="mt-6 text-base text-muted-foreground">
          {t("notFound.description")}
        </p>

        <Button className="mt-10" render={<Link to="/" />}>
          {t("notFound.homeLink")}
        </Button>
      </div>
    </main>
  );
}
