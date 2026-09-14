import { IconLoader } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

import { cn } from "~/lib/utils";

function Spinner({
  className,
  ...props
}: React.ComponentProps<typeof IconLoader>) {
  const { t } = useTranslation("translation");

  return (
    <IconLoader
      aria-label={t("loading")}
      className={cn("size-4 animate-spin", className)}
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- The loading icon renders an SVG, not an HTML output element.
      role="status"
      {...props}
    />
  );
}

export { Spinner };
