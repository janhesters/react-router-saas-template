import type { Route } from "./+types/$";
import { NotFound } from "~/components/not-found";
import { getInstance } from "~/features/localization/i18next-middleware.server";
import { notFound } from "~/utils/http-responses.server";

export async function loader({ context }: Route.LoaderArgs) {
  const i18next = getInstance(context);
  const t = i18next.getFixedT(null, "translation", "notFound");

  return notFound({ title: t("title") });
}

export const meta: Route.MetaFunction = ({ data }) => {
  return [{ title: data.title }];
};

export default function CatchAllRoute() {
  return (
    <>
      <title>404</title>
      <NotFound />
    </>
  );
}
