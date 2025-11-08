import { FormOptionsProvider } from "@conform-to/react/future";
import type { RenderOptions } from "@testing-library/react";
import { render } from "@testing-library/react";
import i18next from "i18next";
import type { ReactElement, ReactNode } from "react";
import { I18nextProvider, initReactI18next } from "react-i18next";

import resources from "~/features/localization/locales";
import { defineCustomMetadata } from "~/utils/define-custom-metadata";

// Initialize i18next for tests with actual translations.
await i18next.use(initReactI18next).init({
  defaultNS: "translation",
  initImmediate: false,
  interpolation: { escapeValue: false },
  lng: "en",
  react: {
    useSuspense: false,
  },
  resources,
});

const AllTheProviders = ({ children }: { children: ReactNode }) => {
  return (
    <FormOptionsProvider defineCustomMetadata={defineCustomMetadata}>
      <I18nextProvider i18n={i18next}>{children}</I18nextProvider>
    </FormOptionsProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from "@testing-library/react";
export { customRender as render };
export { default as userEvent } from "@testing-library/user-event";
export { createRoutesStub } from "react-router";
