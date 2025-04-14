import { zodResolver } from '@hookform/resolvers/zod';
import type { UserAccount } from '@prisma/client';
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

import { AVATAR_PATH_PREFIX, BUCKET_NAME } from '../../user-account-constants';
import { UPDATE_USER_ACCOUNT_INTENT } from './account-settings-constants';
import type { UpdateUserAccountFormSchema } from './account-settings-schemas';
import { updateUserAccountFormSchema } from './account-settings-schemas';

export type UpdateUserAccountFormErrors =
  FieldErrors<UpdateUserAccountFormSchema>;

export type AccountSettingsProps = {
  errors?: UpdateUserAccountFormErrors;
  isUpdatingUserAccount?: boolean;
  user: {
    name: UserAccount['name'];
    email: UserAccount['email'];
    imageUrl?: UserAccount['imageUrl'];
    id: UserAccount['id'];
  };
};

export const getStoragePathFromUrl = (
  imageUrl: string | null | undefined,
): string => {
  if (!imageUrl) return '';
  try {
    const url = new URL(imageUrl);
    // Example URL: https://<project-ref>.supabase.co/storage/v1/object/public/app-images/user-avatars/user_id/avatar.png
    // We need the part after the bucket name: "user-avatars/user_id/avatar.png"
    const pathSegments = url.pathname.split('/');
    const bucketIndex = pathSegments.indexOf(BUCKET_NAME);
    if (bucketIndex === -1 || bucketIndex + 1 >= pathSegments.length) {
      console.warn('Could not extract storage path from URL:', imageUrl);
      return '';
    }
    return pathSegments.slice(bucketIndex + 1).join('/');
  } catch (error) {
    console.error('Error parsing image URL:', error);
    return '';
  }
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

  // Construct the specific path for this user's avatars
  const userAvatarPath = `${AVATAR_PATH_PREFIX}/${user.id}`;

  const uploadHandler = useSupabaseUpload({
    bucketName: BUCKET_NAME,
    path: userAvatarPath,
    maxFiles: 1,
    maxFileSize: 1000 * 1000, // 1MB
    allowedMimeTypes: ['image/*'],
    upsert: true,
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
      const newFile = uploadHandler.files[0];

      try {
        // --- 1. Upload the new avatar ---
        const isUploadSuccess = await uploadHandler.onUpload();

        if (isUploadSuccess) {
          // --- 2. Get the public URL of the newly uploaded file ---
          const newFilePath = `${userAvatarPath}/${newFile.name}`;
          const { data: publicUrlData } = uploadHandler.supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(newFilePath, {
              transform: { width: 128, height: 128, resize: 'cover' },
            });

          const newPublicUrl = publicUrlData.publicUrl;

          // --- 3. Delete the old avatar (if it exists) ---
          const oldStoragePath = getStoragePathFromUrl(user.imageUrl);

          if (oldStoragePath && oldStoragePath !== newFilePath) {
            const { error: deleteError } = await uploadHandler.supabase.storage
              .from(BUCKET_NAME)
              .remove([oldStoragePath]);

            if (deleteError) {
              form.setError('avatar', {
                message: t('errors.delete-old-avatar-failed'),
              });
            }
          } else if (oldStoragePath === newFilePath) {
            // New avatar path is the same as the old one. Skipping deletion.
          }

          // --- 4. Submit the form with the NEW avatar URL ---
          await submit(toFormData({ ...values, avatar: newPublicUrl }), {
            method: 'POST',
            replace: true,
          });
        } else {
          // Upload failed (hook's onUpload returned false)
          form.setError('avatar', {
            message: t('errors.upload-failed'),
          });
        }
      } catch {
        // Catch unexpected errors during the process (e.g., network issues)
        form.setError('avatar', {
          message: t('errors.unexpected-error'),
        });
      }
    } else {
      // No avatar to upload, just submit the form as is
      await submit(toFormData(values), { method: 'POST', replace: true });
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
            render={({ field }) => (
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
                        ...field,
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
