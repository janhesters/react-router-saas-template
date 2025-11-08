import { CheckIcon } from "lucide-react";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { href, Link } from "react-router";

import type { Route } from "./+types/pricing";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  FeatureListItem,
  FeaturesList,
  FeaturesListTitle,
  OfferBadge,
  TierCard,
  TierCardContent,
  TierCardDescription,
  TierCardHeader,
  TierCardPrice,
  TierCardTitle,
  TierContainer,
  TierGrid,
} from "~/features/billing/pricing";
import { Footer } from "~/features/landing/footer";
import { Header } from "~/features/landing/header";
import { getInstance } from "~/features/localization/i18next-middleware.server";

export function loader({ context }: Route.LoaderArgs) {
  const i18n = getInstance(context);
  return { title: i18n.t("billing:pricingPage.pageTitle") };
}

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData?.title },
];

export default function PricingRoute() {
  const { t } = useTranslation("billing", { keyPrefix: "pricing" });
  const { t: tPage } = useTranslation("billing", { keyPrefix: "pricingPage" });
  const [billingPeriod, setBillingPeriod] = useState("annual");

  const getFeatures = (key: string): string[] =>
    t(`plans.${key}.features`, "", { returnObjects: true }) as string[];

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8 lg:py-48">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <h1 className="text-primary">{tPage("pageTitle")}</h1>

          <h2 className="mt-2 text-4xl font-bold sm:text-5xl">
            {tPage("pricingHeading")}
          </h2>

          <p className="text-muted-foreground mt-6 text-lg text-pretty">
            {tPage("pageDescription")}
          </p>
        </div>

        <Tabs onValueChange={setBillingPeriod} value={billingPeriod}>
          <div className="mb-4 flex flex-col items-center gap-3 sm:flex-row md:mb-2">
            <TabsList>
              <TabsTrigger value="monthly">{t("monthly")}</TabsTrigger>

              <TabsTrigger value="annual">{t("annual")}</TabsTrigger>
            </TabsList>

            {billingPeriod === "monthly" && (
              <p className="text-primary text-sm">{t("saveAnnually")}</p>
            )}
          </div>

          <TabsContent value="monthly">
            <TierContainer>
              <TierGrid>
                <TierCard>
                  <TierCardHeader>
                    <TierCardTitle>{t("plans.low.title")}</TierCardTitle>

                    <TierCardPrice>{t("free")}</TierCardPrice>

                    <TierCardDescription>
                      {t("plans.low.description")}
                    </TierCardDescription>

                    <Button asChild className="w-full">
                      <Link to={href("/register")}>{t("plans.low.cta")}</Link>
                    </Button>
                  </TierCardHeader>

                  <Separator />

                  <TierCardContent>
                    <FeaturesListTitle>
                      {t("plans.low.featuresTitle")}
                    </FeaturesListTitle>

                    <FeaturesList>
                      {getFeatures("low").map((feature) => (
                        <FeatureListItem key={feature}>
                          <CheckIcon />
                          {feature}
                        </FeatureListItem>
                      ))}
                    </FeaturesList>
                  </TierCardContent>
                </TierCard>

                <TierCard>
                  <TierCardHeader>
                    <TierCardTitle>{t("plans.mid.title")}</TierCardTitle>

                    <TierCardPrice>
                      <Trans
                        components={{
                          1: (
                            <span className="text-muted-foreground text-sm font-normal" />
                          ),
                        }}
                        i18nKey="pricing.price"
                        ns="billing"
                        values={{ price: "$30" }}
                      />
                    </TierCardPrice>

                    <TierCardDescription>
                      {t("plans.mid.description")}
                    </TierCardDescription>

                    <Button className="w-full">{t("plans.mid.cta")}</Button>
                  </TierCardHeader>

                  <Separator />

                  <TierCardContent>
                    <FeaturesListTitle>
                      {t("plans.mid.featuresTitle")}
                    </FeaturesListTitle>

                    <FeaturesList>
                      {getFeatures("mid").map((feature) => (
                        <FeatureListItem key={feature}>
                          <CheckIcon />
                          {feature}
                        </FeatureListItem>
                      ))}
                    </FeaturesList>
                  </TierCardContent>
                </TierCard>

                <TierCard className="ring-primary ring-2">
                  <TierCardHeader>
                    <TierCardTitle className="text-primary">
                      {t("plans.high.title")}
                      <Badge>{t("mostPopular")}</Badge>
                    </TierCardTitle>

                    <TierCardPrice>
                      <Trans
                        components={{
                          1: (
                            <span className="text-muted-foreground text-sm font-normal" />
                          ),
                        }}
                        i18nKey="pricing.price"
                        ns="billing"
                        values={{ price: "$55" }}
                      />
                    </TierCardPrice>

                    <TierCardDescription>
                      {t("plans.high.description")}
                    </TierCardDescription>

                    <Button className="w-full">{t("plans.high.cta")}</Button>
                  </TierCardHeader>

                  <Separator />

                  <TierCardContent>
                    <FeaturesListTitle>
                      {t("plans.high.featuresTitle")}
                    </FeaturesListTitle>

                    <FeaturesList>
                      {getFeatures("high").map((feature) => (
                        <FeatureListItem key={feature}>
                          <CheckIcon />
                          {feature}
                        </FeatureListItem>
                      ))}
                    </FeaturesList>
                  </TierCardContent>
                </TierCard>
              </TierGrid>
            </TierContainer>
          </TabsContent>

          <TabsContent value="annual">
            <TierContainer>
              <TierGrid className="@6xl/tiers:grid-cols-4">
                <TierCard>
                  <TierCardHeader>
                    <TierCardTitle>{t("plans.low.title")}</TierCardTitle>

                    <TierCardPrice>{t("free")}</TierCardPrice>

                    <TierCardDescription>
                      {t("plans.low.description")}
                    </TierCardDescription>

                    <Button asChild className="w-full">
                      <Link to={href("/register")}>{t("plans.low.cta")}</Link>
                    </Button>
                  </TierCardHeader>

                  <Separator />

                  <TierCardContent>
                    <FeaturesListTitle>
                      {t("plans.low.featuresTitle")}
                    </FeaturesListTitle>

                    <FeaturesList>
                      {getFeatures("low").map((feature) => (
                        <FeatureListItem key={feature}>
                          <CheckIcon />
                          {feature}
                        </FeatureListItem>
                      ))}
                    </FeaturesList>
                  </TierCardContent>
                </TierCard>

                <TierCard>
                  <TierCardHeader>
                    <TierCardTitle>{t("plans.mid.title")}</TierCardTitle>

                    <TierCardPrice>
                      <Trans
                        components={{
                          1: (
                            <span className="text-muted-foreground text-sm font-normal" />
                          ),
                        }}
                        i18nKey="pricing.price"
                        ns="billing"
                        values={{ price: "$25" }}
                      />

                      <OfferBadge>-15%</OfferBadge>
                    </TierCardPrice>

                    <TierCardDescription>
                      {t("plans.mid.description")}
                    </TierCardDescription>

                    <Button className="w-full">{t("plans.mid.cta")}</Button>
                  </TierCardHeader>

                  <Separator />

                  <TierCardContent>
                    <FeaturesListTitle>
                      {t("plans.mid.featuresTitle")}
                    </FeaturesListTitle>

                    <FeaturesList>
                      {getFeatures("mid").map((feature) => (
                        <FeatureListItem key={feature}>
                          <CheckIcon />
                          {feature}
                        </FeatureListItem>
                      ))}
                    </FeaturesList>
                  </TierCardContent>
                </TierCard>

                <TierCard className="ring-primary -mt-1.5 ring-2">
                  <TierCardHeader>
                    <TierCardTitle className="text-primary">
                      {t("plans.high.title")}
                      <Badge>{t("mostPopular")}</Badge>
                    </TierCardTitle>

                    <TierCardPrice>
                      <Trans
                        components={{
                          1: (
                            <span className="text-muted-foreground text-sm font-normal" />
                          ),
                        }}
                        i18nKey="pricing.price"
                        ns="billing"
                        values={{ price: "$45" }}
                      />

                      <OfferBadge>-20%</OfferBadge>
                    </TierCardPrice>

                    <TierCardDescription>
                      {t("plans.high.description")}
                    </TierCardDescription>

                    <Button className="w-full">{t("plans.high.cta")}</Button>
                  </TierCardHeader>

                  <Separator />

                  <TierCardContent>
                    <FeaturesListTitle>
                      {t("plans.high.featuresTitle")}
                    </FeaturesListTitle>

                    <FeaturesList>
                      {getFeatures("high").map((feature) => (
                        <FeatureListItem key={feature}>
                          <CheckIcon />
                          {feature}
                        </FeatureListItem>
                      ))}
                    </FeaturesList>
                  </TierCardContent>
                </TierCard>

                <TierCard className="@4xl/tiers:col-start-2 @6xl/tiers:col-start-auto">
                  <TierCardHeader>
                    <TierCardTitle>{t("plans.enterprise.title")}</TierCardTitle>

                    <TierCardPrice>{t("custom")}</TierCardPrice>

                    <TierCardDescription>
                      {t("plans.enterprise.description")}
                    </TierCardDescription>

                    <Button asChild className="w-full">
                      <Link to={href("/contact-sales")}>
                        {t("plans.enterprise.cta")}
                      </Link>
                    </Button>
                  </TierCardHeader>

                  <Separator />

                  <TierCardContent>
                    <FeaturesListTitle>
                      {t("plans.enterprise.featuresTitle")}
                    </FeaturesListTitle>

                    <FeaturesList>
                      {getFeatures("enterprise").map((feature) => (
                        <FeatureListItem key={feature}>
                          <CheckIcon />
                          {feature}
                        </FeatureListItem>
                      ))}
                    </FeaturesList>
                  </TierCardContent>
                </TierCard>
              </TierGrid>
            </TierContainer>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </>
  );
}
