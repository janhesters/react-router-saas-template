import type { RenderOptions } from '@testing-library/react';
import { render } from '@testing-library/react';
import i18next from 'i18next';
import type { ReactElement, ReactNode } from 'react';
import { I18nextProvider, initReactI18next } from 'react-i18next';

import { resources } from '~/features/localization/middleware.server';

// Initialize i18next for tests with actual translations.
void i18next.use(initReactI18next).init({
  lng: 'en',
  resources,
  ns: Object.keys(resources.en),
  // Disable suspense in tests.
  react: {
    useSuspense: false,
  },
  // Load translations synchronously in tests.
  initImmediate: false,
});

const AllTheProviders = ({ children }: { children: ReactNode }) => {
  return <I18nextProvider i18n={i18next}>{children}</I18nextProvider>;
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
export { default as userEvent } from '@testing-library/user-event';
export { createRoutesStub } from 'react-router';
