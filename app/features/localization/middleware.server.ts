import { unstable_createI18nextMiddleware } from 'remix-i18next/middleware';

import de from './locales/de';
import en from './locales/en';
import { localeCookie } from './session.server';

export const resources = {
  en,
  de,
};

export const [i18nextMiddleware, getLocale, getInstance] =
  unstable_createI18nextMiddleware({
    detection: {
      supportedLanguages: Object.keys(resources),
      fallbackLanguage: 'en',
      cookie: localeCookie,
    },
    i18next: { resources },
  });
