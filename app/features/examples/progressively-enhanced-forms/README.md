### Progressively Enhanced Forms (Experiment)

Build forms that default to native browser behavior and progressively enhance
with ergonomic helpers. The core idea: keep validation in the platform (HTML
constraints) and on the server (Zod), not in a large client-side runtime.

- **Less JS, more platform**: rely on native input types, attributes, and form
  submission.
- **Server-first validation**: parse `FormData` against a Zod schema on the
  server.
- **Great DX**: `useForm` reads a Zod object schema and returns the right props
  and ARIA attributes.
- **E2E-friendly**: no heavy client-side validation that flakes when typing
  fast.

This is an experiment. It intentionally avoids client-side validation logic for
v1. Future enhancements may include optional on-blur validation or client-only
hints.

---

### When should you use this?

- **You want durable forms** that work without JS and degrade gracefully.
- **You prefer server validation** (Zod) and native HTML constraints over client
  bundles.
- **You run E2E tests** and want fewer flakes from fast typing.

If you need rich client-side validation logic, conditional field logic, or
complex form state management, libraries like TanStack Form or React Hook Form
might be preferable. This hook focuses on a lean, platform-first approach.

---

### Key pieces

- `useForm` (client):
  - Reads your Zod object schema and returns helpers to wire
    inputs/labels/descriptions/errors.
  - Injects native attributes like `type`, `required`, `minLength`, `maxLength`,
    `min`, `max`, `accept` for files, etc.
  - Provides ARIA wiring to make errors and descriptions accessible.
  - Special handling for booleans, enums (radio/select), and files.

- `parseFormDataWithSchema` (server):
  - Parses `FormData` (including multipart) from the request with sensible
    defaults:
    - Arrays become arrays
    - Booleans coerce empty string/"on"
    - Optional file inputs drop empty uploads
  - Validates with your Zod schema and returns typed data or throws a Zod error.

---

### Quickstart

1. Define a Zod schema (server + shared):

```ts
import z from 'zod';

export const profileSchema = z.object({
  username: z.string().min(3).max(32),
  email: z.email(),
  website: z.url().or(z.literal('')),
  country: z.enum(['US', 'DE', 'CH']),
  newsletterOptIn: z.coerce.boolean(),
  avatar: z.union([
    z
      .file()
      .max(1024 * 1024)
      .mime('image/*'),
    z.undefined(),
  ]),
});
```

2. Validate on the server action/handler using `parseFormDataWithSchema`:

```ts
import { data } from 'react-router';
import { parseFormDataWithSchema } from '~/features/examples/progressively-enhanced-forms/parse-form-data-with-schema.server';
import { isZodError } from '~/features/examples/progressively-enhanced-forms/is-zod-error';
import { profileSchema } from '~/schemas/profile';

export async function action({ request }: Route.ActionArgs) {
  try {
    const values = await parseFormDataWithSchema(request, profileSchema);
    // persist(values)
    return { success: true };
  } catch (error) {
    if (isZodError<typeof profileSchema>(error)) {
      return data({ errors: { issues: error.issues } }, { status: 400 });
    }
    throw error;
  }
}
```

3. Render the form using `useForm` in your route component:

```tsx
import { Form } from 'react-router';
import { useForm } from '~/features/examples/progressively-enhanced-forms/use-form';
import { extractErrors } from '~/features/examples/progressively-enhanced-forms/extract-errors';
import { profileSchema } from '~/schemas/profile';
import { Input } from '~/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '~/components/ui/select';
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group';

export default function ProfileForm({
  actionData,
  loaderData,
}: Route.ComponentProps) {
  const {
    getDescriptionProps,
    getErrorProps,
    getErrors,
    getFieldProps,
    getFormProps,
    getInputProps,
    getLabelProps,
  } = useForm({ schema: profileSchema, errors: extractErrors(actionData) });

  const countrySelect = getInputProps('country', { type: 'select' });

  return (
    <Form method="post" encType="multipart/form-data" {...getFormProps()}>
      <div {...getFieldProps('username')}>
        <label {...getLabelProps('username')}>Username</label>
        <p {...getDescriptionProps('username')}>3–32 characters.</p>
        <Input
          defaultValue={loaderData.username}
          {...getInputProps('username')}
        />
        {getErrors('username').length > 0 && (
          <div {...getErrorProps('username')}>
            {getErrors('username').map(e => (
              <p key={e.message}>{e.message}</p>
            ))}
          </div>
        )}
      </div>

      <div {...getFieldProps('email')}>
        <label {...getLabelProps('email')}>Email</label>
        <Input defaultValue={loaderData.email} {...getInputProps('email')} />
      </div>

      <div {...getFieldProps('country')}>
        <label {...getLabelProps('country')}>Country</label>
        <Select defaultValue={loaderData.country} {...countrySelect.root}>
          <SelectTrigger {...countrySelect.trigger}>
            <SelectValue placeholder="Choose country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="US">United States</SelectItem>
            <SelectItem value="DE">Germany</SelectItem>
            <SelectItem value="CH">Switzerland</SelectItem>
          </SelectContent>
        </Select>
        {getErrors('country').length > 0 && (
          <div {...getErrorProps('country')}>
            {getErrors('country').map(e => (
              <p key={e.message}>{e.message}</p>
            ))}
          </div>
        )}
      </div>

      <div {...getFieldProps('newsletterOptIn')}>
        <input type="checkbox" {...getInputProps('newsletterOptIn')} />
        <label {...getLabelProps('newsletterOptIn')}>
          Subscribe to newsletter
        </label>
      </div>

      <div {...getFieldProps('avatar')}>
        <label {...getLabelProps('avatar')}>Avatar</label>
        <input {...getInputProps('avatar')} />
      </div>

      <button type="submit">Save</button>
    </Form>
  );
}
```

---

### API Reference

`useForm({ schema, errors })`

- **schema**: a Zod object schema (Zod v4 in this codebase)
- **errors**: `{ issues: ZodIssue[] } | undefined` (typically created by
  `extractErrors(actionData)`)

Returns helpers:

- **getFormProps()** → `{ aria-describedby? }`
  - Adds form-level `aria-describedby` when there are form errors.
- **getFormErrors()** → `{ message: string }[]`
- **getFormErrorProps()** → `{ id, role: 'alert' }`
- **getFieldProps(key)** → `{ 'data-invalid': boolean }`
- **getLabelProps(key)** → `{ htmlFor }`
- **getDescriptionProps(key)** → `{ id }`
- **getErrorProps(key)** → `{ id }`
- **getErrors(key)** → `{ message: string }[]`
- **getInputProps(key)**
  - For regular inputs: returns
    `{ id, name, aria-describedby, aria-invalid, ...nativeConstraints }`.
  - For booleans: returns `{ name }` (used with checkbox/switch components that
    manage their own IDs).
  - For enums as radios: call `getInputProps('field', { type: 'radio' })` →
    returns `{ group, field, items[] }` for wiring a radio group.
  - For enums as select: call `getInputProps('field', { type: 'select' })` →
    returns `{ root, trigger }` for wiring a select UI.

Native constraints inferred from schema:

- `type`: `number`, `email`, `url`, `checkbox`, `file`
- `required` when a non-optional field has a `minLength` or otherwise implied
  requirement
- `minLength`, `maxLength` for strings
- `min`, `max` for numbers
- `accept` for file MIME filters

---

### Server helper: parseFormDataWithSchema

```ts
parseFormDataWithSchema(request, schema, options?)
```

- Uses `@mjackson/form-data-parser` to parse `FormData` including multipart.
- Applies structure from your Zod schema to coerce arrays, booleans, and files
  appropriately.
- Calls `schema.parse(values)` and returns typed values or throws a Zod error.

Notes:

- Checkbox values: missing becomes `''` so `z.coerce.boolean()` parses to
  `false`; presence parses to `true`.
- Arrays: missing arrays default to `[]`.
- Files: empty placeholder files are dropped, enabling optional file inputs.

---

### Philosophy and tradeoffs

- **Accessibility-first**: ARIA attributes, associations, and error messaging
  are built-in.
- **Less JavaScript**: No client state machine; inputs are standard HTML
  elements.
- **Server truth**: Zod schema is the single source of validation truth; client
  mirrors constraints where safe.
- **Composable UI**: Works with your UI components (ShadCN/ui used here) since
  the helpers return plain props.

What this v1 intentionally avoids:

- No client-side validation on each keystroke.
- No async validation hooks.
- No complex conditional rules in the client.

These may be layered in later as opt-in, progressively enhanced features.

---

### See a complete example

The route `app/routes/_examples+/profile-form-example.tsx` demonstrates:

- A large schema with strings, enums, arrays, booleans, and files
- Server parsing and error propagation
- Radio groups and selects wired via
  `getInputProps(..., { type: 'radio' | 'select' })`
- File upload constraints via `accept` and size limits

Use it as a template for production forms.
