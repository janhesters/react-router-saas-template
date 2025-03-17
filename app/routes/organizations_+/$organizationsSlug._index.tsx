import type { ShouldRevalidateFunctionArgs } from 'react-router';

import type { Route } from './+types/$organizationsSlug._index';

export const handle = { i18n: ['organizations', 'sidebar', 'header'] };

/* 
  With single fetch enabled, the layout route loader will always be called for every subroute change.
  we can skip re-running this loader if the organization slug remains unchanged by opting into Remix's granular single fetch.
  If you want to opt out of granular single fetch and always re-run this loader, you can remove this function
  To learn more about granular single fetch, see the Remix documentation on revalidations: 
  https://remix.run/docs/en/main/guides/single-fetch#revalidations
 **/
export const shouldRevalidate = ({
  currentParams,
  nextParams,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs) => {
  if (currentParams.organizationSlug !== nextParams.organizationSlug) {
    return true;
  }
  return defaultShouldRevalidate;
};

// eslint-disable-next-line no-empty-pattern
export function loader({}: Route.LoaderArgs) {
  return {};
}

export default function OrganizationLayoutRoute() {
  return <div>Organization layout</div>;
}
