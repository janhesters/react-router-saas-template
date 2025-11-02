import type { RenderOptions } from "@testing-library/react";
import { render } from "@testing-library/react";
import i18next from "i18next";
import type { ReactElement, ReactNode } from "react";
import { I18nextProvider, initReactI18next } from "react-i18next";

import { i18n } from "~/features/localization/i18n";

// Initialize i18next for tests with actual translations.
void i18next.use(initReactI18next).init({
  ...i18n,
  initImmediate: false,
  lng: "en",
  react: {
    useSuspense: false,
  },
});

const AllTheProviders = ({ children }: { children: ReactNode }) => {
  return <I18nextProvider i18n={i18next}>{children}</I18nextProvider>;
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from "@testing-library/react";
export { customRender as render };
export { default as userEvent } from "@testing-library/user-event";
export { createRoutesStub } from "react-router";
