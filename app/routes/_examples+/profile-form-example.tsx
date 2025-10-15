import { TbUserCircle } from 'react-icons/tb';
import { data, Form, useNavigation } from 'react-router';
import z from 'zod';

import { Avatar, AvatarFallback } from '~/components/ui/avatar';
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
import {
  AvatarUpload,
  AvatarUploadDescription,
  AvatarUploadImage,
  AvatarUploadInput,
} from '~/features/examples/progressively-enhanced-forms/avatar-upload';
import { extractErrors } from '~/features/examples/progressively-enhanced-forms/extract-errors';
import { isZodError } from '~/features/examples/progressively-enhanced-forms/is-zod-error';
import { parseFormDataWithSchema } from '~/features/examples/progressively-enhanced-forms/parse-form-data-with-schema.server';
import { useForm } from '~/features/examples/progressively-enhanced-forms/use-form';

import type { Route } from './+types/profile-form-example';

export function loader() {
  return {
    username: '',
    bio: '',
    avatarUrl: '',
    firstName: '',
    lastName: '',
    email: 'test@test.com',
    website: '',
    country: '',
    city: '',
    zipCode: '',
    streetName: '',
    streetNumber: '',
    billingPlan: 'pro',
    billingCycle: 'monthly',
    paymentMethod: 'paypal',
    notificationLevel: 'all',
    emailNotificationComments: false,
    emailNotificationFollowers: false,
    emailNotificationProductUpdates: false,
    emailNotificationSecurityAlerts: false,
    notificationCategories: [],
    privacyShowOnlineStatus: false,
    privacyAllowEmailDiscovery: false,
    privacyEnableReadReceipts: false,
  };
}

const countries = {
  US: { flag: '🇺🇸', name: 'United States', code: 'US' },
  DE: { flag: '🇩🇪', name: 'Germany', code: 'DE' },
  CH: { flag: '🇨🇭', name: 'Switzerland', code: 'CH' },
} as const;

const billingPlans = {
  starter: {
    id: 'starter',
    title: 'Starter',
    description: '$0/month · Basic features for individuals',
  },
  pro: {
    id: 'pro',
    title: 'Pro',
    description: '$12/month · Advanced tools and analytics',
  },
  team: {
    id: 'team',
    title: 'Team',
    description: '$24/month · Collaboration, roles, and SSO',
  },
} as const;

const billingCycles = {
  monthly: {
    id: 'monthly',
    title: 'Monthly',
    description: 'Pay month to month.',
  },
  yearly: {
    id: 'yearly',
    title: 'Yearly',
    description: 'Save 20% billed annually.',
  },
} as const;

const paymentMethods = {
  card: {
    id: 'card',
    title: 'Credit or Debit Card',
  },
  paypal: {
    id: 'paypal',
    title: 'PayPal',
  },
} as const;

const notificationLevels = {
  all: {
    id: 'all',
    title: 'All activity',
  },
  important: {
    id: 'important',
    title: 'Important only',
  },
  none: {
    id: 'none',
    title: 'None',
  },
} as const;

const emailNotifications = {
  emailNotificationComments: {
    id: 'emailNotificationComments',
    title: 'Comments on your posts',
  },
  emailNotificationFollowers: {
    id: 'emailNotificationFollowers',
    title: 'New followers',
  },
  emailNotificationProductUpdates: {
    id: 'emailNotificationProductUpdates',
    title: 'Product updates',
  },
  emailNotificationSecurityAlerts: {
    id: 'emailNotificationSecurityAlerts',
    title: 'Security alerts',
  },
} as const;

const notificationCategories = [
  { id: 'mentions', label: 'Mentions' },
  { id: 'directMessages', label: 'Direct messages' },
  { id: 'comments', label: 'Comments' },
  { id: 'betaInvites', label: 'Beta invites' },
  { id: 'productUpdates', label: 'Product updates' },
] as const;

const oneMB = 1024 * 1024;

const schema = z.object({
  username: z.string().min(3).max(32),
  bio: z.string(),
  avatar: z.union([z.file().max(oneMB).mime('image/*'), z.undefined()]),
  firstName: z.string(),
  lastName: z.string(),
  email: z.email(),
  website: z.url().or(z.literal('')),
  country: z.enum(Object.keys(countries) as [string, ...string[]]),
  city: z.string(),
  zipCode: z.string(),
  streetName: z.string(),
  streetNumber: z.string(),
  billingCycle: z.enum(Object.keys(billingCycles) as [string, ...string[]]),
  billingPlan: z.enum(Object.keys(billingPlans) as [string, ...string[]]),
  paymentMethod: z.enum(Object.keys(paymentMethods) as [string, ...string[]]),
  notificationLevel: z.enum(
    Object.keys(notificationLevels) as [string, ...string[]],
  ),
  emailNotificationComments: z.coerce.boolean(),
  emailNotificationFollowers: z.coerce.boolean(),
  emailNotificationProductUpdates: z.coerce.boolean(),
  emailNotificationSecurityAlerts: z.coerce.boolean(),
  notificationCategories: z.array(z.string()),
  privacyShowOnlineStatus: z.coerce.boolean(),
  privacyAllowEmailDiscovery: z.coerce.boolean(),
  privacyEnableReadReceipts: z.coerce.boolean(),
});

export async function action({ request }: Route.ActionArgs) {
  try {
    const validatedData = await parseFormDataWithSchema(request, schema);

    // Process successful validation
    // ... save to database, etc.
    console.log('Valid data:', validatedData);

    return { success: true };
  } catch (error) {
    if (isZodError<typeof schema>(error)) {
      console.log('Zod error:', error);
      return data({ errors: { issues: error.issues } }, { status: 400 });
    }

    // Re-throw non-Zod errors
    throw error;
  }
}

export default function ProfileFormExample({
  actionData,
  loaderData,
}: Route.ComponentProps) {
  const isSubmitting = useNavigation().state === 'submitting';
  const {
    getDescriptionProps,
    getErrorProps,
    getErrors,
    getFieldProps,
    getFormProps,
    getInputProps,
    getLabelProps,
  } = useForm({
    schema: schema,
    errors: extractErrors(actionData),
  });

  // Extract enum field props at the top level
  const countrySelectProps = getInputProps('country', { type: 'select' });
  const billingPlanRadioProps = getInputProps('billingPlan', {
    type: 'radio',
  });
  const billingCycleRadioProps = getInputProps('billingCycle', {
    type: 'radio',
  });
  const paymentMethodRadioProps = getInputProps('paymentMethod', {
    type: 'radio',
  });
  const notificationLevelRadioProps = getInputProps('notificationLevel', {
    type: 'radio',
  });

  return (
    <main className="p-4">
      <Form
        className="mx-auto max-w-4xl"
        encType="multipart/form-data"
        method="post"
        {...getFormProps()}
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
                <Field orientation="responsive" {...getFieldProps('username')}>
                  <FieldContent>
                    <FieldLabel {...getLabelProps('username')}>
                      Username
                    </FieldLabel>

                    <FieldDescription {...getDescriptionProps('username')}>
                      Your username uniquely identifies your account and lets
                      others find or tag you on the platform.
                    </FieldDescription>
                  </FieldContent>

                  <div>
                    <InputGroup>
                      <InputGroupAddon>
                        <InputGroupText>example.com/</InputGroupText>
                      </InputGroupAddon>

                      <InputGroupInput
                        autoFocus
                        defaultValue={loaderData.username}
                        placeholder="janhesters"
                        {...getInputProps('username')}
                      />
                    </InputGroup>

                    {getErrors('username').length > 0 && (
                      <FieldError
                        {...getErrorProps('username')}
                        errors={getErrors('username')}
                      />
                    )}
                  </div>
                </Field>

                <Field orientation="responsive" {...getFieldProps('bio')}>
                  <FieldContent>
                    <FieldLabel {...getLabelProps('bio')}>Bio</FieldLabel>

                    <FieldDescription {...getDescriptionProps('bio')}>
                      A few sentences about yourself.
                    </FieldDescription>
                  </FieldContent>

                  <div>
                    <Textarea
                      className="!field-sizing-fixed"
                      defaultValue={loaderData.bio}
                      rows={3}
                      {...getInputProps('bio')}
                    />

                    {getErrors('bio').length > 0 && (
                      <FieldError
                        {...getErrorProps('bio')}
                        errors={getErrors('bio')}
                      />
                    )}
                  </div>
                </Field>

                <AvatarUpload maxFileSize={oneMB}>
                  {({ error }) => (
                    <Field
                      orientation="responsive"
                      {...getFieldProps('avatar')}
                      data-invalid={
                        !!error || getFieldProps('avatar')['data-invalid']
                      }
                    >
                      <FieldContent>
                        <FieldLabel {...getLabelProps('avatar')}>
                          Avatar
                        </FieldLabel>

                        <FieldDescription {...getDescriptionProps('avatar')}>
                          Your avatar will appear next to your name across the
                          platform.
                        </FieldDescription>
                      </FieldContent>

                      <div>
                        <div className="flex items-center gap-x-8">
                          <Avatar className="size-24 rounded-lg">
                            <AvatarUploadImage
                              alt="Avatar preview"
                              className="size-24 rounded-lg"
                              src={loaderData.avatarUrl}
                            />

                            <AvatarFallback className="border-border dark:bg-input/30 size-24 rounded-lg border">
                              <TbUserCircle className="text-muted-foreground size-24 rounded-lg" />
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex flex-col gap-2">
                            <AvatarUploadInput {...getInputProps('avatar')} />

                            <AvatarUploadDescription>
                              JPG, GIF or PNG. 1MB max.
                            </AvatarUploadDescription>
                          </div>
                        </div>

                        {(getErrors('avatar').length > 0 || error) && (
                          <FieldError
                            {...getErrorProps('avatar')}
                            errors={[
                              ...(error ? [{ message: error }] : []),
                              ...getErrors('avatar'),
                            ]}
                          />
                        )}
                      </div>
                    </Field>
                  )}
                </AvatarUpload>
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
                  <Field {...getFieldProps('firstName')}>
                    <FieldLabel {...getLabelProps('firstName')}>
                      First name
                    </FieldLabel>

                    <Input
                      defaultValue={loaderData.firstName}
                      {...getInputProps('firstName')}
                    />

                    {getErrors('firstName').length > 0 && (
                      <FieldError
                        {...getErrorProps('firstName')}
                        errors={getErrors('firstName')}
                      />
                    )}
                  </Field>

                  <Field {...getFieldProps('lastName')}>
                    <FieldLabel {...getLabelProps('lastName')}>
                      Last name
                    </FieldLabel>

                    <Input
                      defaultValue={loaderData.lastName}
                      {...getInputProps('lastName')}
                    />

                    {getErrors('lastName').length > 0 && (
                      <FieldError
                        {...getErrorProps('lastName')}
                        errors={getErrors('lastName')}
                      />
                    )}
                  </Field>
                </div>

                <Field orientation="responsive" {...getFieldProps('email')}>
                  <FieldContent>
                    <FieldLabel {...getLabelProps('email')}>Email</FieldLabel>

                    <FieldDescription {...getDescriptionProps('email')}>
                      Your email address is used to login to your account.
                    </FieldDescription>
                  </FieldContent>

                  <div>
                    <Input
                      defaultValue={loaderData.email}
                      readOnly
                      {...getInputProps('email')}
                    />

                    {getErrors('email').length > 0 && (
                      <FieldError
                        {...getErrorProps('email')}
                        errors={getErrors('email')}
                      />
                    )}
                  </div>
                </Field>

                <Field orientation="responsive" {...getFieldProps('website')}>
                  <FieldContent>
                    <FieldLabel {...getLabelProps('website')}>
                      Website
                    </FieldLabel>

                    <FieldDescription {...getDescriptionProps('website')}>
                      Your personal or professional website URL.
                    </FieldDescription>
                  </FieldContent>

                  <div>
                    <Input
                      defaultValue={loaderData.website}
                      {...getInputProps('website')}
                    />

                    {getErrors('website').length > 0 && (
                      <FieldError
                        {...getErrorProps('website')}
                        errors={getErrors('website')}
                      />
                    )}
                  </div>
                </Field>

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
                      <Field {...getFieldProps('country')}>
                        <FieldLabel
                          className="sr-only"
                          {...getLabelProps('country')}
                        >
                          Country
                        </FieldLabel>

                        <div>
                          <Select
                            defaultValue={loaderData.country}
                            {...countrySelectProps.root}
                          >
                            <SelectTrigger
                              className="w-full"
                              {...countrySelectProps.trigger}
                            >
                              <SelectValue placeholder="Choose country" />
                            </SelectTrigger>

                            <SelectContent>
                              {Object.values(countries).map(
                                ({ flag, name, code }) => (
                                  <SelectItem key={code} value={code}>
                                    {flag} {name}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>

                          {getErrors('country').length > 0 && (
                            <FieldError
                              {...getErrorProps('country')}
                              errors={getErrors('country')}
                            />
                          )}
                        </div>
                      </Field>

                      <div>
                        <div className="grid gap-6 @md/field-group:grid-cols-3">
                          <Field
                            className="@md/field-group:col-span-2"
                            {...getFieldProps('city')}
                          >
                            <FieldLabel
                              className="sr-only"
                              {...getLabelProps('city')}
                            >
                              City
                            </FieldLabel>

                            <Input
                              autoComplete="address-level2"
                              defaultValue={loaderData.city}
                              placeholder="City"
                              {...getInputProps('city')}
                            />
                          </Field>

                          <Field {...getFieldProps('zipCode')}>
                            <FieldLabel
                              className="sr-only"
                              {...getLabelProps('zipCode')}
                            >
                              Zip code
                            </FieldLabel>

                            <Input
                              autoComplete="postal-code"
                              defaultValue={loaderData.zipCode}
                              placeholder="Zip code"
                              {...getInputProps('zipCode')}
                            />
                          </Field>
                        </div>

                        {(getErrors('city').length > 0 ||
                          getErrors('zipCode').length > 0) && (
                          <div className="mt-1">
                            {getErrors('city').length > 0 && (
                              <FieldError
                                {...getErrorProps('city')}
                                errors={getErrors('city')}
                              />
                            )}
                            {getErrors('zipCode').length > 0 && (
                              <FieldError
                                {...getErrorProps('zipCode')}
                                errors={getErrors('zipCode')}
                              />
                            )}
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="grid gap-6 @md/field-group:grid-cols-5">
                          <Field
                            className="@md/field-group:col-span-4"
                            {...getFieldProps('streetName')}
                          >
                            <FieldLabel
                              className="sr-only"
                              {...getLabelProps('streetName')}
                            >
                              Street name
                            </FieldLabel>

                            <Input
                              autoComplete="address-line1"
                              defaultValue={loaderData.streetName}
                              placeholder="Street name"
                              {...getInputProps('streetName')}
                            />
                          </Field>

                          <Field {...getFieldProps('streetNumber')}>
                            <FieldLabel
                              className="sr-only"
                              {...getLabelProps('streetNumber')}
                            >
                              Street number
                            </FieldLabel>

                            <Input
                              autoComplete="address-line2"
                              defaultValue={loaderData.streetNumber}
                              placeholder="No."
                              {...getInputProps('streetNumber')}
                            />
                          </Field>
                        </div>

                        {(getErrors('streetName').length > 0 ||
                          getErrors('streetNumber').length > 0) && (
                          <div className="mt-1">
                            {getErrors('streetName').length > 0 && (
                              <FieldError
                                {...getErrorProps('streetName')}
                                errors={getErrors('streetName')}
                              />
                            )}
                            {getErrors('streetNumber').length > 0 && (
                              <FieldError
                                {...getErrorProps('streetNumber')}
                                errors={getErrors('streetNumber')}
                              />
                            )}
                          </div>
                        )}
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
                <FieldSet>
                  <Field orientation="responsive">
                    <FieldContent>
                      <FieldLegend variant="label">Billing Plan</FieldLegend>

                      <FieldDescription>
                        Choose the plan that best fits your needs.
                      </FieldDescription>
                    </FieldContent>

                    <div>
                      <RadioGroup
                        defaultValue={loaderData.billingPlan}
                        {...billingPlanRadioProps.group}
                      >
                        {billingPlanRadioProps.items.map(
                          ({ value, item, label }) => (
                            <FieldLabel key={value} {...label}>
                              <Field
                                orientation="horizontal"
                                {...billingPlanRadioProps.field}
                              >
                                <FieldContent>
                                  <FieldTitle>
                                    {
                                      billingPlans[
                                        value as keyof typeof billingPlans
                                      ].title
                                    }
                                  </FieldTitle>

                                  <FieldDescription>
                                    {
                                      billingPlans[
                                        value as keyof typeof billingPlans
                                      ].description
                                    }
                                  </FieldDescription>
                                </FieldContent>

                                <RadioGroupItem {...item} />
                              </Field>
                            </FieldLabel>
                          ),
                        )}
                      </RadioGroup>

                      {getErrors('billingPlan').length > 0 && (
                        <FieldError
                          {...getErrorProps('billingPlan')}
                          errors={getErrors('billingPlan')}
                        />
                      )}
                    </div>
                  </Field>
                </FieldSet>

                <FieldSet>
                  <Field orientation="responsive">
                    <FieldContent>
                      <FieldLegend variant="label">Billing Cycle</FieldLegend>

                      <FieldDescription>
                        Select your preferred billing interval.
                      </FieldDescription>
                    </FieldContent>

                    <div>
                      <RadioGroup
                        className="@md/field-group:grid-cols-2"
                        defaultValue={loaderData.billingCycle}
                        {...billingCycleRadioProps.group}
                      >
                        {billingCycleRadioProps.items.map(
                          ({ value, item, label }) => (
                            <FieldLabel
                              key={value}
                              className="has-[[data-state=checked]]:bg-input/20 w-full items-start gap-3 rounded-lg border p-3"
                              {...label}
                            >
                              <RadioGroupItem {...item} />

                              <FieldContent>
                                <FieldTitle>
                                  {
                                    billingCycles[
                                      value as keyof typeof billingCycles
                                    ].title
                                  }
                                </FieldTitle>

                                <FieldDescription className="text-xs">
                                  {
                                    billingCycles[
                                      value as keyof typeof billingCycles
                                    ].description
                                  }
                                </FieldDescription>
                              </FieldContent>
                            </FieldLabel>
                          ),
                        )}
                      </RadioGroup>

                      {getErrors('billingCycle').length > 0 && (
                        <FieldError
                          {...getErrorProps('billingCycle')}
                          errors={getErrors('billingCycle')}
                        />
                      )}
                    </div>
                  </Field>
                </FieldSet>

                <FieldSet>
                  <Field orientation="responsive">
                    <FieldContent>
                      <FieldLegend variant="label">Payment Method</FieldLegend>

                      <FieldDescription>
                        Choose how you'd like to pay for your subscription.
                      </FieldDescription>
                    </FieldContent>

                    <div>
                      <RadioGroup
                        className="@md/field-group:grid-cols-2"
                        defaultValue={loaderData.paymentMethod}
                        {...paymentMethodRadioProps.group}
                      >
                        {paymentMethodRadioProps.items.map(
                          ({ value, item, label }) => (
                            <FieldLabel
                              key={value}
                              className="has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:!bg-input/20 w-full items-start gap-3 rounded-lg border p-3"
                              {...label}
                            >
                              <RadioGroupItem color="foreground" {...item} />

                              <FieldContent>
                                <FieldTitle>
                                  {
                                    paymentMethods[
                                      value as keyof typeof paymentMethods
                                    ].title
                                  }
                                </FieldTitle>
                              </FieldContent>
                            </FieldLabel>
                          ),
                        )}
                      </RadioGroup>

                      {getErrors('paymentMethod').length > 0 && (
                        <FieldError
                          {...getErrorProps('paymentMethod')}
                          errors={getErrors('paymentMethod')}
                        />
                      )}
                    </div>
                  </Field>
                </FieldSet>
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
                <FieldSet>
                  <Field orientation="responsive">
                    <FieldContent>
                      <FieldLegend variant="label">
                        Notification Level
                      </FieldLegend>

                      <FieldDescription>
                        Choose how much activity you want to be notified about.
                      </FieldDescription>
                    </FieldContent>

                    <div>
                      <RadioGroup
                        defaultValue={loaderData.notificationLevel}
                        {...notificationLevelRadioProps.group}
                      >
                        {notificationLevelRadioProps.items.map(
                          ({ value, item, label }) => (
                            <Field key={value} orientation="horizontal">
                              <RadioGroupItem {...item} />

                              <FieldLabel className="font-normal" {...label}>
                                {
                                  notificationLevels[
                                    value as keyof typeof notificationLevels
                                  ].title
                                }
                              </FieldLabel>
                            </Field>
                          ),
                        )}
                      </RadioGroup>

                      {getErrors('notificationLevel').length > 0 && (
                        <FieldError
                          {...getErrorProps('notificationLevel')}
                          errors={getErrors('notificationLevel')}
                        />
                      )}
                    </div>
                  </Field>
                </FieldSet>

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
                      {Object.entries(emailNotifications).map(
                        ([rawKey, { title }]) => {
                          const key = rawKey as keyof typeof emailNotifications;

                          return (
                            <div key={key}>
                              <Field
                                orientation="horizontal"
                                {...getFieldProps(key)}
                              >
                                <Checkbox {...getInputProps(key)} />

                                <FieldLabel
                                  className="font-normal"
                                  {...getLabelProps(key)}
                                >
                                  {title}
                                </FieldLabel>
                              </Field>

                              {getErrors(key).length > 0 && (
                                <FieldError
                                  {...getErrorProps(key)}
                                  errors={getErrors(key)}
                                />
                              )}
                            </div>
                          );
                        },
                      )}
                    </FieldGroup>
                  </Field>
                </FieldSet>

                <FieldSet>
                  <Field
                    orientation="responsive"
                    {...getFieldProps('notificationCategories')}
                  >
                    <FieldContent>
                      <FieldLegend variant="label">
                        Notification Categories
                      </FieldLegend>

                      <FieldDescription>
                        Pick which types of notifications you care about most.
                      </FieldDescription>
                    </FieldContent>

                    <div>
                      <FieldGroup className="flex flex-row flex-wrap gap-2 [--radius:9999rem]">
                        {notificationCategories.map(category => (
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
                                name="notificationCategories"
                                value={category.id}
                                className="-ml-6 -translate-x-1 rounded-full transition-all duration-100 ease-linear data-[state=checked]:ml-0 data-[state=checked]:translate-x-0"
                              />
                              <FieldTitle>{category.label}</FieldTitle>
                            </Field>
                          </FieldLabel>
                        ))}
                      </FieldGroup>

                      {getErrors('notificationCategories').length > 0 && (
                        <FieldError
                          {...getErrorProps('notificationCategories')}
                          errors={getErrors('notificationCategories')}
                        />
                      )}
                    </div>
                  </Field>
                </FieldSet>
              </FieldGroup>
            </FieldSet>

            <FieldSeparator />

            <FieldSet>
              <FieldLegend>Privacy</FieldLegend>

              <FieldDescription>
                Control your visibility and communication preferences.
              </FieldDescription>

              <FieldGroup>
                <Field
                  orientation="horizontal"
                  {...getFieldProps('privacyShowOnlineStatus')}
                >
                  <FieldContent>
                    <FieldLabel {...getLabelProps('privacyShowOnlineStatus')}>
                      Show my online status
                    </FieldLabel>

                    <FieldDescription
                      {...getDescriptionProps('privacyShowOnlineStatus')}
                    >
                      Display a green indicator and "last active" time when
                      you're online.
                    </FieldDescription>

                    {getErrors('privacyShowOnlineStatus').length > 0 && (
                      <FieldError
                        {...getErrorProps('privacyShowOnlineStatus')}
                        errors={getErrors('privacyShowOnlineStatus')}
                      />
                    )}
                  </FieldContent>

                  <Switch
                    defaultChecked={loaderData.privacyShowOnlineStatus}
                    {...getInputProps('privacyShowOnlineStatus')}
                  />
                </Field>

                <Field
                  orientation="horizontal"
                  {...getFieldProps('privacyAllowEmailDiscovery')}
                >
                  <FieldContent>
                    <FieldLabel
                      {...getLabelProps('privacyAllowEmailDiscovery')}
                    >
                      Allow others to find me by email
                    </FieldLabel>

                    <FieldDescription
                      {...getDescriptionProps('privacyAllowEmailDiscovery')}
                    >
                      Let people who know your email address discover your
                      profile.
                    </FieldDescription>

                    {getErrors('privacyAllowEmailDiscovery').length > 0 && (
                      <FieldError
                        {...getErrorProps('privacyAllowEmailDiscovery')}
                        errors={getErrors('privacyAllowEmailDiscovery')}
                      />
                    )}
                  </FieldContent>

                  <Switch
                    defaultChecked={loaderData.privacyAllowEmailDiscovery}
                    {...getInputProps('privacyAllowEmailDiscovery')}
                  />
                </Field>

                <Field
                  orientation="horizontal"
                  {...getFieldProps('privacyEnableReadReceipts')}
                >
                  <FieldContent>
                    <FieldLabel {...getLabelProps('privacyEnableReadReceipts')}>
                      Enable read receipts
                    </FieldLabel>

                    <FieldDescription
                      {...getDescriptionProps('privacyEnableReadReceipts')}
                    >
                      Allow others to see when you've viewed their messages.
                    </FieldDescription>

                    {getErrors('privacyEnableReadReceipts').length > 0 && (
                      <FieldError
                        {...getErrorProps('privacyEnableReadReceipts')}
                        errors={getErrors('privacyEnableReadReceipts')}
                      />
                    )}
                  </FieldContent>

                  <Switch
                    defaultChecked={loaderData.privacyEnableReadReceipts}
                    {...getInputProps('privacyEnableReadReceipts')}
                  />
                </Field>
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
