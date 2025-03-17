import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon } from 'lucide-react';
import type { FieldErrors } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Form, useSubmit } from 'react-router';
import { z } from 'zod';

import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormProvider,
} from '~/components/ui/form';
import { Input } from '~/components/ui/input';

import { onboardingIntents } from '../onboarding-constants';

export const onboardingOrganizationSchema = z.object({
  name: z
    .string({
      invalid_type_error: 'onboarding:organization.name-must-be-string',
    })
    .trim()
    .min(3, 'onboarding:organization.name-min-length')
    .max(255, 'onboarding:organization.name-max-length'),
  intent: z.literal(onboardingIntents.createOrganization),
});

type OnboardingOrganizationSchema = z.infer<
  typeof onboardingOrganizationSchema
>;
export type OnboardingOrganizationErrors =
  FieldErrors<OnboardingOrganizationSchema>;

export type OnboardingOrganizationFormCardProps = {
  errors?: OnboardingOrganizationErrors;
  isCreatingOrganization?: boolean;
};

export function OnboardingOrganizationFormCard({
  errors,
  isCreatingOrganization = false,
}: OnboardingOrganizationFormCardProps) {
  const { t } = useTranslation('onboarding', { keyPrefix: 'organization' });
  const submit = useSubmit();

  const form = useForm<z.infer<typeof onboardingOrganizationSchema>>({
    resolver: zodResolver(onboardingOrganizationSchema),
    defaultValues: {
      intent: onboardingIntents.createOrganization,
      name: '',
    },
    errors,
  });

  const handleSubmit = async (
    values: z.infer<typeof onboardingOrganizationSchema>,
  ) => {
    await submit(values, { method: 'POST' });
  };

  return (
    <Card className="m-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>{t('card-title')}</CardTitle>

        <CardDescription>{t('card-description')}</CardDescription>
      </CardHeader>

      <CardContent>
        <FormProvider {...form}>
          <Form
            id="organization-form"
            method="POST"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <fieldset disabled={isCreatingOrganization}>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('organization-name-label')}</FormLabel>

                    <FormControl>
                      <Input
                        autoComplete="organization"
                        autoFocus
                        placeholder={t('organization-name-placeholder')}
                        required
                        {...field}
                      />
                    </FormControl>

                    <FormDescription>
                      {t('organization-name-description')}
                    </FormDescription>

                    <FormMessage />
                  </FormItem>
                )}
              />
            </fieldset>
          </Form>
        </FormProvider>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          disabled={isCreatingOrganization}
          form="organization-form"
          name="intent"
          type="submit"
          value={onboardingIntents.createOrganization}
        >
          {isCreatingOrganization ? (
            <>
              <Loader2Icon className="mr-2 size-4 animate-spin" />
              {t('saving')}
            </>
          ) : (
            <>{t('save')}</>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
