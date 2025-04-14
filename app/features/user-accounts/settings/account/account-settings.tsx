import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon } from 'lucide-react';
import type { FieldErrors } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Form, useSubmit } from 'react-router';
import type { z } from 'zod';

import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from '~/components/dropzone';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Button } from '~/components/ui/button';
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
import { useSupabaseUpload } from '~/hooks/use-supabase-upload';
import { toFormData } from '~/utils/to-form-data';

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
    id: string;
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

  const path = `user-avatars/${user.id}`;
  const uploadHandler = useSupabaseUpload({
    bucketName: 'app-images',
    path,
    maxFiles: 1,
    maxFileSize: 1000 * 1000, // 1MB
    allowedMimeTypes: ['image/*'],
    upsert: false,
  });

  const form = useForm<UpdateUserAccountFormSchema>({
    resolver: zodResolver(updateUserAccountFormSchema),
    defaultValues: {
      intent: UPDATE_USER_ACCOUNT_INTENT,
      name: user.name,
      email: user.email,
      avatar: undefined,
    },
    errors: errors,
  });

  const handleSubmit = async (
    values: z.infer<typeof updateUserAccountFormSchema>,
  ) => {
    if (uploadHandler.files.length > 0) {
      const isUploadSuccess = await uploadHandler.onUpload();

      if (isUploadSuccess) {
        // Get the public URL of the uploaded file
        const {
          data: { publicUrl },
        } = uploadHandler.supabase.storage
          .from('app-images')
          .getPublicUrl(`${path}/${uploadHandler.files[0].name}`, {
            transform: { width: 128, height: 128, resize: 'cover' },
          });
        // Submit the form with the avatar URL
        await submit(toFormData({ ...values, avatar: publicUrl }), {
          method: 'POST',
        });
      }
    } else {
      // No avatar to upload, just submit the form as is
      await submit(toFormData(values), { method: 'POST' });
    }
  };

  const isFormDisabled = isUpdatingUserAccount || uploadHandler.loading;

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
          disabled={isFormDisabled}
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
            render={() => (
              <FormItem className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <div className="space-y-1">
                  <FormLabel htmlFor="userAvatar">
                    {t('avatar-label')}
                  </FormLabel>

                  <FormDescription>{t('avatar-description')}</FormDescription>
                </div>

                <div className="grid gap-4">
                  <FormControl>
                    <Dropzone
                      {...uploadHandler}
                      getInputProps={props => ({
                        ...uploadHandler.getInputProps(props),
                        id: 'userAvatar',
                      })}
                    >
                      <DropzoneEmptyState />
                      <DropzoneContent />
                    </Dropzone>
                  </FormControl>

                  <div className="flex justify-end">
                    <Avatar className="size-32 rounded-md">
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

                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <div className="sm:col-start-2">
            <Button className="w-fit" disabled={isFormDisabled} type="submit">
              {isFormDisabled ? (
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
