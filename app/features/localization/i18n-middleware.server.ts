import path from 'node:path';

import Backend from 'i18next-fs-backend';
import { createI18nextMiddleware } from 'remix-i18next/middleware';

import { i18n } from './i18n';

export const [i18nextMiddleware, getLocale, getInstance] =
  createI18nextMiddleware({
    detection: {
      supportedLanguages: i18n.supportedLngs,
      fallbackLanguage: i18n.fallbackLng,
    },
    i18next: {
      ...i18n,
      // Preload all supported languages
      preload: i18n.supportedLngs,
      backend: {
        loadPath: path.resolve('./public/locales/{{lng}}/{{ns}}.json'),
      },
    },
    plugins: [Backend],
  });
