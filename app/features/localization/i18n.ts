import type { InitOptions } from 'i18next';

import { defaultNS, resources } from './resources';

export const i18n = {
  // This is the list of languages your application supports
  supportedLngs: ['en'],
  // This is the language you want to use in case
  // if the user language is not in the supportedLngs
  fallbackLng: 'en',
  // The default namespace of i18next is "translation",
  // but you can customize it here
  defaultNS,
  // Resources for type-safe translations (i18next will extract namespaces automatically)
  resources,
} satisfies InitOptions;
