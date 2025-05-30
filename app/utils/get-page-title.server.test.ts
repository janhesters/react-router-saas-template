import { createInstance } from 'i18next';
import { describe, expect, test } from 'vitest';

import { resources } from '~/features/localization/middleware.server';

import { getPageTitle } from './get-page-title.server';

describe('getPageTitle', () => {
  test('given: a translation key, should: return the translated title combined with the app name', async () => {
    const i18n = createInstance({ resources });
    await i18n.init({ lng: 'en' });

    const actual = getPageTitle(i18n, 'user-authentication:login.page-title');
    const expected = 'Login | React Router SaaS Template';

    expect(actual).toEqual(expected);
  });

  test('given: a different translation key, should: return the translated title combined with the app name', async () => {
    const i18n = createInstance({ resources });
    await i18n.init({ lng: 'en' });

    const actual = getPageTitle(
      i18n,
      'user-authentication:register.page-title',
    );
    const expected = 'Register | React Router SaaS Template';

    expect(actual).toEqual(expected);
  });
});
