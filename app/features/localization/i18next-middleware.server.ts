import { initReactI18next } from "react-i18next";
import { createCookie } from "react-router";
import { createI18nextMiddleware } from "remix-i18next/middleware";

import resources from "./locales";

// This cookie will be used to store the user locale preference
export const localeCookie = createCookie("lng", {
  httpOnly: true,
  path: "/",
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
});

export const [i18nextMiddleware, getLocale, getInstance] =
  createI18nextMiddleware({
    detection: {
      cookie: localeCookie, // The cookie to store the user preference
      fallbackLanguage: "en", // Your fallback language
      supportedLanguages: ["de", "en"], // Your supported languages, the fallback should be last
    },
    i18next: {
      interpolation: { escapeValue: false },
      resources,
    },
    plugins: [initReactI18next], // Plugins you may need, like react-i18next
  });
