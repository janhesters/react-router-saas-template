import type { UIMatch } from "react-router";

type Breadcrumb = {
  title: string;
  to: string;
};

export const findBreadcrumbs = (
  matches: UIMatch<{ breadcrump?: Breadcrumb }>[],
): Breadcrumb[] => {
  const breadcrumbs: Breadcrumb[] = [];

  for (const match of matches) {
    if (match.loaderData && "breadcrump" in match.loaderData) {
      const breadcrumb = match.loaderData.breadcrump;
      if (breadcrumb) {
        breadcrumbs.push(breadcrumb);
      }
    }
  }

  return breadcrumbs;
};
