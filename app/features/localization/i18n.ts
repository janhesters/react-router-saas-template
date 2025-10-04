import type { InitOptions } from 'i18next';

import { namespaces } from './namespaces';

export const i18n = {
  // This is the list of languages your application supports
  supportedLngs: ['en'],
  // This is the language you want to use in case
  // if the user language is not in the supportedLngs
  fallbackLng: 'en',
  // The default namespace of i18next is "translation",
  // but you can customize it here
  defaultNS: 'common',
  // List of all available namespaces (auto-generated at build time)
  ns: namespaces,
} satisfies InitOptions;
