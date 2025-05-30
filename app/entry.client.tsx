import i18next from 'i18next';
import I18nextBrowserLanguageDetector from 'i18next-browser-languagedetector';
import Fetch from 'i18next-fetch-backend';
import { startTransition, StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { HydratedRouter } from 'react-router/dom';
import { getInitialNamespaces } from 'remix-i18next/client';

import { onUnhandledRequest } from './test/mocks/msw-utils';

declare global {
  // eslint-disable-next-line no-var
  var __ENABLE_MSW__: boolean | undefined;
}

async function activateMsw() {
  if (globalThis.__ENABLE_MSW__ === true) {
    console.warn('MSW is activated');
    const { worker } = await import('./test/mocks/browser');

    return worker.start({ onUnhandledRequest });
  }

  return;
}

async function hydrate() {
  await activateMsw();

  await i18next
    .use(initReactI18next)
    .use(Fetch)
    .use(I18nextBrowserLanguageDetector)
    .init({
      fallbackLng: 'en',
      ns: getInitialNamespaces(),
      detection: { order: ['htmlTag'], caches: [] },
      backend: { loadPath: '/api/locales/{{lng}}/{{ns}}' },
    });

  startTransition(() => {
    hydrateRoot(
      document,
      <I18nextProvider i18n={i18next}>
        <StrictMode>
          <HydratedRouter />
        </StrictMode>
      </I18nextProvider>,
    );
  });
}

if (globalThis.requestIdleCallback) {
  globalThis.requestIdleCallback(() => void hydrate());
} else {
  // Safari doesn't support requestIdleCallback
  // https://caniuse.com/requestidlecallback
  globalThis.setTimeout(() => void hydrate(), 1);
}
