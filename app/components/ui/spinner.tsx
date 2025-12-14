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
      role="status"
      {...props}
    />
  );
}

export { Spinner };
