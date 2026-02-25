import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { FaGithub, FaLinkedin, FaXTwitter } from "react-icons/fa6";

import { ThemeToggle } from "../color-scheme/theme-toggle";
import { ReactsquadLogoIcon } from "./svgs/reactsquad-logo-icon";
import { buttonVariants } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { cn } from "~/lib/utils";

export function Footer({ className, ...props }: ComponentProps<"footer">) {
  const { t } = useTranslation("landing", { keyPrefix: "footer" });

  return (
    <footer
      className={cn("border-t md:h-(--header-height)", className)}
      {...props}
    >
      <div className="container mx-auto flex h-full flex-col items-center justify-between gap-4 px-4 py-4 sm:flex-row md:py-0">
        <div className="flex items-center gap-2">
          <a
            aria-label={t("social.github")}
            className={cn(
              buttonVariants({ size: "icon", variant: "outline" }),
              "size-8",
            )}
            href="https://github.com/janhesters/react-router-saas-template"
          >
            <FaGithub />
          </a>

          <a
            aria-label={t("social.twitter")}
            className={cn(
              buttonVariants({ size: "icon", variant: "outline" }),
              "size-8",
            )}
            href="https://x.com/janhesters"
          >
            <FaXTwitter />
          </a>

          <a
            aria-label={t("social.linkedin")}
            className={cn(
              buttonVariants({ size: "icon", variant: "outline" }),
              "size-8",
            )}
            href="https://www.linkedin.com/in/jan-hesters/"
          >
            <FaLinkedin />
          </a>

          <div className="h-6">
            <Separator orientation="vertical" />
          </div>

          <ThemeToggle />
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-2">
            {t("madeWithLove")}
            <a
              aria-label={t("reactsquad")}
              className="h-6 w-auto text-foreground"
              href="https://reactsquad.io"
            >
              <ReactsquadLogoIcon />
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
