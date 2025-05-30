import components from '~/components/locales/de';
import billing from '~/features/billing/locales/de';
import colorScheme from '~/features/color-scheme/locales/de';
import landing from '~/features/landing/locales/de';
import notifications from '~/features/notifications/locales/de';
import onboarding from '~/features/onboarding/locales/de';
import organizations from '~/features/organizations/locales/de';
import userAccounts from '~/features/user-accounts/locales/de';
import userAuthentication from '~/features/user-authentication/locales/de';

import type en from './en';

export default {
  common: {
    'app-name': 'React Router SaaS Template',
    'not-found': {
      description:
        'Entschuldigung, wir konnten die Seite, die du suchst, nicht finden.',
      'home-link': 'Zur Startseite',
      status: '404',
      title: 'Seite nicht gefunden',
    },
  },
  billing,
  'color-scheme': colorScheme,
  components,
  landing,
  notifications,
  onboarding,
  organizations,
  'user-accounts': userAccounts,
  'user-authentication': userAuthentication,
} satisfies typeof en;
