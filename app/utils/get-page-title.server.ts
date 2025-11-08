import type { TFunction } from "i18next";

export function getPageTitle(t: TFunction, tKey: string) {
  // @ts-expect-error - tKey is a dynamic string passed from route loaders
  return `${t(tKey)} | ${t("appName")}`;
}
