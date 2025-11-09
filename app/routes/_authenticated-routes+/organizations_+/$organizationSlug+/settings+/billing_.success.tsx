import { OrganizationMembershipRole } from "@prisma/client";
import confetti from "canvas-confetti";
import { BadgeCheckIcon } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { data, href, Link } from "react-router";

import type { Route } from "./+types/billing_.success";
import { Button } from "~/components/ui/button";
import { getInstance } from "~/features/localization/i18next-middleware.server";
import { organizationMembershipContext } from "~/features/organizations/organizations-middleware.server";
import { getPageTitle } from "~/utils/get-page-title.server";
import { notFound } from "~/utils/http-responses.server";

export function loader({ context }: Route.LoaderArgs) {
  const { headers, role } = context.get(organizationMembershipContext);
  const i18n = getInstance(context);

  if (role === OrganizationMembershipRole.member) {
    throw notFound();
  }

  return data(
    {
      pageTitle: getPageTitle(
        i18n.t.bind(i18n),
        "billing:billingSuccessPage.pageTitle",
      ),
    },
    { headers },
  );
}

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData?.pageTitle },
];

export default function BillingSuccessRoute({ params }: Route.ComponentProps) {
  const { t } = useTranslation("billing", {
    keyPrefix: "billingSuccessPage",
  });
  const { organizationSlug } = params;

  useEffect(() => {
    const end = Date.now() + 2 * 1000; // 3 seconds
    const colors = ["#3b82f6", "#22c55e", "#eab308", "#ef4444"];
    let everyOther = true;

    const frame = () => {
      if (Date.now() > end) return;

      if (everyOther) {
        void confetti({
          angle: 60,
          colors: colors,
          origin: { x: 0, y: 0.5 },
          particleCount: colors.length,
          spread: 55,
          startVelocity: 60,
        });
        void confetti({
          angle: 120,
          colors: colors,
          origin: { x: 1, y: 0.5 },
          particleCount: colors.length,
          spread: 55,
          startVelocity: 60,
        });
      }

      everyOther = !everyOther;
      requestAnimationFrame(frame);
    };

    frame();
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-4 md:py-6 lg:px-6">
      <div className="flex max-w-xl flex-col items-center px-4 text-center">
        <BadgeCheckIcon className="mx-auto size-16 text-green-400 dark:text-green-500" />

        <h3 className="text-foreground mt-2 text-lg font-semibold">
          {t("paymentSuccessful")}
        </h3>

        <p className="text-muted-foreground mt-2 text-base text-balance">
          {t("productReady")}
        </p>

        <p className="text-muted-foreground mt-2 text-base text-balance">
          {t("thankYou")}
        </p>

        <Button asChild>
          <Link
            className="mt-6"
            to={href("/organizations/:organizationSlug/dashboard", {
              organizationSlug,
            })}
          >
            {t("goToDashboard")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
