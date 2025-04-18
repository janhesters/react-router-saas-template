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

## Check Out the Epic Stack

Some of the code of this starter template was taken from or inspired by the [Epic Stack](https://github.com/epicweb-dev/epic-stack) from [Kent C. Dodds](http://kentcdodds.com/). His template has different defaults, so check it out if you're looking for a different opinionated starter template.

## Built with ❤️ by [ReactSquad](https://reactsquad.io/)

If you want to hire senior React developers to augment your team, or build your entire product from scratch, [schedule a call with us](https://www.reactsquad.io/schedule-a-call).
