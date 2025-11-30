import type { UIMatch } from "react-router";

type Breadcrumb = {
  title: string;
  to: string;
};

export const findBreadcrumbs = (
  matches: UIMatch<{ breadcrumb?: Breadcrumb }>[],
): Breadcrumb[] => {
  const breadcrumbs: Breadcrumb[] = [];

  for (const match of matches) {
    if (match.loaderData && "breadcrumb" in match.loaderData) {
      const breadcrumb = match.loaderData.breadcrumb;
      if (breadcrumb) {
        breadcrumbs.push(breadcrumb);
      }
    }
  }

  return breadcrumbs;
};
