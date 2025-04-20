import { CheckIcon, Loader2Icon } from 'lucide-react';
import type { ComponentProps, MouseEventHandler } from 'react';
import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { href, Link } from 'react-router';

import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Separator } from '~/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';

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
} from './pricing';

export type BillingModalContentProps = {
  canCancelSubscription: boolean;
  currentTier: 'low' | 'mid' | 'high' | 'enterprise';
  currentTierInterval: 'monthly' | 'annual';
  isAddingPaymentInformation?: boolean;
  isSwitchingToHigh?: boolean;
  isSwitchingToLow?: boolean;
  isSwitchingToMid?: boolean;
  lacksPaymentInformation: boolean;
  onCancelSubscriptionClick?: MouseEventHandler<HTMLButtonElement>;
};

export function BillingModalContent({
  canCancelSubscription = false,
  currentTier,
  currentTierInterval,
  isAddingPaymentInformation = false,
  isSwitchingToHigh = false,
  isSwitchingToLow = false,
  isSwitchingToMid = false,
  lacksPaymentInformation = false,
  onCancelSubscriptionClick,
}: BillingModalContentProps) {
  const { t } = useTranslation('billing', { keyPrefix: 'pricing' });
  const { t: tModal } = useTranslation('billing', {
    keyPrefix: 'billing-page.pricing-modal',
  });
  const [billingPeriod, setBillingPeriod] = useState('annual');

  const isSubmitting =
    isAddingPaymentInformation ||
    isSwitchingToLow ||
    isSwitchingToMid ||
    isSwitchingToHigh;

  const getFeatures = (key: string): string[] =>
    t(`plans.${key}.features`, { returnObjects: true }) as string[];

  const getButtonProps = (
    interval: 'monthly' | 'annual',
    tier: 'low' | 'mid' | 'high',
  ): Partial<ComponentProps<typeof Button>> => {
    if (tier === currentTier) {
      if (lacksPaymentInformation) {
        return {
          children: isAddingPaymentInformation ? (
            <>
              <Loader2Icon className="animate-spin" />
              {tModal('adding-payment-information')}
            </>
          ) : (
            tModal('add-payment-information')
          ),
          disabled: isSubmitting,
        };
      }

      if (interval !== currentTierInterval) {
        if (interval === 'annual') {
          return {
            children: tModal('switch-to-annual-button'),
            disabled: isSubmitting,
          };
        }

        if (interval === 'monthly') {
          return {
            children: tModal('switch-to-monthly-button'),
            disabled: isSubmitting,
            variant: 'outline',
          };
        }
      }

      return {
        children: tModal('current-plan'),
        disabled: true,
        variant: 'outline',
      };
    }

    const isUpgrade =
      (currentTier === 'low' && (tier === 'mid' || tier === 'high')) ||
      (currentTier === 'mid' && tier === 'high');

    if (
      (tier === 'low' && isSwitchingToLow) ||
      (tier === 'mid' && isSwitchingToMid) ||
      (tier === 'high' && isSwitchingToHigh)
    ) {
      return isUpgrade
        ? {
            children: isSwitchingToHigh ? (
              <>
                <Loader2Icon className="animate-spin" />
                {tModal('upgrading')}
              </>
            ) : (
              tModal('upgrading')
            ),
            disabled: isSubmitting,
          }
        : {
            children: isSwitchingToLow ? (
              <>
                <Loader2Icon className="animate-spin" />
                {tModal('downgrading')}
              </>
            ) : (
              tModal('downgrading')
            ),
            disabled: isSubmitting,
          };
    }

    return isUpgrade
      ? { children: tModal('upgrade-button'), disabled: isSubmitting }
      : {
          children: tModal('downgrade-button'),
          variant: 'outline',
          disabled: isSubmitting,
        };
  };

  return (
    <>
      <Tabs value={billingPeriod} onValueChange={setBillingPeriod}>
        <div className="mb-4 flex flex-col items-center gap-3 sm:flex-row md:mb-2">
          <TabsList>
            <TabsTrigger value="monthly">{t('monthly')}</TabsTrigger>
            <TabsTrigger value="annual">{t('annual')}</TabsTrigger>
          </TabsList>

          {billingPeriod === 'monthly' && (
            <p className="text-primary text-sm">{t('save-annually')}</p>
          )}
        </div>

        <TabsContent value="monthly">
          <TierContainer>
            <TierGrid>
              {/* Low Tier */}
              <TierCard>
                <TierCardHeader>
                  <TierCardTitle>{t('plans.hobby.title')}</TierCardTitle>

                  <TierCardPrice>
                    {
                      <Trans
                        i18nKey="billing:pricing.price"
                        values={{ price: '$17' }}
                        components={{
                          1: (
                            <span className="text-muted-foreground text-sm font-normal" />
                          ),
                        }}
                      />
                    }
                  </TierCardPrice>

                  <TierCardDescription>
                    {t('plans.hobby.description')}
                  </TierCardDescription>

                  <Button
                    className="w-full"
                    type="submit"
                    {...getButtonProps('monthly', 'low')}
                  />
                </TierCardHeader>

                <Separator />

                <TierCardContent>
                  <FeaturesListTitle>
                    {t('plans.hobby.features-title')}
                  </FeaturesListTitle>
                  <FeaturesList>
                    {getFeatures('hobby').map(feature => (
                      <FeatureListItem key={feature}>
                        <CheckIcon />
                        {feature}
                      </FeatureListItem>
                    ))}
                  </FeaturesList>
                </TierCardContent>
              </TierCard>

              {/* Mid Tier */}
              <TierCard>
                <TierCardHeader>
                  <TierCardTitle>{t('plans.startup.title')}</TierCardTitle>

                  <TierCardPrice>
                    <Trans
                      i18nKey="billing:pricing.price"
                      values={{ price: '$30' }}
                      components={{
                        1: (
                          <span className="text-muted-foreground text-sm font-normal" />
                        ),
                      }}
                    />
                  </TierCardPrice>

                  <TierCardDescription>
                    {t('plans.startup.description')}
                  </TierCardDescription>

                  <Button
                    className="w-full"
                    type="submit"
                    {...getButtonProps('monthly', 'mid')}
                  />
                </TierCardHeader>

                <Separator />

                <TierCardContent>
                  <FeaturesListTitle>
                    {t('plans.startup.features-title')}
                  </FeaturesListTitle>

                  <FeaturesList>
                    {getFeatures('startup').map(feature => (
                      <FeatureListItem key={feature}>
                        <CheckIcon />
                        {feature}
                      </FeatureListItem>
                    ))}
                  </FeaturesList>
                </TierCardContent>
              </TierCard>

              {/* High Tier */}
              <TierCard className="ring-primary -mt-1.5 ring-2">
                <TierCardHeader>
                  <TierCardTitle className="text-primary">
                    {t('plans.business.title')}
                    <Badge>{t('most-popular')}</Badge>
                  </TierCardTitle>

                  <TierCardPrice>
                    <Trans
                      i18nKey="billing:pricing.price"
                      values={{ price: '$55' }}
                      components={{
                        1: (
                          <span className="text-muted-foreground text-sm font-normal" />
                        ),
                      }}
                    />
                  </TierCardPrice>

                  <TierCardDescription>
                    {t('plans.business.description')}
                  </TierCardDescription>

                  <Button
                    className="w-full"
                    type="submit"
                    {...getButtonProps('monthly', 'high')}
                  />
                </TierCardHeader>

                <Separator />

                <TierCardContent>
                  <FeaturesListTitle>
                    {t('plans.business.features-title')}
                  </FeaturesListTitle>

                  <FeaturesList>
                    {getFeatures('business').map(feature => (
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
              {/* Low Tier */}
              <TierCard>
                <TierCardHeader>
                  <TierCardTitle>{t('plans.hobby.title')}</TierCardTitle>

                  <TierCardPrice>
                    {
                      <Trans
                        i18nKey="billing:pricing.price"
                        values={{ price: '$15' }}
                        components={{
                          1: (
                            <span className="text-muted-foreground text-sm font-normal" />
                          ),
                        }}
                      />
                    }

                    <OfferBadge>-10%</OfferBadge>
                  </TierCardPrice>

                  <TierCardDescription>
                    {t('plans.hobby.description')}
                  </TierCardDescription>

                  <Button
                    className="w-full"
                    type="submit"
                    {...getButtonProps('annual', 'low')}
                  />
                </TierCardHeader>

                <Separator />

                <TierCardContent>
                  <FeaturesListTitle>
                    {t('plans.hobby.features-title')}
                  </FeaturesListTitle>

                  <FeaturesList>
                    {getFeatures('hobby').map(feature => (
                      <FeatureListItem key={feature}>
                        <CheckIcon />
                        {feature}
                      </FeatureListItem>
                    ))}
                  </FeaturesList>
                </TierCardContent>
              </TierCard>

              {/* Mid Tier */}
              <TierCard>
                <TierCardHeader>
                  <TierCardTitle>{t('plans.startup.title')}</TierCardTitle>

                  <TierCardPrice>
                    <Trans
                      i18nKey="billing:pricing.price"
                      values={{ price: '$25' }}
                      components={{
                        1: (
                          <span className="text-muted-foreground text-sm font-normal" />
                        ),
                      }}
                    />

                    <OfferBadge>-15%</OfferBadge>
                  </TierCardPrice>

                  <TierCardDescription>
                    {t('plans.startup.description')}
                  </TierCardDescription>

                  <Button
                    className="w-full"
                    type="submit"
                    {...getButtonProps('annual', 'mid')}
                  />
                </TierCardHeader>

                <Separator />

                <TierCardContent>
                  <FeaturesListTitle>
                    {t('plans.startup.features-title')}
                  </FeaturesListTitle>

                  <FeaturesList>
                    {getFeatures('startup').map(feature => (
                      <FeatureListItem key={feature}>
                        <CheckIcon />
                        {feature}
                      </FeatureListItem>
                    ))}
                  </FeaturesList>
                </TierCardContent>
              </TierCard>

              {/* High Tier */}
              <TierCard className="ring-primary -mt-1.5 ring-2">
                <TierCardHeader>
                  <TierCardTitle className="text-primary">
                    {t('plans.business.title')}
                    <Badge>{t('most-popular')}</Badge>
                  </TierCardTitle>

                  <TierCardPrice>
                    <Trans
                      i18nKey="billing:pricing.price"
                      values={{ price: '$45' }}
                      components={{
                        1: (
                          <span className="text-muted-foreground text-sm font-normal" />
                        ),
                      }}
                    />

                    <OfferBadge>-20%</OfferBadge>
                  </TierCardPrice>

                  <TierCardDescription>
                    {t('plans.business.description')}
                  </TierCardDescription>

                  <Button
                    className="w-full"
                    type="submit"
                    {...getButtonProps('annual', 'high')}
                  />
                </TierCardHeader>

                <Separator />

                <TierCardContent>
                  <FeaturesListTitle>
                    {t('plans.business.features-title')}
                  </FeaturesListTitle>

                  <FeaturesList>
                    {getFeatures('business').map(feature => (
                      <FeatureListItem key={feature}>
                        <CheckIcon />
                        {feature}
                      </FeatureListItem>
                    ))}
                  </FeaturesList>
                </TierCardContent>
              </TierCard>

              {/* Enterprise Tier */}
              <TierCard className="@4xl/tiers:col-start-2 @6xl/tiers:col-start-auto">
                <TierCardHeader>
                  <TierCardTitle>{t('plans.enterprise.title')}</TierCardTitle>

                  <TierCardPrice>{t('custom')}</TierCardPrice>

                  <TierCardDescription>
                    {t('plans.enterprise.description')}
                  </TierCardDescription>

                  <Button asChild className="w-full">
                    <Link to={href('/contact-sales')}>
                      {t('plans.enterprise.cta')}
                    </Link>
                  </Button>
                </TierCardHeader>

                <Separator />

                <TierCardContent>
                  <FeaturesListTitle>
                    {t('plans.enterprise.features-title')}
                  </FeaturesListTitle>

                  <FeaturesList>
                    {getFeatures('enterprise').map(feature => (
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

      {canCancelSubscription && (
        <>
          <Separator />

          <div className="@container/alert">
            <Alert className="flex flex-col gap-2 @5xl/alert:block">
              <AlertTitle>
                {tModal('cancel-subscription-banner.title')}
              </AlertTitle>

              <AlertDescription>
                {tModal('cancel-subscription-banner.description')}
              </AlertDescription>

              <Button
                className="shadow-none @5xl/alert:absolute @5xl/alert:top-1/2 @5xl/alert:right-3 @5xl/alert:-translate-y-1/2"
                disabled={isSubmitting}
                onClick={onCancelSubscriptionClick}
                type="button"
                variant="outline"
              >
                {tModal('cancel-subscription-banner.button')}
              </Button>
            </Alert>
          </div>
        </>
      )}
    </>
  );
}
