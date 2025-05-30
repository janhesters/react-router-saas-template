import components from '~/components/locales/en';
import billing from '~/features/billing/locales/en';
import colorScheme from '~/features/color-scheme/locales/en';
import landing from '~/features/landing/locales/en';
import notifications from '~/features/notifications/locales/en';
import onboarding from '~/features/onboarding/locales/en';
import organizations from '~/features/organizations/locales/en';
import userAccounts from '~/features/user-accounts/locales/en';
import userAuthentication from '~/features/user-authentication/locales/en';

export default {
  common: {
    'app-name': 'React Router SaaS Template',
    'not-found': {
      description: "Sorry, we couldn't find the page you're looking for.",
      'home-link': 'Return Home',
      status: '404',
      title: 'Page Not Found',
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
};
