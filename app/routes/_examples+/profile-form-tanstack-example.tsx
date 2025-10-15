/* eslint-disable unicorn/no-null */
import { parseFormData } from '@mjackson/form-data-parser';
import { mergeForm, useForm, useTransform } from '@tanstack/react-form';
import {
  createServerValidate,
  formOptions,
  initialFormState,
  ServerValidateError,
} from '@tanstack/react-form/remix';
import { Form, useNavigation, useSubmit } from 'react-router';
import { z } from 'zod';

import AvatarUpload from '~/components/file-upload/avatar-upload';
import CoverUpload from '~/components/file-upload/cover-upload';
import { Button } from '~/components/ui/button';
import { Checkbox } from '~/components/ui/checkbox';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from '~/components/ui/field';
import { Input } from '~/components/ui/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '~/components/ui/input-group';
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { Spinner } from '~/components/ui/spinner';
import { Switch } from '~/components/ui/switch';
import { Textarea } from '~/components/ui/textarea';

import type { Route } from './+types/profile-form-tanstack-example';

export function loader() {
  return { email: 'test@test.com' };
}

const countries = [
  { flag: '🇺🇸', name: 'United States', code: 'US' },
  { flag: '🇨🇦', name: 'Canada', code: 'CA' },
  { flag: '🇬🇧', name: 'United Kingdom', code: 'GB' },
  { flag: '🇩🇪', name: 'Germany', code: 'DE' },
  { flag: '🇨🇭', name: 'Switzerland', code: 'CH' },
  { flag: '🇳🇱', name: 'Netherlands', code: 'NL' },
  { flag: '🇸🇪', name: 'Sweden', code: 'SE' },
  { flag: '🇳🇴', name: 'Norway', code: 'NO' },
  { flag: '🇩🇰', name: 'Denmark', code: 'DK' },
  { flag: '🇫🇮', name: 'Finland', code: 'FI' },
  { flag: '🇦🇹', name: 'Austria', code: 'AT' },
  { flag: '🇦🇺', name: 'Australia', code: 'AU' },
  { flag: '🇳🇿', name: 'New Zealand', code: 'NZ' },
  { flag: '🇸🇬', name: 'Singapore', code: 'SG' },
  { flag: '🇯🇵', name: 'Japan', code: 'JP' },
  { flag: '🇰🇷', name: 'South Korea', code: 'KR' },
  { flag: '🇮🇸', name: 'Iceland', code: 'IS' },
  { flag: '🇫🇷', name: 'France', code: 'FR' },
  { flag: '🇮🇪', name: 'Ireland', code: 'IE' },
] as const;

const notificationCategories = [
  { id: 'mentions', label: 'Mentions' },
  { id: 'directMessages', label: 'Direct messages' },
  { id: 'comments', label: 'Comments' },
  { id: 'betaInvites', label: 'Beta invites' },
  { id: 'productUpdates', label: 'Product updates' },
] as const;

const oneMB = 1024 * 1024;
const twoMB = 2 * 1024 * 1024;

const schema = z.object({
  username: z.string().min(3).max(32),
  bio: z.string(),
  avatar: z.union([z.file().max(oneMB), z.undefined()]),
  coverPhoto: z.union([z.file().max(twoMB), z.undefined()]),
  firstName: z.string(),
  lastName: z.string(),
  email: z.email(),
  country: z.string(),
  city: z.string(),
  zipCode: z.string(),
  streetName: z.string(),
  streetNumber: z.string(),
  billingPlan: z.enum(['starter', 'pro', 'team']),
  billingCycle: z.enum(['monthly', 'yearly']),
  paymentMethod: z.enum(['card', 'paypal']),
  notificationLevel: z.enum(['all', 'important', 'none']),
  emailNotificationComments: z.boolean(),
  emailNotificationFollowers: z.boolean(),
  emailNotificationProductUpdates: z.boolean(),
  emailNotificationSecurityAlerts: z.boolean(),
  notificationCategories: z.array(z.string()),
  privacyShowOnlineStatus: z.boolean(),
  privacyAllowEmailDiscovery: z.boolean(),
  privacyEnableReadReceipts: z.boolean(),
});

const formConfig = formOptions({
  defaultValues: {
    username: '',
    bio: '',
    avatar: undefined as File | undefined,
    coverPhoto: undefined as File | undefined,
    firstName: '',
    lastName: '',
    email: '',
    country: '',
    city: '',
    zipCode: '',
    streetName: '',
    streetNumber: '',
    billingPlan: 'starter',
    billingCycle: 'monthly',
    paymentMethod: 'card',
    notificationLevel: 'all',
    emailNotificationComments: false,
    emailNotificationFollowers: false,
    emailNotificationProductUpdates: false,
    emailNotificationSecurityAlerts: false,
    notificationCategories: [] as string[],
    privacyShowOnlineStatus: false,
    privacyAllowEmailDiscovery: false,
    privacyEnableReadReceipts: false,
  },
  validators: { onSubmit: schema },
});

const serverValidate = createServerValidate({
  ...formConfig,
  onServerValidate: ({ value }) => {
    const errors: Record<string, string> = {};

    if (value.avatar && !value.avatar.type.startsWith('image/')) {
      errors.avatar = 'Avatar must be an image.';
    }

    if (value.coverPhoto && !value.coverPhoto.type.startsWith('image/')) {
      errors.coverPhoto = 'Cover photo must be an image.';
    }

    if (Object.keys(errors).length > 0) {
      return { fields: errors };
    }
  },
});

export async function action({ request }: Route.ActionArgs) {
  try {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const formData = await parseFormData(request, { maxFiles: 2 });
    const validatedData = await serverValidate(formData);
    console.log('validatedData', validatedData);
  } catch (error) {
    if (error instanceof ServerValidateError) {
      console.log('server error', error.formState.errorMap.onServer);
      return error.formState;
    }

    throw error;
  }
}

export default function ProfileFormTanstackExample({
  actionData,
  loaderData,
}: Route.ComponentProps) {
  const submit = useSubmit();

  const form = useForm({
    ...formConfig,
    defaultValues: {
      ...formConfig.defaultValues,
      email: loaderData?.email,
    },
    transform: useTransform(
      baseForm => mergeForm(baseForm, actionData ?? initialFormState),
      [actionData],
    ),
    onSubmit: async ({ value: values }) => {
      const formData = new FormData();
      for (const [key, value] of Object.entries(values)) {
        if (value instanceof File) {
          formData.append(key, value);
        } else if (value !== undefined) {
          formData.append(key, String(value));
        }
      }
      await submit(formData, {
        method: 'POST',
        encType: 'multipart/form-data',
      });
    },
  });

  const navigation = useNavigation();

  const isSubmitting = navigation.state === 'submitting';

  return (
    <main className="p-4">
      <Form
        className="mx-auto max-w-4xl"
        encType="multipart/form-data"
        method="post"
        onSubmit={async event => {
          event.preventDefault();
          await form.handleSubmit();
        }}
      >
        <FieldSet disabled={isSubmitting}>
          <FieldGroup className="[&_[data-slot=field-error]]:mt-1 [&_[data-slot=field-legend][data-variant=label]]:mb-0 @md/field-group:[&_[data-slot=field][data-orientation=responsive]]:grid @md/field-group:[&_[data-slot=field][data-orientation=responsive]]:grid-cols-2 @md/field-group:[&_[data-slot=field][data-orientation=responsive]]:gap-x-8">
            <FieldSet>
              <FieldLegend>Profile</FieldLegend>

              <FieldDescription>
                This information will be displayed publicly so be careful what
                you share.
              </FieldDescription>

              <FieldGroup>
                <form.Field
                  name="username"
                  children={field => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <Field orientation="responsive" data-invalid={isInvalid}>
                        <FieldContent>
                          <FieldLabel htmlFor={field.name}>Username</FieldLabel>

                          <FieldDescription>
                            Your username uniquely identifies your account and
                            lets others find or tag you on the platform.
                          </FieldDescription>
                        </FieldContent>

                        <div>
                          <InputGroup>
                            <InputGroupAddon>
                              <InputGroupText>example.com/</InputGroupText>
                            </InputGroupAddon>

                            <InputGroupInput
                              aria-invalid={isInvalid}
                              id={field.name}
                              name={field.name}
                              onBlur={field.handleBlur}
                              onChange={event =>
                                field.handleChange(event.target.value)
                              }
                              placeholder="janhesters"
                              value={field.state.value}
                            />
                          </InputGroup>

                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </div>
                      </Field>
                    );
                  }}
                />

                <form.Field
                  name="bio"
                  children={field => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <Field orientation="responsive" data-invalid={isInvalid}>
                        <FieldContent>
                          <FieldLabel htmlFor={field.name}>Bio</FieldLabel>

                          <FieldDescription>
                            A few sentences about yourself.
                          </FieldDescription>
                        </FieldContent>

                        <div>
                          <Textarea
                            aria-invalid={isInvalid}
                            className="!field-sizing-fixed"
                            id={field.name}
                            name={field.name}
                            onBlur={field.handleBlur}
                            onChange={event =>
                              field.handleChange(event.target.value)
                            }
                            rows={3}
                            value={field.state.value}
                          />

                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </div>
                      </Field>
                    );
                  }}
                />

                <form.Field
                  name="avatar"
                  children={field => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;

                    return (
                      <Field orientation="responsive" data-invalid={isInvalid}>
                        <FieldContent>
                          <FieldLabel>Avatar</FieldLabel>

                          <FieldDescription>
                            Your avatar will appear next to your name across the
                            platform.
                          </FieldDescription>
                        </FieldContent>

                        <div>
                          <AvatarUpload
                            maxSize={oneMB}
                            onFileChange={file => {
                              const fileData = file?.file;
                              field.handleChange(
                                fileData instanceof File ? fileData : undefined,
                              );
                            }}
                          />

                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </div>
                      </Field>
                    );
                  }}
                />

                <form.Field
                  name="coverPhoto"
                  children={field => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;

                    return (
                      <Field
                        orientation="responsive"
                        className="@md/field-group:grid @md/field-group:grid-cols-2 @md/field-group:gap-x-8"
                        data-invalid={isInvalid}
                      >
                        <FieldContent>
                          <FieldLabel>Cover photo</FieldLabel>

                          <FieldDescription>
                            Add a banner image to personalize your profile.
                          </FieldDescription>
                        </FieldContent>

                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="mb-2 text-sm font-medium">
                            Cover Image Guidelines
                          </p>
                          <ul className="text-muted-foreground space-y-1 text-xs">
                            <li>
                              • Use high-quality images with good lighting and
                              composition
                            </li>
                            <li>
                              • Recommended aspect ratio: 21:9 (ultrawide) for
                              best results
                            </li>
                            <li>
                              • Avoid images with important content near the
                              edges
                            </li>
                            <li>• Supported formats: JPG, PNG, WebP</li>
                          </ul>
                        </div>

                        <div className="@md/field-group:col-span-2">
                          <CoverUpload
                            maxSize={twoMB}
                            onImageChange={file => {
                              field.handleChange(
                                file instanceof File ? file : undefined,
                              );
                            }}
                            className="[&>div>div]:aspect-[3.6/1]"
                          />

                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </div>
                      </Field>
                    );
                  }}
                />
              </FieldGroup>
            </FieldSet>

            <FieldSeparator />

            <FieldSet>
              <FieldLegend>Personal Information</FieldLegend>

              <FieldDescription>
                Use a permanent address where you can receive mail.
              </FieldDescription>

              <FieldGroup>
                <div className="grid gap-6 @md/field-group:grid-cols-2 @md/field-group:gap-x-8">
                  <form.Field
                    name="firstName"
                    children={field => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;

                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={field.name}>
                            First name
                          </FieldLabel>

                          <Input
                            aria-invalid={isInvalid}
                            id={field.name}
                            name={field.name}
                            onBlur={field.handleBlur}
                            onChange={event =>
                              field.handleChange(event.target.value)
                            }
                            value={field.state.value}
                          />

                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </Field>
                      );
                    }}
                  />

                  <form.Field
                    name="lastName"
                    children={field => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;

                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={field.name}>
                            Last name
                          </FieldLabel>

                          <Input
                            aria-invalid={isInvalid}
                            id={field.name}
                            name={field.name}
                            onBlur={field.handleBlur}
                            onChange={event =>
                              field.handleChange(event.target.value)
                            }
                            value={field.state.value}
                          />

                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </Field>
                      );
                    }}
                  />
                </div>

                <form.Field
                  name="email"
                  children={field => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;

                    return (
                      <Field orientation="responsive" data-invalid={isInvalid}>
                        <FieldContent>
                          <FieldLabel htmlFor={field.name}>Email</FieldLabel>

                          <FieldDescription>
                            Your email address is used to login to your account.
                          </FieldDescription>
                        </FieldContent>

                        <div>
                          <Input
                            aria-invalid={isInvalid}
                            id={field.name}
                            name={field.name}
                            onBlur={field.handleBlur}
                            onChange={event =>
                              field.handleChange(event.target.value)
                            }
                            readOnly
                            value={field.state.value}
                          />

                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </div>
                      </Field>
                    );
                  }}
                />

                <FieldSet>
                  <Field orientation="responsive">
                    <FieldContent>
                      <FieldLegend variant="label">Address</FieldLegend>

                      <FieldDescription>
                        Enter your current mailing address. This information is
                        used for account verification or official
                        correspondence.
                      </FieldDescription>
                    </FieldContent>

                    <div className="grid gap-6">
                      <form.Field
                        name="country"
                        children={field => {
                          const isInvalid =
                            field.state.meta.isTouched &&
                            !field.state.meta.isValid;
                          return (
                            <Field data-invalid={isInvalid}>
                              <FieldLabel className="sr-only">
                                Country
                              </FieldLabel>

                              <div>
                                <Select
                                  name={field.name}
                                  value={field.state.value}
                                  onValueChange={field.handleChange}
                                >
                                  <SelectTrigger
                                    className="w-full"
                                    id={field.name}
                                    aria-invalid={isInvalid}
                                  >
                                    <SelectValue placeholder="Choose country" />
                                  </SelectTrigger>

                                  <SelectContent>
                                    {countries.map(({ flag, name, code }) => (
                                      <SelectItem key={code} value={code}>
                                        {flag} {name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>

                                {isInvalid && (
                                  <FieldError
                                    errors={field.state.meta.errors}
                                  />
                                )}
                              </div>
                            </Field>
                          );
                        }}
                      />

                      <div>
                        <div className="grid gap-6 @md/field-group:grid-cols-3">
                          <form.Field
                            name="city"
                            children={field => {
                              const isInvalid =
                                field.state.meta.isTouched &&
                                !field.state.meta.isValid;
                              return (
                                <Field
                                  className="@md/field-group:col-span-2"
                                  data-invalid={isInvalid}
                                >
                                  <FieldLabel className="sr-only">
                                    City
                                  </FieldLabel>

                                  <Input
                                    aria-describedby={
                                      isInvalid
                                        ? `${field.name}-error`
                                        : undefined
                                    }
                                    aria-invalid={isInvalid}
                                    autoComplete="address-level2"
                                    id={field.name}
                                    name={field.name}
                                    onBlur={field.handleBlur}
                                    onChange={event =>
                                      field.handleChange(event.target.value)
                                    }
                                    placeholder="City"
                                    value={field.state.value}
                                  />
                                </Field>
                              );
                            }}
                          />

                          <form.Field
                            name="zipCode"
                            children={field => {
                              const isInvalid =
                                field.state.meta.isTouched &&
                                !field.state.meta.isValid;
                              return (
                                <Field data-invalid={isInvalid}>
                                  <FieldLabel className="sr-only">
                                    Zip code
                                  </FieldLabel>

                                  <Input
                                    aria-describedby={
                                      isInvalid
                                        ? `${field.name}-error`
                                        : undefined
                                    }
                                    aria-invalid={isInvalid}
                                    autoComplete="postal-code"
                                    id={field.name}
                                    name={field.name}
                                    onBlur={field.handleBlur}
                                    onChange={event =>
                                      field.handleChange(event.target.value)
                                    }
                                    placeholder="Zip code"
                                    value={field.state.value}
                                  />
                                </Field>
                              );
                            }}
                          />
                        </div>

                        <form.Subscribe
                          selector={state => [
                            state.fieldMeta.city,
                            state.fieldMeta.zipCode,
                          ]}
                          children={([cityMeta, zipCodeMeta]) => {
                            const cityInvalid =
                              cityMeta?.isTouched && !cityMeta?.isValid;
                            const zipCodeInvalid =
                              zipCodeMeta?.isTouched && !zipCodeMeta?.isValid;

                            if (!cityInvalid && !zipCodeInvalid) {
                              return null;
                            }

                            return (
                              <div className="mt-1">
                                {cityInvalid && (
                                  <div id="city-error">
                                    <FieldError errors={cityMeta.errors} />
                                  </div>
                                )}
                                {zipCodeInvalid && (
                                  <div id="zipCode-error">
                                    <FieldError errors={zipCodeMeta.errors} />
                                  </div>
                                )}
                              </div>
                            );
                          }}
                        />
                      </div>

                      <div>
                        <div className="grid gap-6 @md/field-group:grid-cols-5">
                          <form.Field
                            name="streetName"
                            children={field => {
                              const isInvalid =
                                field.state.meta.isTouched &&
                                !field.state.meta.isValid;
                              return (
                                <Field
                                  className="@md/field-group:col-span-4"
                                  data-invalid={isInvalid}
                                >
                                  <FieldLabel className="sr-only">
                                    Street name
                                  </FieldLabel>

                                  <Input
                                    aria-describedby={
                                      isInvalid
                                        ? `${field.name}-error`
                                        : undefined
                                    }
                                    aria-invalid={isInvalid}
                                    autoComplete="address-line1"
                                    id={field.name}
                                    name={field.name}
                                    onBlur={field.handleBlur}
                                    onChange={event =>
                                      field.handleChange(event.target.value)
                                    }
                                    placeholder="Street name"
                                    value={field.state.value}
                                  />
                                </Field>
                              );
                            }}
                          />

                          <form.Field
                            name="streetNumber"
                            children={field => {
                              const isInvalid =
                                field.state.meta.isTouched &&
                                !field.state.meta.isValid;
                              return (
                                <Field data-invalid={isInvalid}>
                                  <FieldLabel className="sr-only">
                                    Street number
                                  </FieldLabel>

                                  <Input
                                    aria-describedby={
                                      isInvalid
                                        ? `${field.name}-error`
                                        : undefined
                                    }
                                    aria-invalid={isInvalid}
                                    autoComplete="address-line2"
                                    id={field.name}
                                    name={field.name}
                                    onBlur={field.handleBlur}
                                    onChange={event =>
                                      field.handleChange(event.target.value)
                                    }
                                    placeholder="No."
                                    value={field.state.value}
                                  />
                                </Field>
                              );
                            }}
                          />
                        </div>

                        <form.Subscribe
                          selector={state => [
                            state.fieldMeta.streetName,
                            state.fieldMeta.streetNumber,
                          ]}
                          children={([streetNameMeta, streetNumberMeta]) => {
                            const streetNameInvalid =
                              streetNameMeta?.isTouched &&
                              !streetNameMeta?.isValid;
                            const streetNumberInvalid =
                              streetNumberMeta?.isTouched &&
                              !streetNumberMeta?.isValid;

                            if (!streetNameInvalid && !streetNumberInvalid) {
                              return null;
                            }

                            return (
                              <div className="mt-1">
                                {streetNameInvalid && (
                                  <div id="streetName-error">
                                    <FieldError
                                      errors={streetNameMeta.errors}
                                    />
                                  </div>
                                )}
                                {streetNumberInvalid && (
                                  <div id="streetNumber-error">
                                    <FieldError
                                      errors={streetNumberMeta.errors}
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          }}
                        />
                      </div>
                    </div>
                  </Field>
                </FieldSet>
              </FieldGroup>
            </FieldSet>

            <FieldSeparator />

            <FieldSet>
              <FieldLegend>Billing</FieldLegend>

              <FieldDescription>
                Manage your subscription, payment cycle, and upgrade options.
                Choose the plan and billing cadence that fit your team's needs.
              </FieldDescription>

              <FieldGroup>
                <form.Field
                  name="billingPlan"
                  children={field => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <FieldSet>
                        <Field
                          orientation="responsive"
                          data-invalid={isInvalid}
                        >
                          <FieldContent>
                            <FieldLabel htmlFor="billing-plan">
                              Billing Plan
                            </FieldLabel>

                            <FieldDescription>
                              Choose the plan that best fits your needs.
                            </FieldDescription>
                          </FieldContent>

                          <div>
                            <RadioGroup
                              name={field.name}
                              value={field.state.value}
                              onValueChange={field.handleChange}
                            >
                              <FieldLabel htmlFor="starter">
                                <Field orientation="horizontal">
                                  <FieldContent>
                                    <FieldTitle>Starter</FieldTitle>
                                    <FieldDescription>
                                      $0/month · Basic features for individuals
                                    </FieldDescription>
                                  </FieldContent>
                                  <RadioGroupItem
                                    value="starter"
                                    id="starter"
                                  />
                                </Field>
                              </FieldLabel>

                              <FieldLabel htmlFor="pro">
                                <Field orientation="horizontal">
                                  <FieldContent>
                                    <FieldTitle>Pro</FieldTitle>

                                    <FieldDescription>
                                      $12/month · Advanced tools and analytics
                                    </FieldDescription>
                                  </FieldContent>
                                  <RadioGroupItem value="pro" id="pro" />
                                </Field>
                              </FieldLabel>

                              <FieldLabel htmlFor="team">
                                <Field orientation="horizontal">
                                  <FieldContent>
                                    <FieldTitle>Team</FieldTitle>

                                    <FieldDescription>
                                      $24/month · Collaboration, roles, and SSO
                                    </FieldDescription>
                                  </FieldContent>
                                  <RadioGroupItem value="team" id="team" />
                                </Field>
                              </FieldLabel>
                            </RadioGroup>

                            {isInvalid && (
                              <FieldError errors={field.state.meta.errors} />
                            )}
                          </div>
                        </Field>
                      </FieldSet>
                    );
                  }}
                />

                <form.Field
                  name="billingCycle"
                  children={field => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <Field orientation="responsive" data-invalid={isInvalid}>
                        <FieldContent>
                          <FieldLabel htmlFor="billing-cycle">
                            Billing Cycle
                          </FieldLabel>

                          <FieldDescription>
                            Select your preferred billing interval.
                          </FieldDescription>
                        </FieldContent>

                        <div>
                          <RadioGroup
                            className="@md/field-group:grid-cols-2"
                            name={field.name}
                            value={field.state.value}
                            onValueChange={field.handleChange}
                          >
                            <FieldLabel
                              className="has-[[data-state=checked]]:bg-input/20 w-full items-start gap-3 rounded-lg border p-3"
                              htmlFor="monthly"
                            >
                              <RadioGroupItem id="monthly" value="monthly" />

                              <FieldContent>
                                <FieldTitle>Monthly</FieldTitle>

                                <FieldDescription className="text-xs">
                                  Pay month to month.
                                </FieldDescription>
                              </FieldContent>
                            </FieldLabel>

                            <FieldLabel
                              className="has-[[data-state=checked]]:bg-input/20 w-full items-start gap-3 rounded-lg border p-3"
                              htmlFor="yearly"
                            >
                              <RadioGroupItem id="yearly" value="yearly" />

                              <FieldContent>
                                <FieldTitle>Yearly</FieldTitle>

                                <FieldDescription className="text-xs">
                                  Save 20% billed annually.
                                </FieldDescription>
                              </FieldContent>
                            </FieldLabel>
                          </RadioGroup>

                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </div>
                      </Field>
                    );
                  }}
                />

                <form.Field
                  name="paymentMethod"
                  children={field => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <Field orientation="responsive" data-invalid={isInvalid}>
                        <FieldContent>
                          <FieldLabel htmlFor="payment-method">
                            Payment Method
                          </FieldLabel>

                          <FieldDescription>
                            Choose how you'd like to pay for your subscription.
                          </FieldDescription>
                        </FieldContent>

                        <div>
                          <RadioGroup
                            className="@md/field-group:grid-cols-2"
                            name={field.name}
                            value={field.state.value}
                            onValueChange={field.handleChange}
                          >
                            <FieldLabel
                              className="has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:!bg-input/20 w-full items-start gap-3 rounded-lg border p-3"
                              htmlFor="card"
                            >
                              <RadioGroupItem
                                color="foreground"
                                id="card"
                                value="card"
                              />

                              <FieldContent>
                                <FieldTitle>Credit or Debit Card</FieldTitle>
                              </FieldContent>
                            </FieldLabel>

                            <FieldLabel
                              className="has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:!bg-input/20 w-full items-start gap-3 rounded-lg border p-3"
                              htmlFor="paypal"
                            >
                              <RadioGroupItem
                                color="foreground"
                                id="paypal"
                                value="paypal"
                              />

                              <FieldContent>
                                <FieldTitle>PayPal</FieldTitle>
                              </FieldContent>
                            </FieldLabel>
                          </RadioGroup>

                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </div>
                      </Field>
                    );
                  }}
                />
              </FieldGroup>
            </FieldSet>

            <FieldSeparator />

            <FieldSet>
              <FieldLegend>Notifications</FieldLegend>

              <FieldDescription>
                Manage how and when you're notified about activity. Choose your
                preferred notification level, channels, and categories to stay
                in control without getting overwhelmed.
              </FieldDescription>

              <FieldGroup>
                <form.Field
                  name="notificationLevel"
                  children={field => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <Field orientation="responsive" data-invalid={isInvalid}>
                        <FieldContent>
                          <FieldLabel>Notification Level</FieldLabel>

                          <FieldDescription>
                            Choose how much activity you want to be notified
                            about.
                          </FieldDescription>
                        </FieldContent>

                        <div>
                          <RadioGroup
                            name={field.name}
                            value={field.state.value}
                            onValueChange={field.handleChange}
                          >
                            <Field orientation="horizontal">
                              <RadioGroupItem
                                value="all"
                                id="notification-level-all"
                              />

                              <FieldLabel
                                className="font-normal"
                                htmlFor="notification-level-all"
                              >
                                All activity
                              </FieldLabel>
                            </Field>

                            <Field orientation="horizontal">
                              <RadioGroupItem
                                id="notification-level-important"
                                value="important"
                              />

                              <FieldLabel
                                className="font-normal"
                                htmlFor="notification-level-important"
                              >
                                Important only
                              </FieldLabel>
                            </Field>

                            <Field orientation="horizontal">
                              <RadioGroupItem
                                id="notification-level-none"
                                value="none"
                              />

                              <FieldLabel
                                className="font-normal"
                                htmlFor="notification-level-none"
                              >
                                None
                              </FieldLabel>
                            </Field>
                          </RadioGroup>

                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </div>
                      </Field>
                    );
                  }}
                />

                <FieldSet>
                  <Field orientation="responsive">
                    <FieldContent>
                      <FieldLegend variant="label">
                        Email Notifications
                      </FieldLegend>

                      <FieldDescription>
                        Select which updates you'd like to receive by email.
                      </FieldDescription>
                    </FieldContent>

                    <FieldGroup className="gap-3" data-slot="checkbox-group">
                      <form.Field
                        name="emailNotificationComments"
                        children={field => {
                          const isInvalid =
                            field.state.meta.isTouched &&
                            !field.state.meta.isValid;
                          return (
                            <>
                              <Field
                                orientation="horizontal"
                                data-invalid={isInvalid}
                              >
                                <Checkbox
                                  id="email-notification-comments"
                                  name={field.name}
                                  checked={field.state.value}
                                  onCheckedChange={checked =>
                                    field.handleChange(checked === true)
                                  }
                                />

                                <FieldLabel
                                  className="font-normal"
                                  htmlFor="email-notification-comments"
                                >
                                  Comments on your posts
                                </FieldLabel>
                              </Field>
                              {isInvalid && (
                                <FieldError errors={field.state.meta.errors} />
                              )}
                            </>
                          );
                        }}
                      />

                      <form.Field
                        name="emailNotificationFollowers"
                        children={field => {
                          const isInvalid =
                            field.state.meta.isTouched &&
                            !field.state.meta.isValid;
                          return (
                            <>
                              <Field
                                orientation="horizontal"
                                data-invalid={isInvalid}
                              >
                                <Checkbox
                                  id="email-notification-followers"
                                  name={field.name}
                                  checked={field.state.value}
                                  onCheckedChange={checked =>
                                    field.handleChange(checked === true)
                                  }
                                />

                                <FieldLabel
                                  className="font-normal"
                                  htmlFor="email-notification-followers"
                                >
                                  New followers
                                </FieldLabel>
                              </Field>
                              {isInvalid && (
                                <FieldError errors={field.state.meta.errors} />
                              )}
                            </>
                          );
                        }}
                      />

                      <form.Field
                        name="emailNotificationProductUpdates"
                        children={field => {
                          const isInvalid =
                            field.state.meta.isTouched &&
                            !field.state.meta.isValid;
                          return (
                            <>
                              <Field
                                orientation="horizontal"
                                data-invalid={isInvalid}
                              >
                                <Checkbox
                                  id="email-notification-product-updates"
                                  name={field.name}
                                  checked={field.state.value}
                                  onCheckedChange={checked =>
                                    field.handleChange(checked === true)
                                  }
                                />

                                <FieldLabel
                                  className="font-normal"
                                  htmlFor="email-notification-product-updates"
                                >
                                  Product updates
                                </FieldLabel>
                              </Field>
                              {isInvalid && (
                                <FieldError errors={field.state.meta.errors} />
                              )}
                            </>
                          );
                        }}
                      />

                      <form.Field
                        name="emailNotificationSecurityAlerts"
                        children={field => {
                          const isInvalid =
                            field.state.meta.isTouched &&
                            !field.state.meta.isValid;
                          return (
                            <>
                              <Field
                                orientation="horizontal"
                                data-invalid={isInvalid}
                              >
                                <Checkbox
                                  id="email-notification-security-alerts"
                                  name={field.name}
                                  checked={field.state.value}
                                  onCheckedChange={checked =>
                                    field.handleChange(checked === true)
                                  }
                                />

                                <FieldLabel
                                  className="font-normal"
                                  htmlFor="email-notification-security-alerts"
                                >
                                  Security alerts
                                </FieldLabel>
                              </Field>
                              {isInvalid && (
                                <FieldError errors={field.state.meta.errors} />
                              )}
                            </>
                          );
                        }}
                      />
                    </FieldGroup>
                  </Field>
                </FieldSet>

                <form.Field
                  name="notificationCategories"
                  mode="array"
                  children={field => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <FieldSet>
                        <Field
                          orientation="responsive"
                          data-invalid={isInvalid}
                        >
                          <FieldContent>
                            <FieldLegend variant="label">
                              Notification Categories
                            </FieldLegend>

                            <FieldDescription>
                              Pick which types of notifications you care about
                              most.
                            </FieldDescription>
                          </FieldContent>

                          <div>
                            <FieldGroup className="flex flex-row flex-wrap gap-2 [--radius:9999rem]">
                              {notificationCategories.map(category => {
                                const isChecked = field.state.value.includes(
                                  category.id,
                                );
                                return (
                                  <FieldLabel
                                    key={category.id}
                                    htmlFor={`notification-category-${category.id}`}
                                    className="!w-fit"
                                  >
                                    <Field
                                      orientation="horizontal"
                                      className="gap-1.5 overflow-hidden !px-3 !py-1.5 transition-all duration-100 ease-linear group-has-data-[state=checked]/field-label:!px-2"
                                    >
                                      <Checkbox
                                        id={`notification-category-${category.id}`}
                                        name={field.name}
                                        checked={isChecked}
                                        onCheckedChange={checked => {
                                          if (checked) {
                                            field.pushValue(category.id);
                                          } else {
                                            const index =
                                              field.state.value.indexOf(
                                                category.id,
                                              );
                                            if (index !== -1) {
                                              field.removeValue(index);
                                            }
                                          }
                                        }}
                                        className="-ml-6 -translate-x-1 rounded-full transition-all duration-100 ease-linear data-[state=checked]:ml-0 data-[state=checked]:translate-x-0"
                                      />
                                      <FieldTitle>{category.label}</FieldTitle>
                                    </Field>
                                  </FieldLabel>
                                );
                              })}
                            </FieldGroup>

                            {isInvalid && (
                              <FieldError errors={field.state.meta.errors} />
                            )}
                          </div>
                        </Field>
                      </FieldSet>
                    );
                  }}
                />
              </FieldGroup>
            </FieldSet>

            <FieldSeparator />

            <FieldSet>
              <FieldLegend>Privacy</FieldLegend>

              <FieldDescription>
                Control your visibility and communication preferences.
              </FieldDescription>

              <FieldGroup>
                <form.Field
                  name="privacyShowOnlineStatus"
                  children={field => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <Field orientation="horizontal" data-invalid={isInvalid}>
                        <FieldContent>
                          <FieldLabel htmlFor="privacy-online-status">
                            Show my online status
                          </FieldLabel>

                          <FieldDescription>
                            Display a green indicator and "last active" time
                            when you're online.
                          </FieldDescription>
                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </FieldContent>
                        <Switch
                          id="privacy-online-status"
                          name={field.name}
                          checked={field.state.value}
                          onCheckedChange={field.handleChange}
                          aria-invalid={isInvalid}
                        />
                      </Field>
                    );
                  }}
                />

                <form.Field
                  name="privacyAllowEmailDiscovery"
                  children={field => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <Field orientation="horizontal" data-invalid={isInvalid}>
                        <FieldContent>
                          <FieldLabel htmlFor="privacy-email-discovery">
                            Allow others to find me by email
                          </FieldLabel>

                          <FieldDescription>
                            Let people who know your email address discover your
                            profile.
                          </FieldDescription>
                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </FieldContent>
                        <Switch
                          id="privacy-email-discovery"
                          name={field.name}
                          checked={field.state.value}
                          onCheckedChange={field.handleChange}
                          aria-invalid={isInvalid}
                        />
                      </Field>
                    );
                  }}
                />

                <form.Field
                  name="privacyEnableReadReceipts"
                  children={field => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <Field orientation="horizontal" data-invalid={isInvalid}>
                        <FieldContent>
                          <FieldLabel htmlFor="privacy-read-receipts">
                            Enable read receipts
                          </FieldLabel>

                          <FieldDescription>
                            Allow others to see when you've viewed their
                            messages.
                          </FieldDescription>
                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </FieldContent>
                        <Switch
                          id="privacy-read-receipts"
                          name={field.name}
                          checked={field.state.value}
                          onCheckedChange={field.handleChange}
                          aria-invalid={isInvalid}
                        />
                      </Field>
                    );
                  }}
                />
              </FieldGroup>
            </FieldSet>

            <FieldSeparator />

            <Field orientation="horizontal">
              <Button type="submit">
                {isSubmitting ? (
                  <>
                    <Spinner />
                    Submitting ...
                  </>
                ) : (
                  'Submit'
                )}
              </Button>

              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Field>
          </FieldGroup>
        </FieldSet>
      </Form>
    </main>
  );
}
