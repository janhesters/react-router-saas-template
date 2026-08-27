# React Router SaaS Template

A full-stack starter for B2B and B2C SaaS applications built with React Router.

[![YouTube thumbnail](https://i.ytimg.com/vi/5p45AbpL4bo/maxresdefault.jpg)](https://www.youtube.com/watch?v=5p45AbpL4bo)

You can
[click here to watch the video](https://www.youtube.com/watch?v=5p45AbpL4bo)
explaining the template.

## Tech stack

- 📖 [React Router](https://reactrouter.com/)
- 🔒 [TypeScript](https://www.typescriptlang.org/) by default
- 🎉 [TailwindCSS](https://tailwindcss.com/) for styling
- 🎨 [Shadcn UI](https://ui.shadcn.com/) components
- 🗄️ [Postgres](https://www.postgresql.org/) with
  [Supabase](https://supabase.com/) & [Prisma](https://www.prisma.io/)
- 🧹 [Biome](https://biomejs.dev/) for linting and formatting
- ⚡️ [Vitest](https://vitest.dev/) for testing
- 🎭 [Playwright](https://playwright.dev/) for E2E testing
- 🛠️ [Commitizen](https://commitizen-tools.github.io/commitizen/),
  [Commitlint](https://commitlint.js.org/), and
  [Husky](https://typicode.github.io/husky/) for enforced commit conventions.

## Features

- 🔒 Authentication with [Supabase](https://supabase.com/docs/guides/auth)
  (Email Magic Link, Google OAuth)
- 📦 Postgres with
  [Supabase](https://supabase.com/docs/guides/database/overview)
- 🗃️ File upload with
  [Supabase Storage](https://supabase.com/docs/guides/storage)
- 💳 Billing with [Stripe](https://stripe.com/)
- 📧 Emails with [Resend](https://resend.com/)
- 👥 Multi-tenant organizations with role-based memberships
- 🌙 Dark mode
- 🔔 Notifications
- 🔍 [Axe](https://www.npmjs.com/package/@axe-core/playwright) for accessibility
  testing
- 🌐 Internationalization with [i18next](https://www.i18next.com/) and
  [remix-i18next](https://github.com/sergiodxa/remix-i18next)
- 📦 And much more...

All the services this template uses have generous free tiers, so you can get
started at any budget.

## General

This template is tens of thousands of lines of code. It can be scary to navigate
such a big foreign project. Luckily this template has good test coverage.

Why is good test coverage important for a template? For the same reason why it's
good for your own code base. You want to avoid accidentally breaking something
when you update the template and change or amend its code.

## Getting started

Install [Node.js 24 LTS](https://nodejs.org/en/download) and
[Bun 1.4.0](https://bun.com/docs/installation). The repository pins both
versions in `.node-version` and `.bun-version`.

Get the code:

```bash
bunx create-react-router@latest my-app --template janhesters/react-router-saas-template --package-manager bun
cd my-app
```

The generator installs the dependencies. If you clone the repository directly,
run:

```bash
bun install --frozen-lockfile
```

### Quick start with mocks

The mock setup needs a disposable local Postgres database at
`TEST_DATABASE_URL`. It does not need Supabase, Stripe, or Resend. The command
resets this database, so never point `TEST_DATABASE_URL` at saved data.

```bash
bun run quickstart
```

This command:

1. Creates `.env` from `.env.example` when `.env` does not exist.
2. Resets the test database and pushes the Prisma schema without creating a
   migration.
3. Seeds demo data.
4. Starts the development server with mocks.

The quick start is for exploring the template. Create a migration before you
connect a real development database or deploy the application.

You can then log in with any of the demo accounts:

- `hobby@example.com` - Hobby Plan (1 seat, monthly)
- `startup@example.com` - Startup Plan (5 seats, annual)
- `business@example.com` - Business Plan (25 seats, monthly)

For more details, see [Local development with mocks](#local-development-with-mocks).

### Connect real services

Create the local environment file:

```bash
bun run setup:env
```

Set every value in `.env`. Start with:

- `DATABASE_URL`: the Postgres connection string.
- `APP_URL`: the full application URL, such as `http://localhost:3000`.
- `COOKIE_SECRET`: a random value used to sign cookies.
- `HONEYPOT_SECRET`: a separate random value for the contact form honeypot.

Complete the Supabase, Resend, and Stripe sections below before you start the
application with real services.

This template does not ship a Prisma migration. Create the first migration after
you set `DATABASE_URL`:

```bash
bun run prisma:migrate:init
git add prisma/migrations
git commit -m "chore(database): add first migration"
```

`bun run dev` generates Prisma Client before it starts React Router:

```bash
bun run dev
```

### Supabase

1. Create a [new Supabase organization](https://supabase.com/dashboard/new).
2. Create a new project.
   - Generate a password and save it somewhere.
   - Choose the Region closest to your users.
   - Keep the defaults like Postgres.
3. Create a separate database user for Prisma. Generate a password, save it in
   your password manager, then run this once in the SQL Editor after replacing
   `PASTE_PRISMA_PASSWORD`:

   ```sql
   create user "prisma" with password 'PASTE_PRISMA_PASSWORD' bypassrls createdb;
   grant "prisma" to "postgres";
   grant usage on schema public to prisma;
   grant create on schema public to prisma;
   grant all on all tables in schema public to prisma;
   grant all on all routines in schema public to prisma;
   grant all on all sequences in schema public to prisma;
   alter default privileges for role postgres in schema public grant all on tables to prisma;
   alter default privileges for role postgres in schema public grant all on routines to prisma;
   alter default privileges for role postgres in schema public grant all on sequences to prisma;
   ```

4. Open the project's **Connect** dialog and copy the Session Pooler connection
   string on port 5432. Change `postgres.PROJECT_REF` in its username to
   `prisma.PROJECT_REF`, replace its password with the Prisma-user password, and
   save the result as `DATABASE_URL`.
5. Open **Settings > API Keys** and copy:
   - The project URL into `VITE_SUPABASE_URL`.
   - The publishable key (`sb_publishable_...`) into
     `VITE_SUPABASE_PUBLISHABLE_KEY`.
   - A secret key (`sb_secret_...`) into `SUPABASE_SECRET_KEY`.
6. Open **Storage > S3** and create an access key. Copy the displayed endpoint,
   region, access key ID, and secret access key into the matching `STORAGE_*`
   variables.

The publishable key is sent to the browser. Row Level Security must protect any
data you expose through Supabase APIs. `SUPABASE_SECRET_KEY` and the S3
credentials bypass Row Level Security. Keep them on the server.

The application reads product data through Prisma, not the Supabase Data API.
You can disable the Data API in **Settings > API** unless you add a feature that
uses it.

#### Configuring Site URL at the Correct Location

Now you need to configure the emails for the magic link authentication flow.

Here's how to set the Site URL under **URL Configuration** for your Supabase
project:

1. **Access the Supabase Dashboard**:
   - Go to `https://supabase.com/dashboard/`.
2. **Navigate to URL Configuration**:
   - In the left sidebar, click **Authentication**.
   - Then select **URL Configuration** (the direct URL would be
     `https://supabase.com/dashboard/project/[your-project-ref]/auth/url-configuration`).
3. **Set the Site URL**:
   - On the **URL Configuration** page, you'll see a field labeled **Site URL**.
   - Enter your application's base URL here (e.g., `https://yourapp.com` or
     `http://localhost:3000` for local development).
   - This is the project's default URL. The application supplies an exact
     redirect URL for each login and registration email.
   - Add `<APP_URL>/auth/callback`, `<APP_URL>/login/confirm`, and
     `<APP_URL>/register/confirm` under **Redirect URLs**. For local
     development, `<APP_URL>` is `http://localhost:3000`. Add the three exact
     HTTPS URLs for each deployed environment.
4. **Save the Configuration**:
   - Click **Save** or the equivalent button to apply your changes.

Next, configure the email templates by clicking on **Emails** then on **Confirm
Sign Up** (under
`https://supabase.com/dashboard/project/[your-project-ref]/auth/templates`) in
the Supabase Dashboard.

```html
<h2>Create Your Account For The React Router Starter App</h2>

<p>Follow this link to register:</p>
<p>
  <a
    href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email"
    >Sign Up</a
  >
</p>
```

Next, configure the email templates by clicking on **Emails** then on **Magic
Link** (under
`https://supabase.com/dashboard/project/[your-project-ref]/auth/templates`) in
the Supabase Dashboard.

```html
<h2>Log In To The React Router Starter App</h2>

<p>Follow this link to login:</p>
<p>
  <a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email"
    >Log In</a
  >
</p>
```

Click **Save Changes** to apply your changes.

Disable click and open tracking for authentication emails in your email
provider. Tracking can rewrite single-use links and stop them from working.

#### Google OAuth

This section is based on the Supabase documentation for
[**Login With Google**](https://supabase.com/docs/guides/auth/social-login/auth-google),
but adds the template-specific steps needed for this project.

1. Create a new Google Cloud project. Go to the
   [Google Cloud Platform](https://console.cloud.google.com/home/dashboard) and
   create a new project if necessary.

- After creating the project, click on `Get Started`, enter your app name,
  choose your audience, provide your contact information, and agree to the
  Google API Services.

2. Create your OAuth client.
   - Under **Clients**, click `Create Credentials`.
   - Choose `OAuth client ID`.
   - Choose `Web application`.
   - Click Create.
3. Now edit your OAuth client with your URLs.
   - Under **Authorized JavaScript origins**, add your site URL. (E.g.
     `http://localhost:3000`, and your production site URL.)
   - Under **Authorized redirect URIs**, enter the callback URL from the
     [Supabase dashboard](https://supabase.com/dashboard/project/_/auth/providers).
     Expand the Google Auth Provider section to display it.
     - You need to enter the Client ID and Client Secret in the Google Auth
       Provider section of the Supabase Dashboard, which you can find under
       **Additional Information** your OAuth client.
     - The redirect URL is visible to your users. You can customize it by
       configuring
       [custom domains](https://supabase.com/docs/guides/platform/custom-domains).
4. In the Google Cloud console, under **Data Access**, click
   `ADD OR REMOVE SCOPES`.
   - Configure the following non-sensitive scopes:
     - `.../auth/userinfo.email`
     - `...auth/userinfo.profile`
     - `openid`
   - Click `Update`.
5. In the Google Cloud console, Under **Branding** and then **Authorized
   Domains**, add your Supabase project's domain, which has the form
   `<PROJECT_REF>.supabase.co`.
6. In your `.env` file, set the `APP_URL` to your local development URL (by
   default it's `http://localhost:3000`) or your production site URL.

**Note:**
[Here](https://supabase.com/docs/guides/auth/social-login/auth-google?queryGroups=environment&environment=server&queryGroups=framework&framework=remix#google-consent-screen)
are more details on how to configure the Google consent screen to show your
custom domain, and even your app's name and logo.

#### Configure image storage

Create a bucket in Supabase Storage.

1. Visit your project in the Supabase UI:
   https://supabase.com/dashboard/project/[your-project-ref].
2. Go to the Storage section.
3. Click on the "New Bucket" button.
4. Name the bucket `app-images`.
5. Make the bucket public. The template stores public URLs for avatars and
   organization logos.
6. Under **Additional configuration**, set the maximum upload size to 1 MB and
   allow `image/*` MIME types.
7. Click on "Save".
8. Set the bucket name to the correct variable in your code. (By default, this
   is NOT an environment variable in this template, but you can easily change it
   to an environment variable.) Do a fuzzy search for `BUCKET` to find all the
   places you need to change the value to your bucket name.

#### Uploading to Supabase From the Server

This approach uses the
[S3 compatible API](https://supabase.com/docs/guides/storage/s3/compatibility)
of Supabase Storage.

Simply
[follow the instructions in the documentation](https://supabase.com/docs/guides/storage/s3/authentication)
and set the following environment variables in your `.env` file:

- `STORAGE_ENDPOINT`
- `STORAGE_ACCESS_KEY_ID`
- `STORAGE_SECRET_ACCESS_KEY`
- `STORAGE_REGION`

These credentials bypass Row Level Security. Keep them out of client code,
browser-prefixed variables, logs, and Docker build arguments.

The upload to Supabase Storage is done using `parseFormData` from
[`@remix-run/form-data-parser`](https://github.com/remix-run/form-data-parser).
This function is under the hood in `validateFormData` in
`app/utils/validate-form-data.server.ts`.

### Resend

1. Create a [Resend](https://resend.com/) account and verify a sending domain.
2. Create a sending-only key under [API Keys](https://resend.com/api-keys).
3. Set `RESEND_API_KEY` to the new key.
4. Set `RESEND_FROM_EMAIL` to a sender on the verified domain, such as
   `My App <hello@mail.example.com>`.

`RESEND_API_KEY` sends organization invitation emails from the application.
Supabase Auth sends login and registration emails through its own SMTP
configuration. Connect Resend under **Supabase > Authentication > SMTP
Settings**, or use Resend's Supabase integration. Supabase's default SMTP is
only suitable for testing with project-team addresses.

### Stripe

Install the Stripe CLI:

```bash
brew install stripe/stripe-cli/stripe
```

or

```bash
bun install --global @stripe/cli
```

Confirm the installation:

```bash
stripe --version
```

Learn more about Stripe testing [here](https://docs.stripe.com/testing).

In a new terminal, forward webhooks to your local server:

```bash
stripe listen --forward-to http://localhost:3000/api/v1/stripe/webhooks
```

Keep this terminal open. This will print out your local webhook secret. You'll
need to set the `STRIPE_WEBHOOK_SECRET` environment variable to this value.

#### Stripe Dashboard

You can manage your products and prices in the Stripe Dashboard.

1. Create a new Stripe account.
2. In your [test mode dashboard](https://dashboard.stripe.com/test/dashboard),
   grab the API keys:

- `STRIPE_SECRET_KEY` - The secret key of your Stripe account.

#### Pricing

This project comes with a specific pricing pre-configured:

3 paid tiers, and one enterprise (custom) tier. All paid tiers have a free
trial. The free trial is 14 days and always for the highest plan.

If you need different pricing structures (e.g. freemium, one-time payments,
etc.) you'll have to write that code yourself. But this template's structure
makes it easy to customize the pricing page, the webhook handlers, etc. (NOTE:
the public `/pricing` page has a free tier as a UI example. The app has no free
tier.)

For each price, set the "Product tax code" to "SaaS" and the "Unit label" to
"seat".

#### 1. Create your products & prices

The React Router SaaS Template is set up to listen to product & prices webhooks.
This also allows your account managers to create and manage products & prices in
the Stripe Dashboard, and have them automatically reflected in your app.

By default, it uses three plans with seat limits of:

- low (Hobby): 1 seat
- mid (Startup): 5 seats
- high (Business): 25 seats

Update the related tests if you change these limits.
Do a fuzzy search for these limits.

For local development, run your app with `bun run dev` and forward webhooks to
your local server with
`stripe listen --forward-to http://localhost:3000/api/v1/stripe/webhooks`.

For production, follow the same instructions, but use the production URL of your
app and make sure your app is deployed so it will accept the webhooks of the
product creation. If you messed this up, you can always retrigger the webhooks
using the Stripe CLI.

1. Go to the
   [Stripe Dashboard for products](https://dashboard.stripe.com/test/products)
2. Click on "Create Product" (or "Add a product" if you have none).
3. In the modal:

- Enter the name of the product, e.g.: "Hobby Plan"
- (Optional) Enter a description of the product, e.g.: "Hobby Plan for 1 user",
  and upload an image.
- In the "Product Tax Code" dropdown, select "Software as a Service (SaaS) -
  business use".
- Click on "More Options" and set the "Unit label" to "seat".
- Enter a monthly recurring price, e.g.: "$17". Make sure you set the currency
  to USD in case its NOT the default.
- Click on "More pricing options" and enter a lookup key, e.g.:
  "monthly_hobby_planv2".
- Click on "Next".

4. Click on "Add another price" and this time choose "Yearly" as the billing
   period. Make sure you enter the correct yearly price, e.g.: "$180". And
   remember to set the lookup key to "annual_hobby_planv2".
5. **Important:** Now enter the value: "max_seats" in the metadata field and set
   it to "1". This app is set up to handle ALL limits via metadata. This allows
   you to easily change the limits for a product without having to change the
   code.
6. Finally, click "Add Product".
7. Now write your lookup keys in the `priceLookupKeysByTierAndInterval` object
   in `app/features/billing/billing-constants.ts`.

##### For Local Development: Replay the Events

After you've created your products and prices locally (with `bun run dev` and
`stripe listen` forwarding to your webhook endpoint), you'll see lines in your
terminal like:

```
2025-05-10 17:58:56   --> product.created \[evt\_XXXXXXXXXXXXXXXXXXXXXXXX]
2025-05-10 17:58:58   --> price.created   \[evt\_YYYYYYYYYYYYYYYYYYYYYYYY]
2025-05-10 17:59:00   --> price.created   \[evt\_ZZZZZZZZZZZZZZZZZZZZZZZZ]
...etc.
```

1. **Copy the event IDs**  
   Whenever you see a line ending with `[evt_...]`, copy that ID (everything
   inside the brackets, for example `evt_XXXXXXXXXXXXXXXXXXXXXXXX`).

2. **Save them for later**  
   Put all your event IDs into a file (e.g. `stripe-events.txt`) or an
   environment variable. For example, in a Unix-style shell you might do:

   ```bash
   # stripe-events.txt
   evt_XXXXXXXXXXXXXXXXXXXXXXXX
   evt_YYYYYYYYYYYYYYYYYYYYYYYY
   evt_ZZZZZZZZZZZZZZZZZZZZZZZZ
   # ...etc.
   ```

3. **Replay (resend) the events** When you need to reset your local database and
   seed it through webhooks, save the IDs in `stripe-events.txt`, then run:

   ```bash
   bun run stripe:resend-events
   ```

> **Tip:** `stripe-events.txt` is ignored by Git. Keep a copy outside the
> repository if you want to reuse the event IDs.

#### 2. Seed Stripe data for tests

The test suite uses the disposable database configured by `TEST_DATABASE_URL`.
Its global setup seeds fake products and prices when they are missing:

- **Global setup file**: `app/test/vitest.global-setup.ts`
- **Seeding helper**: `ensureStripeProductsAndPricesExist()` in
  `app/test/test-utils.ts`

What it does before your tests run:

1. Looks up each lookup key defined in `priceLookupKeysByTierAndInterval`.
2. If no product exists yet, creates one via `createPopulatedStripeProduct()` +
   `saveStripeProductToDatabase()`.
3. Creates both monthly & annual prices for that product with the right lookup
   keys & intervals.
4. Waits for seeding to finish before the tests start.

Do not replay development Stripe events into the test database. Run
`bun run test:db:reset` before the suite when you want a clean test schema.

#### Checkout Session

You need to configure tax collection. You must have a valid origin address to
enable automatic tax calculation in test mode. Visit
[your tax dashboard](https://dashboard.stripe.com/test/settings/tax) to update
it.

#### Customer Portal

Add the prices you created to your customer portal. Provide a configuration or
create your default by saving your
[customer portal settings in test mode](https://dashboard.stripe.com/test/settings/billing/portal).
You'll also need to set proration and enable the ability to cancel a
subscription via the portal.

#### Intentional Design Decisions for Stripe

- Downgrading a subscription does **not** deactivate existing members. The
  reasoning is simple: more active users typically means more revenue.
  Automatically removing members would work against that. If your plan has other
  limits, you should handle those restrictions yourself - but since
  subscriptions are billed per user per month, it's in your interest to avoid
  limiting user count unnecessarily.
- Users can still be added even if the subscription is cancelled. This allows
  you to generate more revenue if the customer decides to subscribe again -
  since pricing is per user, more added users means a higher monthly total once
  they reactivate.

### Misc

Here are a few miscellaneous things you might want to change:

1. Give it your own name! Fuzzy search for `React Router SaaS Template` to find
   all the places you need to change the name.
2. The current theme violates color contrast. Pick an accessible theme and
   configure it in your `app.css` file. Then you can
   enable contrast checks in your E2E tests again.

## Development

With all the environment variables set, you can run the app.

Start the development server with HMR:

```bash
bun run dev
```

Your application will be available at `http://localhost:3000`.

If you haven't done it yet, with both your dev server and webhook forwarding
terminal open, replay the Stripe events in a third terminal.

```bash
bun run stripe:resend-events
```

### Security Configuration

This application uses Content Security Policy (CSP) with nonces for XSS
protection and provides control over search engine indexing.

#### ALLOW_INDEXING Environment Variable

Controls whether search engines can index your site. The application uses two
mechanisms to prevent indexing:

- **HTTP Header:** `X-Robots-Tag: noindex, nofollow`
- **HTML Meta Tag:** `<meta name="robots" content="noindex, nofollow">`

**Values:**

- `"true"` - Allow search engine indexing (recommended for production)
- `"false"` - Prevent search engine indexing (recommended for
  staging/dev/preview environments)
- Omitted - Defaults to allowing indexing

**Example:**

```bash
# Production
ALLOW_INDEXING=true

# Staging/Development/Preview
ALLOW_INDEXING=false
```

**When to Use:**

| Environment         | Recommended Value | Reason                                                       |
| ------------------- | ----------------- | ------------------------------------------------------------ |
| **Production**      | `"true"` or omit  | Allow search engines to index your public site               |
| **Staging**         | `"false"`         | Prevent duplicate content and indexing of test environments  |
| **Development**     | `"false"`         | Prevent local development sites from being indexed           |
| **Preview/PR**      | `"false"`         | Prevent temporary preview deployments from being indexed     |

#### Content Security Policy (CSP)

The application uses nonces for CSP compliance. All inline scripts are protected
by cryptographically random nonces that are generated on each request.

**Configuration:**

- CSP is in **report-only mode** in development and test environments
- CSP is **enforced** in production
- All inline scripts require a valid nonce attribute
- WebSocket connections are allowed in development for Hot Module Replacement
  (HMR)

### Project helper scripts

- `build`: generates React Router and Prisma types, then builds the application.
- `check`: formats code and applies Biome's safe fixes.
- `dev`: generates Prisma Client, then starts the development server.
- `dev:mocks`: starts development with service mocks and deterministic email
  delivery against `TEST_DATABASE_URL`.
- `lint`: checks formatting and lint rules without changing files.
- `start`: serves the production build with `react-router-serve`.
- `test`: runs the Vitest suite once against `TEST_DATABASE_URL`.
- `test:watch`: watches the Vitest suite against `TEST_DATABASE_URL`.
- `test:e2e`: runs Playwright against `TEST_DATABASE_URL`.
- `test:db:reset`: resets and pushes the schema to `TEST_DATABASE_URL`.
- `test:db:seed`: seeds demo data into `TEST_DATABASE_URL`.
- `typecheck`: generates both route and Prisma types, then runs TypeScript.

### Prisma helper scripts

- `prisma:migrate:init`: creates and applies the first migration, then generates
  Prisma Client. Run it once for a new product.
- `prisma:migrate`: creates development migrations. Pass the name with
  `bun run prisma:migrate -- --name add_project_status`.
- `prisma:deploy`: applies committed migrations without changing them. Use this
  as the release or pre-deploy command.
- `prisma:push`: pushes the schema without creating a migration. Use it only for
  disposable prototypes and the mock quick start.
- `prisma:seed`: seeds the connected database.
- `prisma:studio`: opens Prisma Studio.

### Database-backed tests

Vitest integration tests and Playwright tests create and delete records. They
run through `scripts/run-with-test-database.ts`, which rejects the command unless
`TEST_DATABASE_URL` meets all three conditions:

- It differs from `DATABASE_URL`.
- It points to `localhost`, `127.0.0.1`, or `::1`.
- Its database name contains `test`.

Create the disposable database, reset its schema, and run the suites:

```bash
createdb react_router_saas_test
bun run test:db:reset
bun run test
bun run test:e2e
```

The GitHub Actions workflow provisions this database automatically. Keep
development, staging, and production connection strings out of
`TEST_DATABASE_URL`.

### Local development with mocks

For local development without connecting to real external services (Stripe,
Supabase, etc.), you can use the mock mode. This uses
[MSW (Mock Service Worker)](https://mswjs.io/) to intercept API calls.

**Setup:**

1. Reset and seed the disposable test database with demo data:
   ```bash
   bun run test:db:reset
   bun run test:db:seed
   ```
   This creates three demo organizations with subscriptions:
   - `hobby@example.com` - Hobby Plan (1 seat, monthly)
   - `startup@example.com` - Startup Plan (5 seats, annual)
   - `business@example.com` - Business Plan (25 seats, monthly)

   Each organization also has 2-4 random team members added.

2. Start the development server with mocks enabled:
   ```bash
   bun run dev:mocks
   ```

`dev:mocks` sets both `MOCKS=true` and `EMAIL_MOCKS=true`. Email delivery then
returns a stable mock ID without calling Resend. Startup rejects either flag
when `NODE_ENV=production`.

**Logging In:**

When running with `MOCKS=true`, authentication is handled by mocked Supabase
endpoints. To log in as one of the seeded users:

1. Navigate to the login page
2. Enter one of the demo email addresses (e.g., `hobby@example.com`)
3. Click the magic link button
4. The mock will automatically "send" the email and you can access the app

**Note:** The seed script creates demo users with subscriptions that include
seats, Stripe customer IDs, and all necessary billing data. This allows you to
test billing flows, team management, and subscription features without
connecting to real Stripe or Supabase instances.

### Routing

This template uses [flat routes](https://github.com/kiliman/remix-flat-routes).

### i18n

This React Router SaaS template comes with localization support through
[remix-i18next](https://github.com/sergiodxa/remix-i18next).

The namespaces live in `public/locales/`.

### Toasts

This React Router SaaS template includes utilities for toast notifications based
on flash sessions.

**Flash Data:** Temporary session values, ideal for transferring data to the
next request without persisting in the session.

**Redirect with Toast:**

- Utility: `redirectWithToast` (Path: `app/utils/toast.server.ts`)
- Use for redirecting with toast notifications.
- Example:
  ```tsx
  return redirectWithToast(`/organizations/${newOrganizations.slug}/home`, {
    title: 'Organization created',
    description: 'Your organization has been created.',
  });
  ```
- Accepts extra arguments for `ResponseInit` to set headers.

**Direct Toast Headers:**

- Utility: `createToastHeaders` (Path: `app/utils/toast.server.ts`)
- Use for non-redirect scenarios.
- Example:
  ```tsx
  return json(
    { success: true },
    {
      headers: await createToastHeaders({
        description: 'Organization updated',
        type: 'success',
      }),
    },
  );
  ```

**Combining Multiple Headers:**

- Utility: `combineHeaders` (Path: `app/utils/toast.server.tsx`)
- Combine toast headers with additional headers.
- Example:
  ```tsx
  return json(
    { success: true },
    {
      headers: combineHeaders(
        await createToastHeaders({ title: 'Profile updated' }),
        { 'x-foo': 'bar' },
      ),
    },
  );
  ```

### Playwright 🎭

We use Playwright for our End-to-End tests in this project. You'll find those in
the `playwright/` directory. As you make changes to your app, add to an existing
file or create a new file in the `playwright/e2e` directory to test your
changes.

[Playwright natively features testing library selectors](https://playwright.dev/docs/release-notes#locators)
for selecting elements on the page semantically.

To run these tests in development, run `bun run test:e2e` which will start the
dev server for the app as well as the Playwright client.

> **Note:** You might need to run `bunx playwright install` to install the
> Playwright browsers before running your tests for the first time.

#### Problems with ShadcnUI

Some of the colors of ShadcnUI's components are lacking the necessary contrast.

You can deactivate those elements in checks like this:

```ts
const accessibilityScanResults = await new AxeBuilder({ page })
  .disableRules('color-contrast')
  .analyze();

// or

const accessibilityScanResults = await new AxeBuilder({ page })
  .disableRules('color-contrast')
  .analyze();
```

or pick a color scheme like "purple" that has good contrast.

#### VSCode Extension

If you're using VSCode, you can install the
[Playwright extension](https://github.com/microsoft/playwright-vscode) for a
better developer experience.

#### Utilities

We have a utility for testing authenticated features without having to go
through the login flow:

```ts
test('something that requires an authenticated user', async ({ page }) => {
  await loginByCookie({ page });
  // ... your tests ...
});
```

Check out the `playwright/utils.ts` file for other utility functions.

#### Miscellaneous

To mark a test as todo in Playwright,
[you have to use `.fixme()`](https://github.com/microsoft/playwright/issues/10918).

```ts
test('something that should be done later', ({}, testInfo) => {
  testInfo.fixme();
});

test.fixme('something that should be done later', async ({ page }) => {
  // ...
});

test('something that should be done later', ({ page }) => {
  test.fixme();
  // ...
});
```

The version using `testInfo.fixme()` is the "preferred" way and can be picked up
by the VSCode extension.

### Vitest ⚡️

For lower level tests of utilities and single components, we use `vitest`.
We have DOM-specific assertion helpers via
[`@testing-library/jest-dom`](https://testing-library.com/jest-dom).

By default, Vitest runs tests in the
[`"happy-dom"` environment](https://vitest.dev/config/#environment). However,
test files that have `.server` in the name will be run in the `"node"`
environment.

### Test Scripts

- `bun run test` - Runs all Vitest tests.
- `bun run test:e2e` - Runs all E2E tests with Playwright.
- `bun run test:e2e:ui` - Runs all E2E tests with Playwright in UI mode.

### Type Checking

This project uses TypeScript. Set up TypeScript in your editor for useful
in-editor type checking and
auto-complete. To run type checking across the whole project, run
`bun run typecheck`.

### Linting and Formatting

This project uses [Biome](https://biomejs.dev/) for linting and formatting. That
is configured in `biome.json`.

It's recommended to install the
[Biome VS Code extension](https://marketplace.visualstudio.com/items?itemName=biomejs.biome)
to get auto-formatting on save and inline linting feedback. You can also run
`bun run check` to format and fix linting issues across all files in the
project, or `bun run lint` to check for errors without making changes (useful
for CI).

### AI-Driven Development

This template uses and was written with **AI-Driven Development (AIDD)**,
where you steer high-level design and let AI generate the bulk of your
code via
[**SudoLang**](https://github.com/paralleldrive/sudolang-llm-support), a
natural-language-style pseudocode that advanced LLMs already understand.

With AIDD you can:

- Define requirements and architecture in plain pseudocode.
- Let AI produce 90%+ of your source code (tests, UIs, state layers, etc.).
- Iterate and refactor faster, keeping consistency across your codebase.

#### Cursor AI Commands

Under `.cursor/commands/`, you'll find ready-to-use commands that automate
common workflows:

- **better-writer** - Improves writing clarity and engagement using Scott Adams'
  rules.
- **brainstorm** - Helps ideate solutions with clear trade-offs and
  recommendations.
- **commit** - Commits changes using conventional commit format.
- **debug** - Provides systematic debugging with root cause analysis.
- **documentation** - Creates clear, example-first documentation.
- **log** - Logs changes to CHANGELOG.md with conventional commit format.
- **plan** - Breaks down complex requests into manageable, sequential tasks.
- **svg-to-react** - Converts SVG files into optimized React components.
- **unit-tests** - Generates thorough, readable unit tests using Vitest.
- **write** - Produces clear, concise business writing with specific style
  guidelines.

#### Cursor AI Rules

Under `.cursor/rules/`, you'll find coding standards that AI follows:

- **js-and-ts.mdc**: JavaScript and TypeScript proven approaches including
  functional programming patterns, naming conventions, and code organization.
- **jsx-and-tsx.mdc**: React proven approaches including component patterns, form
  handling, accessibility, and internationalization.

Learn more about AIDD and SudoLang in
[The Art of Effortless Programming](https://leanpub.com/effortless-programming)
by [Eric Elliott](https://www.threads.com/@__ericelliott).

## Building for production

Create a production build:

```bash
bun run build
```

## Deployment

Commit a migration before the first deployment. The production database starts
empty, and `prisma migrate deploy` can only apply migrations that exist in the
repository.

```bash
bun run prisma:migrate:init
git add prisma/migrations
git commit -m "chore(database): add first migration"
```

Run `bun run prisma:deploy` as a release or pre-deploy command for every
environment. Keep migrations out of the image build step. This avoids two
containers racing to change the database during a scaled deployment.

### Docker deployment

The Docker image uses Bun 1.4.0 for dependency installation and package
scripts. It includes Node.js 24.19.0 for React's streaming server renderer.

Build the image, apply migrations once, and start the server:

```bash
docker build --tag my-app .
docker run --rm --env-file .env my-app bun run prisma:deploy
docker run --env-file .env --publish 3000:3000 my-app
```

The final image includes the Prisma CLI, `prisma.config.ts`, the schema, and your
committed migrations. Environment files stay outside the Docker build context.
The public Supabase values are injected into the page at runtime, so Docker does
not need build arguments for them.

For Railway, import the GitHub repository and let Railway detect the Dockerfile.
Add the runtime variables from `.env.example`, except `TEST_DATABASE_URL`. Set
`ALLOW_INDEXING=false` for staging and `ALLOW_INDEXING=true` for production.
Then set the pre-deploy command:

```bash
bun run prisma:deploy
```

After Railway creates the public domain, set `APP_URL` to that full HTTPS URL.
Update the Supabase Site URL and the three allowed redirect URLs documented
above, then redeploy.

You can run the same image on any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### Node deployment

If you're familiar with deploying Node applications, the built-in app server is
production-ready.

Run `bun install --frozen-lockfile`, `bun run build`, and
`bun run prisma:deploy` during the release. Deploy these files:

```
├── package.json
├── bun.lock
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
├── public/
├── prisma/
└── prisma.config.ts
```

## Maintenance

Check for outdated dependencies:

```bash
bun outdated
```

Update explicit package versions in `package.json`, then refresh `bun.lock`.
Keep `@types/node` on the same major version as `.node-version`:

```bash
bun install
bun run lint
bun run typecheck
bun run test
bun run build
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for more information.

## Check Out the Epic Stack

Some of the code of this starter template was taken from or inspired by the
[Epic Stack](https://github.com/epicweb-dev/epic-stack) from
[Kent C. Dodds](http://kentcdodds.com/). His template has different defaults, so
check it out if you're looking for a different opinionated starter template.

## Built with ❤️ by [ReactSquad](https://reactsquad.io/)

If you want to hire senior React developers to augment your team, or build your
entire product from scratch,
[schedule a call with us](https://www.reactsquad.io/schedule-a-call).

## [Buidl!](https://www.urbandictionary.com/define.php?term=%23BUIDL)

Now go out there make some magic! 🧙‍♂️
