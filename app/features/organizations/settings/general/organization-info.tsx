import { useTranslation } from "react-i18next";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";

export type OrganizationInfoProps = {
  organizationName: string;
  organizationLogoUrl: string;
};

export function OrganizationInfo({
  organizationName,
  organizationLogoUrl,
}: OrganizationInfoProps) {
  const { t } = useTranslation("organizations", {
    keyPrefix: "settings.general.organization-info",
  });

  return (
    <div className="flex flex-col gap-y-6 sm:gap-y-8">
      <div className="grid gap-x-8 sm:grid-cols-2">
        <div className="space-y-1">
          <h2 className="text-sm font-medium">{t("name-title")}</h2>
          <p className="text-muted-foreground text-sm">
            {t("name-description")}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <p className="text-sm">{organizationName}</p>
        </div>
      </div>

      <div className="grid gap-x-8 sm:grid-cols-2">
        <div className="space-y-1">
          <h2 className="text-sm font-medium">{t("logo-title")}</h2>
          <p className="text-muted-foreground text-sm">
            {t("logo-description")}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Avatar className="size-16 rounded-md">
            <AvatarImage
              alt={t("logo-alt")}
              className="aspect-square h-full rounded-md object-cover"
              src={organizationLogoUrl}
            />
            <AvatarFallback className="rounded-md text-2xl">
              {organizationName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </div>
  );
}
