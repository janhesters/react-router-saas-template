import billing from "../../../public/locales/en/billing.json" with {
  type: "json",
};
import colorScheme from "../../../public/locales/en/color-scheme.json" with {
  type: "json",
};
import common from "../../../public/locales/en/common.json" with {
  type: "json",
};
import landing from "../../../public/locales/en/landing.json" with {
  type: "json",
};
import notifications from "../../../public/locales/en/notifications.json" with {
  type: "json",
};
import onboarding from "../../../public/locales/en/onboarding.json" with {
  type: "json",
};
import organizations from "../../../public/locales/en/organizations.json" with {
  type: "json",
};
import settings from "../../../public/locales/en/settings.json" with {
  type: "json",
};
import userAuthentication from "../../../public/locales/en/user-authentication.json" with {
  type: "json",
};

export const defaultNS = "common";

export const resources = {
  en: {
    billing,
    "color-scheme": colorScheme,
    common,
    landing,
    notifications,
    onboarding,
    organizations,
    settings,
    "user-authentication": userAuthentication,
  },
} as const;
