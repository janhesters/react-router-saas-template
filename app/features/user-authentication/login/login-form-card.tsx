import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon } from 'lucide-react';
import type { FieldErrors } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Form, Link, useSubmit } from 'react-router';
import { z } from 'zod';

import { GooggleIcon } from '~/components/svgs/google-icon';
import { Button, buttonVariants } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormProvider,
} from '~/components/ui/form';
import { Input } from '~/components/ui/input';
import { cn } from '~/lib/utils';

import { loginIntents } from '../user-authentication-constants';

export const loginWithEmailSchema = z.object({
  intent: z.literal(loginIntents.loginWithEmail),
  email: z
    .string({
      invalid_type_error: 'user-authentication:common.email-must-be-string',
    })
    .min(1, 'user-authentication:common.email-required')
    .email('user-authentication:common.email-invalid'),
});

type LoginWithEmailSchema = z.infer<typeof loginWithEmailSchema>;
export type EmailLoginErrors = FieldErrors<LoginWithEmailSchema>;

export const loginWithGoogleSchema = z.object({
  intent: z.literal(loginIntents.loginWithGoogle),
});

type LoginWithGoogleSchema = z.infer<typeof loginWithGoogleSchema>;

export type LoginFormCardProps = {
  errors?: EmailLoginErrors;
  isLoggingInWithEmail?: boolean;
  isLoggingInWithGoogle?: boolean;
  isSubmitting?: boolean;
};

export function LoginFormCard({
  errors,
  isLoggingInWithEmail = false,
  isLoggingInWithGoogle = false,
  isSubmitting = false,
}: LoginFormCardProps) {
  const { t } = useTranslation('user-authentication');
  const submit = useSubmit();

  /* Email Login Form */

  const emailForm = useForm<LoginWithEmailSchema>({
    resolver: zodResolver(loginWithEmailSchema),
    defaultValues: {
      intent: loginIntents.loginWithEmail,
      email: '',
    },
    errors,
  });

  const handleEmailSubmit = async (values: LoginWithEmailSchema) => {
    await submit(values, { method: 'POST' });
  };

  /* Google Login Form */

  const googleForm = useForm<LoginWithGoogleSchema>({
    resolver: zodResolver(loginWithGoogleSchema),
    defaultValues: {
      intent: loginIntents.loginWithGoogle,
    },
  });

  const handleGoogleSubmit = async (values: LoginWithGoogleSchema) => {
    await submit(values, { method: 'POST' });
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">{t('login.form.cardTitle')}</CardTitle>

        <CardDescription>{t('login.form.cardDescription')}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid gap-6">
          {/* Email Login Form */}
          <FormProvider {...emailForm}>
            <Form
              method="POST"
              onSubmit={emailForm.handleSubmit(handleEmailSubmit)}
            >
              <fieldset className="grid gap-6" disabled={isSubmitting}>
                <FormField
                  control={emailForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('login.form.email')}</FormLabel>

                      <FormControl>
                        <Input
                          autoComplete="email"
                          placeholder={t('login.form.emailPlaceholder')}
                          required
                          type="email"
                          {...field}
                        />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  className="w-full"
                  name="intent"
                  value={loginIntents.loginWithEmail}
                  type="submit"
                >
                  {isLoggingInWithEmail ? (
                    <>
                      <Loader2Icon className="animate-spin" />
                      {t('login.form.submitButtonLoading')}
                    </>
                  ) : (
                    t('login.form.submitButton')
                  )}
                </Button>
              </fieldset>
            </Form>
          </FormProvider>

          <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
            <span className="bg-card text-muted-foreground relative z-10 px-2">
              {t('login.form.dividerText')}
            </span>
          </div>

          {/* Google Login Form */}
          <FormProvider {...googleForm}>
            <Form
              method="POST"
              onSubmit={googleForm.handleSubmit(handleGoogleSubmit)}
            >
              <fieldset className="flex flex-col gap-4" disabled={isSubmitting}>
                <Button
                  className="w-full"
                  name="intent"
                  type="submit"
                  value={loginIntents.loginWithGoogle}
                  variant="outline"
                >
                  {isLoggingInWithGoogle ? (
                    <>
                      <Loader2Icon className="animate-spin" />
                      {t('login.form.google')}
                    </>
                  ) : (
                    <>
                      <GooggleIcon />
                      {t('login.form.google')}
                    </>
                  )}
                </Button>
              </fieldset>
            </Form>
          </FormProvider>

          <div className="text-center text-sm">
            {t('login.form.registerPrompt')}{' '}
            <Link
              to="/register"
              className={cn(
                buttonVariants({ variant: 'link' }),
                'text-card-foreground hover:text-primary max-h-min p-0 underline underline-offset-4',
              )}
            >
              {t('login.form.registerLink')}
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
