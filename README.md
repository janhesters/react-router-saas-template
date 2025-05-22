# Welcome to the React Router SaaS Template!

A modern, production-ready template for building full-stack React applications for B2B SaaS applications using React Router.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/remix-run/react-router-templates/tree/main/default)

## Tech Stack

- 📖 [React Router](https://reactrouter.com/)
- 🔒 TypeScript by default
- 🎉 TailwindCSS for styling
- 🗄️ Postgres with Supabase & Prisma
- 🧹 ESLint for linting
- 💅 Prettier for code formatting
- ⚡️ Vitest for testing
- 🎭 Playwright for E2E testing

## Features

- 🔒 Authentication with Supabase (Email Magic Link, Google OAuth)
- 💳 Billing with Stripe
- 📸 Image upload with Supabase Storage
- 🎨 Shadcn UI components
- 👥 Multi-tenant organizations with role-based memberships
- 🌙 Dark mode
- 🔔 Notifications

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:3000`.

## Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

### Docker Deployment

This template includes three Dockerfiles optimized for different package managers:

- `Dockerfile` - for npm
- `Dockerfile.pnpm` - for pnpm
- `Dockerfile.bun` - for bun

To build and run using Docker:

```bash
# For npm
docker build -t my-app .

# For pnpm
docker build -f Dockerfile.pnpm -t my-app .

# For bun
docker build -f Dockerfile.bun -t my-app .

# Run the container
docker run -p 3000:3000 my-app
```

The containerized application can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### DIY Deployment

If you're familiar with deploying Node applications, the built-in app server is production-ready.

Make sure to deploy the output of `npm run build`

```
├── package.json
├── package-lock.json (or pnpm-lock.yaml, or bun.lockb)
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever CSS framework you prefer.

---

Built with ❤️ using React Router.


---

## Supabase

I apologize for the confusion. You're absolutely right—my previous response didn't directly address the specific URL configuration page you mentioned. Let's focus on configuring the Site URL correctly under `https://supabase.com/dashboard/project/[your-project-ref]/auth/url-configuration` in the Supabase Dashboard.

### Configuring Site URL at the Correct Location

Here’s how to set the Site URL under **URL Configuration** for your Supabase project:

1. **Access the Supabase Dashboard**:
   - Go to `https://supabase.com/dashboard/`.
2. **Navigate to URL Configuration**:
   - In the left sidebar, click **Authentication**.
   - Then select **URL Configuration** (the direct URL would be `https://supabase.com/dashboard/project/[your-project-ref]/auth/url-configuration`).
3. **Set the Site URL**:
   - On the **URL Configuration** page, you'll see a field labeled **Site URL**.
   - Enter your application's base URL here (e.g., `https://yourapp.com` or `http://localhost:3000` for local development).
   - This is the base URL that Supabase will use as the `{{ .SiteURL }}` variable in your email templates (like the magic link template you provided).
4. **Save the Configuration**:
   - Click **Save** or the equivalent button to apply your changes.


Next, configure the email templates by clicking on **Emails** then on **Confirm Sign Up** (under `https://supabase.com/dashboard/project/[your-project-ref]/auth/templates`) in the Supabase Dashboard.

```html
<h2>Create Your Account For The React Router Starter App</h2>

<p>Follow this link to register:</p>
<p><a href="{{ .SiteURL }}/register/confirm?token_hash={{ .TokenHash }}&type=email">Sign Up</a></p>
```

Next, configure the email templates by clicking on **Emails** then on **Magic Link** (under `https://supabase.com/dashboard/project/[your-project-ref]/auth/templates`) in the Supabase Dashboard.

```html
<h2>Log In To The React Router Starter App</h2>

<p>Follow this link to login:</p>
<p><a href="{{ .SiteURL }}/login/confirm?token_hash={{ .TokenHash }}&type=email">Log In</a></p>
```


Click **Save Changes** to apply your changes.

This code base is now setting up everything for Supabase. But if you want to handle your own sessions, you can still check out the archived French House Stack, which still maintains the code for your own custom sessions with cookie based auth.

### Google OAuth

This section is based on the Supabase documentation for [**Login With Google**](https://supabase.com/docs/guides/auth/social-login/auth-google), but has been enhanced for clarity because the Supabase documentation does not work out of the box.

1. Create a new Google Cloud project. Go to the [Google Cloud Platform](https://console.cloud.google.com/home/dashboard) and create a new project if necessary.
  - After creating the project, click on `Get Started`, enter your app name, choose your audience, provide your contact information, and agree to the Google API Services.
2. Create your OAuth client.
   - Under **Clients**, click `Create Credentials`.
   - Choose `OAuth client ID`.
   - Choose `Web application`.
   - Click Create.
3. Now edit your OAuth client with your URLs.
   - Under **Authorized JavaScript origins**, add your site URL. (E.g. `http://localhost:3000`, and your production site URL.)
   - Under **Authorized redirect URIs**, enter the callback URL from the [Supabase dashboard](https://supabase.com/dashboard/project/_/auth/providers). Expand the Google Auth Provider section to display it.
      - You need to enter the Client ID and Client Secret in the Google Auth Provider section of the Supabase Dashboard, which you can find under **Additional Information** your OAuth client.
      - The redirect URL is visible to your users. You can customize it by configuring [custom domains](https://supabase.com/docs/guides/platform/custom-domains).
4. In the Google Cloud console, under **Data Access**, click `ADD OR REMOVE SCOPES`.
   - Configure the following non-sensitive scopes:
     - `.../auth/userinfo.email`
     - `...auth/userinfo.profile`
     - `openid`
   - Click `Update`.
5. In the Google Cloud console, Under **Branding** and then **Authorized Domains**, add your Supabase project's domain, which has the form `<PROJECT_ID>.supabase.co`.
6. In your `.env` file, set the `APP_URL` to your local development URL (by default it's `http://localhost:3000`) or your production site URL.

**Note:** [Here](https://supabase.com/docs/guides/auth/social-login/auth-google?queryGroups=environment&environment=server&queryGroups=framework&framework=remix#google-consent-screen) are more details on how to configure the Google consent screen to show your custom domain, and even your app's name and logo.

---

Folder structure:

- https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-react#consistent-components-exports
- https://www.gatsbyjs.com/docs/reference/local-development/fast-refresh/#how-it-works

---

Give it your own name! Fuzzy search for `React Router SaaS Template` to find all the places you need to change the name.

---

### Supabase Storage

#### Uploading Directly to Supabase From the Client

Create a bucket in Supabase Storage.

1. Visit your project in the Supabase UI: https://supabase.com/dashboard/project/[your-project-ref].
2. Go to the Storage section.
3. Click on the "New Bucket" button.
4. Enter a name for the bucket, e.g. `"app-images"` if you want to use a special bucket for images, which we recommend.
5. Keep the bucket as "Private" to ensure that only authenticated users can access the files.
6. Click on "Additional configuration", set the maximum upload sizeto 1MB, and set the allowed MIME types to `image/*` to only allow image files.
7. Click on "Save".

#### Uploading to Supabase From the Server

This approach uses the [S3 compatible API](https://supabase.com/docs/guides/storage/s3/compatibility) of Supabase Storage.

Simply [follow the instructions in the documentation](https://supabase.com/docs/guides/storage/s3/authentication) and set the following environment variables in your `.env` file:

- `STORAGE_ACCESS_KEY_ID`
- `STORAGE_SECRET_ACCESS_KEY`
- `STORAGE_REGION`
- `SUPABASE_PROJECT_ID`

The upload to Supabase Storage is done using `parseFormData` from [`@mjackson/form-data-parser`](https://github.com/mjackson/form-data-parser). This function is under the hood in `validateFormData` in `app/utils/validate-form-data.server.ts`.

## Stripe

Install the Stripe CLI:

```bash
brew install stripe/stripe-cli/stripe
```

or 

```bash
npm install -g stripe/stripe-cli
```

Confirm the installation:

```bash
stripe --version
```

Learn more about Stripe testing [here](https://docs.stripe.com/testing).

Forward webhooks to your local server:

```bash
stripe listen --forward-to http://localhost:3000/api/v1/stripe/webhooks
```

### Configuration

#### Checkout Session

```
StripeInvalidRequestError: You must have a valid origin address to enable automatic tax calculation in test mode.  Visit https://dashboard.stripe.com/test/settings/tax to update it.
```

#### Customer Portal

```
StripeInvalidRequestError: No configuration provided and your test mode default configuration has not been created. Provide a configuration or create your default by saving your customer portal settings in test mode at https://dashboard.stripe.com/test/settings/billing/portal.
```




### Pricing

This project comes with a specific pricing pre-configured:

3 paid tiers, and one enterprise (custom) tier. All paid tiers have a free trial. The free trial is 14 days and always for the highest plan.

If you need different pricing structures (e.g. freemium, one-time payments, etc.) you'll have to write that code yourself. But this template's structure makes it easy to customize the pricing page, the web hook handlers, etc.

For each price, set the "Product tax code" to "SaaS" and the "Unit label" to "seat".

#### Set Up The Dashboard

1. Go to the [Stripe Dashboard](https://dashboard.stripe.com/test/settings/billing_portal).


## Check Out the Epic Stack

Some of the code of this starter template was taken from or inspired by the [Epic Stack](https://github.com/epicweb-dev/epic-stack) from [Kent C. Dodds](http://kentcdodds.com/). His template has different defaults, so check it out if you're looking for a different opinionated starter template.

## Built with ❤️ by [ReactSquad](https://reactsquad.io/)

If you want to hire senior React developers to augment your team, or build your entire product from scratch, [schedule a call with us](https://www.reactsquad.io/schedule-a-call).


---

Why is good test coverage important for a template? Same reason why it's good for your own code base. You want to avoid accidentally breaking something when you update use the template and change and ammend its code.

---

### 1. Create your products & prices

The React Router SaaS Template is set up to listen to product & prices webhooks. This also allows your account managers to create and manage products & prices in the Stripe Dashboard, and have them automatically reflected in your app.

By default, it uses three plans with seat limits of:

- low (Hobby): 1 seat
- mid (Startup): 10 seats
- high (Business): 25 seats

You might need to tweak a bit of test code if you want to change these limits. Do a fuzzy search for these limits.

For local development, run your app with `npm run dev` and forward webhooks to your local server with `stripe listen --forward-to http://localhost:3000/api/v1/stripe/webhooks`.

For production, follow the same instructions, but us the production URL of your
app and make sure your app is deployed so it will accept the webhooks of the product creation. If you messed this up, you can always retrigger the webhooks using the Stripe CLI.

1. Go to the [Stripe Dashboard for products](https://dashboard.stripe.com/test/products)
2. Click on "Create Product" (or "Add a product" if you have none).
3. In the modal:
  - Enter the name of the product, e.g.: "Hobby Plan"
  - (Optional) Enter a description of the product, e.g.: "Hobby Plan for 1 user", and upload an image.
  - In the "Product Tax Code" dropdown, select "Software as a Service (SaaS) - business use".
  - Click on "More Options" and set the "Unit label" to "seat".
  - Enter a monhtly recurring price, e.g.: "$17". Make sure you set the currenty to USD in case its NOT the default.
  - Click on "More pricing options" and enter a lookup key, e.g.: "monthly_hobby_plan".
  - Click on "Next".
4. Click on "Add another price" and this time choose "Yearly" as the billing period. Make sure you enter the correct yearly price, e.g.: "$180". And remember to set the lookup key to "annual_hobby_plan".
5. **Important:** Now enter the value: "max_seats" in the metadata field and set it to "1". This app is set up to handle ALL limits via metadata. This allows you to easily change the limits for a product without having to change the code.
6. Finally, click "Add Product".
7. Now write your lookup keys in the `priceLookupKeysByTierAndInterval` object in `app/features/billing/billing-constants.ts`.

#### For Local Development: Replay the Events

After you’ve created your products and prices locally (with `npm run dev` and `stripe listen` forwarding to your webhook endpoint), you’ll see lines in your terminal like:

```
2025-05-10 17:58:56   --> product.created \[evt\_XXXXXXXXXXXXXXXXXXXXXXXX]
2025-05-10 17:58:58   --> price.created   \[evt\_YYYYYYYYYYYYYYYYYYYYYYYY]
2025-05-10 17:59:00   --> price.created   \[evt\_ZZZZZZZZZZZZZZZZZZZZZZZZ]
…etc.
```

1. **Copy the event IDs**  
   Whenever you see a line ending with `[evt_…]`, copy that ID (everything inside the brackets, for example `evt_XXXXXXXXXXXXXXXXXXXXXXXX`).

2. **Save them for later**  
   Put all your event IDs into a file (e.g. `stripe-events.txt`) or an environment variable. For example, in a Unix-style shell you might do:
   ```bash
   # stripe-events.txt
   evt_XXXXXXXXXXXXXXXXXXXXXXXX
   evt_YYYYYYYYYYYYYYYYYYYYYYYY
   evt_ZZZZZZZZZZZZZZZZZZZZZZZZ
   # …etc.
   ```

3. **Replay (resend) the events**
   When you need to wipe your local database and re-seed via webhooks, you can replay all those events at once. For example, if you saved them in `stripe-events.txt`:

   ```bash
   xargs -n1 stripe events resend < stripe-events.txt
   ```

   This command is also available via `npm run stripe:resend-events`.

> **Tip:** Keep `stripe-events.txt` checked into your repo (or in a safe place) so you can easily replay your entire setup whenever you rebuild your local database.

### 2. Seed Stripe Data for Tests (Local vs. CI)

Your test suite relies on having Stripe products & prices in your database. Here’s how it works in each environment:

#### Local

1. **Replay your real events** (see “For Local Development: Replay the Events” above) so your DB contains the exact products, prices, metadata, and lookup keys you configured in Stripe.
2. **Run Vitest**:
   ```bash
   npm test
   ```

The global setup (`app/test/vitest.global-setup.ts`) will detect your existing products/prices and simply verify they’re present.

#### CI

In CI you won’t have webhook events or a populated database, so we automatically seed dummy data:

* **Global setup file**: `app/test/vitest.global-setup.ts`
* **Seeding helper**: `ensureStripeProductsAndPricesExist()` in `app/test/server-test-utils.ts`

What it does before your tests run:

1. Looks up each lookup key defined in `priceLookupKeysByTierAndInterval`.
2. If no product exists yet, creates one via `createPopulatedStripeProduct()` + `saveStripeProductToDatabase()`.
3. Creates both monthly & annual prices for that product with the right lookup keys & intervals.
4. Logs success or exits on error, ensuring your tests always see exactly the pricing rows they expect.

You don’t need to replay webhooks or manage `stripe-events.txt` in CI—this script handles everything. Just push your code and let your CI pipeline run `npm test`.

### 3. Configure the Customer Portal

Add the prices you created to your customer portal.

### Intentional Design Decisions

- Downgrading a subscription does **not** deactivate existing members. The reasoning is simple: more active users typically means more revenue. Automatically removing members would work against that. If your plan has other limits, you should handle those restrictions yourself - but since subscriptions are billed per user per month, it’s in your interest to avoid limiting user count unnecessarily.
- Users can still be added even if the subscription is cancelled. This allows you to generate more revenue if the customer decides to subscribe again - since pricing is per user, more added users means a higher monthly total once they reactivate.

