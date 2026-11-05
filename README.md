# Planksgiving 2026 landing page

React + TypeScript + Vite starter for the Planksgiving 2026 landing page, ready for
Netlify. Repository: https://github.com/InfernoTeamLV/Planksgiving-2026-Landing-Page

The current page uses the TNT starter content. Event copy and branding can be
customized in `src/main.tsx` and `src/styles.css`.

## Run locally

Use Node.js 24 LTS, then run from this folder:

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Open http://127.0.0.1:5174. The development server listens only on this computer,
updates automatically when you save changes, and fails clearly if the port is
already in use. Stop it with Ctrl+C. The `.nvmrc` records Node.js 24 for version managers.
The page works without credentials. Customize the content in `src/main.tsx` and
the visual design in `src/styles.css`.

## Configure integrations

Set these values in `.env.local`:

- `VITE_APP_URL`: the absolute URL of your existing member app's login page.
  Without it, the call to action scrolls to the member-access information section.
- `VITE_SUPABASE_URL`: your Supabase project URL.
- `VITE_SUPABASE_PUBLISHABLE_KEY`: your browser-safe publishable key.

`src/lib/supabase.ts` exports `getSupabase()` for future data or auth features. It
initializes only when called and reports missing configuration. The marketing
page currently makes no database requests, collects no data, and creates no auth
accounts or database tables. Before adding public data access, enable row-level
security and grant only the operations the feature needs. Never use a service-role
or secret key in `VITE_` variables: these values are included in browser bundles.

## Build and deploy to Netlify

```powershell
npm run build
npm run preview
```

Create a Netlify project connected to this repository. Leave the **base directory
empty** (the app lives at the repository root), set the build command to
`npm run build`, and publish directory to `dist`. Netlify will use `netlify.toml`,
including SPA routing and security headers.

Add the three environment variables above in the Netlify project settings with
Builds scope, then deploy. Any change to these variables requires a fresh build
and deployment. Use a separate Supabase project for development if adding write
operations. If you add Supabase Auth, configure its Site URL and allowed redirect
URLs for each environment before implementing the auth flow.

Dependency versions match the packages installed in the parent workspace at setup
time; they are not claimed to be the latest registry releases.

## Local testing workflow

1. Use `npm run dev` while editing the page. Check desktop and narrow mobile widths,
   the navigation menu, keyboard focus, and the member-access links.
2. Run `npm run build` to check TypeScript and produce the production files.
3. Run `npm run preview` and open http://127.0.0.1:4174 to test the production build.
   This previews static output; Netlify headers and redirects apply after deployment.
4. Keep `.env.local` private. The supplied local file is intentionally blank and
   does not connect to the existing TNT production database. Add a development
   Supabase project's public values when you implement a backend feature.

This is a normal Git checkout with `origin` pointing to the Planksgiving repo.
For future changes, create a branch with `git switch -c codex/your-change`, commit
the files, and push with `git push -u origin codex/your-change`.

References: [Vite environment variables](https://vite.dev/guide/env-and-mode),
[Supabase client initialization](https://supabase.com/docs/reference/javascript/initializing),
[Vite on Netlify](https://docs.netlify.com/build/frameworks/framework-setup-guides/vite/).
