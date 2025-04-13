import { zodResolver } from '@hookform/resolvers/zod';
import type { Organization } from '@prisma/client';
import { Loader2Icon } from 'lucide-react';
import { useRef } from 'react';
import type { FieldErrors } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';
import { Form, useSubmit } from 'react-router';
import type { z } from 'zod';

import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Button } from '~/components/ui/button';
import { DragAndDrop } from '~/components/ui/drag-and-drop';
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
import { cn } from '~/lib/utils';
import { toFormData } from '~/utils/to-form-data';

import { UPDATE_ORGANIZATION_INTENT } from './general-settings-constants';
import type { UpdateOrganizationFormSchema } from './general-settings-schemas';
import { updateOrganizationFormSchema } from './general-settings-schemas';

export type UpdateOrganizationFormErrors =
  FieldErrors<UpdateOrganizationFormSchema>;

export type GeneralOrganizationSettingsProps = {
  errors?: UpdateOrganizationFormErrors;
  isUpdatingOrganization?: boolean;
  organization: Pick<Organization, 'name' | 'imageUrl'>;
};

export function GeneralOrganizationSettings({
  errors,
  isUpdatingOrganization = false,
  organization,
}: GeneralOrganizationSettingsProps) {
  const { t } = useTranslation('organizations', {
    keyPrefix: 'settings.general.form',
  });
  const submit = useSubmit();
  const logoInputReference = useRef<HTMLInputElement>(null);

  const form = useForm<UpdateOrganizationFormSchema>({
    resolver: zodResolver(updateOrganizationFormSchema),
    defaultValues: {
      intent: UPDATE_ORGANIZATION_INTENT,
      name: organization.name,
      logo: undefined,
    },
    errors,
  });

  const handleSubmit = async (
    values: z.infer<typeof updateOrganizationFormSchema>,
  ) => {
    await submit(toFormData(values), { method: 'POST' });
  };

  return (
    <FormProvider {...form}>
      <Form
        id="update-organization-form"
        method="POST"
        onSubmit={form.handleSubmit(handleSubmit)}
        replace
      >
        <fieldset
          className="flex flex-col gap-y-6 sm:gap-y-8"
          disabled={isUpdatingOrganization}
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="grid gap-x-8 sm:grid-cols-2">
                <div className="space-y-1">
                  <FormLabel>{t('name-label')}</FormLabel>

                  <FormDescription>
                    <Trans
                      i18nKey="organizations:settings.general.form.name-description"
                      components={{
                        1: <span className="font-bold">Warning:</span>,
                      }}
                    />
                  </FormDescription>
                </div>

                <div className="grid gap-2">
                  <FormControl>
                    <Input
                      autoComplete="organization"
                      placeholder={t('name-placeholder')}
                      required
                      {...field}
                    />
                  </FormControl>

                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="logo"
            render={({ field: { onChange } }) => (
              <FormItem className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <div className="flex flex-row items-center justify-between gap-4 sm:block sm:flex-col">
                  <div className="space-y-2">
                    <FormLabel htmlFor="organizationLogo">
                      {t('logo-label')}
                    </FormLabel>

                    <FormControl>
                      <div>
                        <div className="sm:hidden">
                          <Input
                            accept="image/jpeg,image/png"
                            className={cn(
                              form.formState.errors.logo &&
                                'border-destructive',
                            )}
                            id="organizationLogo"
                            onChange={event => {
                              const file = event.target.files?.[0];
                              if (file) {
                                onChange(file);
                                form.setValue('logo', file);
                              }
                            }}
                            ref={logoInputReference}
                            type="file"
                          />
                        </div>

                        <div className="hidden sm:mt-4 sm:block">
                          <DragAndDrop
                            accept="image/jpeg,image/png"
                            className={cn(
                              form.formState.errors.logo &&
                                'border-destructive',
                              'h-32',
                            )}
                            disabled={isUpdatingOrganization}
                            id="organizationLogoDesktop"
                            multiple={false}
                            name="logo"
                            onFileChosen={file => {
                              onChange(file);
                              form.setValue('logo', file);
                            }}
                          />
                        </div>
                      </div>
                    </FormControl>

                    <FormMessage />
                  </div>

                  <div className="sm:hidden">
                    <Avatar className="size-16 rounded-md">
                      <AvatarImage
                        alt={t('logo-label')}
                        className="aspect-square h-full rounded-md object-cover"
                        src={organization.imageUrl}
                      />
                      <AvatarFallback className="rounded-md text-2xl">
                        {organization.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>

                <div className="hidden flex-col gap-4 sm:flex">
                  <FormLabel className="invisible" aria-hidden="true">
                    {t('logo-label')}
                  </FormLabel>

                  <div className="flex h-32 justify-end">
                    <Avatar className="aspect-square size-32 rounded-md">
                      <AvatarImage
                        alt={t('logo-label')}
                        className="aspect-square h-full w-full rounded-md object-cover"
                        src={organization.imageUrl}
                      />
                      <AvatarFallback className="rounded-md text-4xl">
                        {organization.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
              </FormItem>
            )}
          />

          <div className="sm:col-start-2">
            <Button
              className="w-fit"
              disabled={isUpdatingOrganization}
              name="intent"
              type="submit"
            >
              {isUpdatingOrganization ? (
                <>
                  <Loader2Icon className="animate-spin" />
                  {t('saving')}
                </>
              ) : (
                <>{t('save')}</>
              )}
            </Button>
          </div>
        </fieldset>
      </Form>
    </FormProvider>
  );
}
