import { useTranslation } from "react-i18next";
import { useNavigation } from "react-router";

import type { Route } from "./+types/contact-sales";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { contactSalesAction } from "~/features/billing/contact-sales/contact-sales-action.server";
import { CONTACT_SALES_INTENT } from "~/features/billing/contact-sales/contact-sales-constants";
import { ContactSalesTeam } from "~/features/billing/contact-sales/contact-sales-team";
import { getInstance } from "~/features/localization/i18next-middleware.server";
import { cn } from "~/lib/utils";

export function loader({ context }: Route.LoaderArgs) {
  const i18n = getInstance(context);
  return { pageTitle: i18n.t("billing:contactSales.pageTitle") };
}

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData?.pageTitle },
];

export async function action(args: Route.ActionArgs) {
  return await contactSalesAction(args);
}

export default function ContactSales({ actionData }: Route.ComponentProps) {
  const { t } = useTranslation("billing", { keyPrefix: "contactSales" });

  const navigation = useNavigation();
  const isContactingSales =
    navigation.formData?.get("intent") === CONTACT_SALES_INTENT;

  return (
    <>
      <header className="sr-only">
        <h1>{t("pageTitle")}</h1>
      </header>

      <main className="relative isolate mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
        >
          <div
            className="from-primary to-secondary relative left-[calc(50%-11rem)] aspect-1155/678 w-144.5 -translate-x-1/2 rotate-30 bg-linear-to-tr opacity-30 sm:left-[calc(50%-30rem)] sm:w-288.75"
            style={{
              clipPath:
                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
            }}
          />
        </div>

        <h2 className="sr-only">{t("enterpriseSales")}</h2>

        <div
          className={cn(
            "mx-auto max-w-2xl lg:py-32",
            "*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs",
          )}
        >
          {(actionData as { success?: boolean })?.success ? (
            <Card>
              <CardHeader className="space-y-6">
                <CardTitle className="text-primary text-5xl">
                  {t("success")}
                </CardTitle>

                <CardDescription className="text-2xl">
                  {t("thankYou")}
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <ContactSalesTeam
              isContactingSales={isContactingSales}
              lastResult={actionData?.result}
            />
          )}
        </div>

        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-44rem)]"
        >
          <div
            className="from-secondary to-primary relative left-[calc(50%+3rem)] aspect-1155/678 w-144.5 -translate-x-1/2 bg-linear-to-tr opacity-30 sm:left-[calc(50%+36rem)] sm:w-288.75"
            style={{
              clipPath:
                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
            }}
          />
        </div>
      </main>
    </>
  );
}
