import type { i18n } from 'i18next';

export function getPageTitle(i18n: i18n, tKey: string) {
  return `${i18n.t(tKey)} | ${i18n.t('common:app-name')}`;
}
