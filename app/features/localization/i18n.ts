import type { InitOptions } from "i18next";

import { defaultNS, resources } from "./resources";

export const i18n = {
  // The default namespace of i18next is "translation",
  // but you can customize it here
  defaultNS,
  // This is the language you want to use in case
  // if the user language is not in the supportedLngs
  fallbackLng: "en",
  // Resources for type-safe translations (i18next will extract namespaces automatically)
  resources,
  // This is the list of languages your application supports
  supportedLngs: ["en"],
} satisfies InitOptions;
