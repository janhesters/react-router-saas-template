import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon } from 'lucide-react';
import { useRef } from 'react';
import type { FieldErrors } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
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
import { toFormData } from '~/utils/to-form-data'; // Assuming this doesn't handle Files by default like in the reference

import { UPDATE_USER_ACCOUNT_INTENT } from './account-settings-constants';
import type { UpdateUserAccountFormSchema } from './account-settings-schemas';
import { updateUserAccountFormSchema } from './account-settings-schemas';

export type UpdateUserAccountFormErrors =
  FieldErrors<UpdateUserAccountFormSchema>;

export type AccountSettingsProps = {
  errors?: UpdateUserAccountFormErrors;
  isUpdatingUserAccount?: boolean;
  user: {
    name: string;
    email: string;
    imageUrl?: string;
  };
};

export function AccountSettings({
  errors,
  isUpdatingUserAccount = false,
  user,
}: AccountSettingsProps) {
  const { t } = useTranslation('settings', {
    keyPrefix: 'user-account.form',
  });
  const submit = useSubmit();
  const avatarInputReference = useRef<HTMLInputElement>(null);

  const form = useForm<UpdateUserAccountFormSchema>({
    resolver: zodResolver(updateUserAccountFormSchema),
    defaultValues: {
      avatar: undefined,
      intent: UPDATE_USER_ACCOUNT_INTENT,
      name: user.name,
      email: user.email,
    },
    errors,
  });

  const handleSubmit = async (
    values: z.infer<typeof updateUserAccountFormSchema>,
  ) => {
    // Submit without encType, matching the reference
    await submit(toFormData(values), { method: 'POST' });
  };

  return (
    <FormProvider {...form}>
      <Form
        id="update-user-account-form"
        method="POST"
        onSubmit={form.handleSubmit(handleSubmit)}
        replace
      >
        <fieldset
          className="flex flex-col gap-y-6 sm:gap-y-8"
          disabled={isUpdatingUserAccount}
        >
          {/* Name Field - Unchanged */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="grid gap-x-8 sm:grid-cols-2">
                <div className="space-y-1">
                  <FormLabel>{t('name-label')}</FormLabel>

                  <FormDescription>{t('name-description')}</FormDescription>
                </div>

                <div className="grid gap-2">
                  <FormControl>
                    <Input
                      autoComplete="name"
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

          {/* Email Field - Read Only */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="grid gap-x-8 sm:grid-cols-2">
                <div className="space-y-1">
                  <FormLabel>{t('email-label')}</FormLabel>
                  <FormDescription>{t('email-description')}</FormDescription>
                </div>

                <div className="grid gap-2">
                  <FormControl>
                    <Input
                      autoComplete="email"
                      disabled
                      readOnly
                      placeholder={t('email-placeholder')}
                      {...field}
                      value={user.email}
                    />
                  </FormControl>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          {/* Avatar Field */}
          <FormField
            control={form.control}
            name="avatar"
            render={({ field: { onChange } }) => (
              <FormItem className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <div className="flex flex-row items-center justify-between gap-4 sm:block sm:flex-col">
                  <div className="space-y-2">
                    <FormLabel htmlFor="userAvatar">
                      {t('avatar-label')}
                    </FormLabel>

                    <FormControl>
                      <div>
                        <div className="sm:hidden">
                          <Input
                            id="userAvatar"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className={cn(
                              form.formState.errors.avatar &&
                                'border-destructive',
                            )}
                            ref={avatarInputReference}
                            onChange={event => {
                              const file = event.target.files?.[0];
                              if (file) {
                                onChange(file);
                                form.setValue('avatar', file);
                              }
                            }}
                          />
                        </div>

                        <div className="hidden sm:mt-4 sm:block">
                          <DragAndDrop
                            id="userAvatarDesktop"
                            accept="image/jpeg,image/png,image/webp"
                            className={cn(
                              form.formState.errors.avatar &&
                                'border-destructive',
                              'h-32',
                            )}
                            disabled={isUpdatingUserAccount}
                            multiple={false}
                            onFileChosen={file => {
                              onChange(file);
                              form.setValue('avatar', file);
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
                        alt={t('avatar-alt')}
                        className="aspect-square h-full rounded-md object-cover"
                        src={user.imageUrl}
                      />
                      <AvatarFallback className="rounded-md text-2xl">
                        {user.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>

                <div className="hidden flex-col gap-4 sm:flex">
                  <FormLabel className="invisible" aria-hidden="true">
                    {t('avatar-label')}
                  </FormLabel>

                  <div className="flex h-32 justify-end">
                    <Avatar className="aspect-square size-32 rounded-md">
                      <AvatarImage
                        alt={t('avatar-alt')}
                        className="aspect-square h-full w-full rounded-md object-cover"
                        src={user.imageUrl}
                      />
                      <AvatarFallback className="rounded-md text-4xl">
                        {user.name.slice(0, 2).toUpperCase()}
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
              disabled={isUpdatingUserAccount}
              type="submit"
            >
              {isUpdatingUserAccount ? (
                <>
                  <Loader2Icon className="mr-2 size-4 animate-spin" />
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
