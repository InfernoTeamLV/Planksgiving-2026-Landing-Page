# Planksgiving 2026 landing page

React + TypeScript + Vite starter for the Planksgiving 2026 landing page, ready for
Netlify. Repository: https://github.com/InfernoTeamLV/Planksgiving-2026-Landing-Page

The page follows the supplied Planksgiving wireframe, with separate Hero, About,
Registration, and FAQ components in `src/main.tsx` and responsive styles
in `src/styles.css`. Navigation and FAQ disclosures work without backend access.
Registration validates contact details and age confirmation, then saves seasonal
submissions to the TNT Supabase database. The current form collects name, email,
phone and age confirmation, without asking for membership or displaying pricing.
Saved registrations open a branded confirmation
dialog and queue confirmation and staff notification emails.

## Run locally

Use Node.js 24 LTS, then run from this folder:

```powershell
npm ci
if (!(Test-Path .env.local)) { Copy-Item .env.example .env.local }
npm run dev
```

Open http://127.0.0.1:5174. The development server listens only on this computer,
updates automatically when you save changes, and fails clearly if the port is
already in use. Stop it with Ctrl+C. The `.nvmrc` records Node.js 24 for version managers.

If your active Node version is older, you can run an isolated Node.js 24 runtime
without changing your system's selected version (Windows PowerShell):

```powershell
npm.cmd exec --yes --package=node@24 -- npm run dev
npm.cmd exec --yes --package=node@24 -- npm run build
```

The first invocation downloads and caches the runtime, so it needs npm registry access.
The page works without credentials. Customize the content in `src/main.tsx` and
the visual design in `src/styles.css`.

## Configure integrations

Set these values in `.env.local`:

- `VITE_APP_URL`: reserved for future member-app linking; currently unused.
- `VITE_SUPABASE_URL`: your Supabase project URL.
- `VITE_SUPABASE_PUBLISHABLE_KEY`: your browser-safe publishable key.

The current local configuration points to the existing TNT project
`jngvmbwwrjlgglqsrggw`. Registration uses its Data API with a browser-safe key.
Never use a service-role or secret key in `VITE_` variables: these values are
included in browser bundles. Missing configuration fails clearly and does not
report a successful registration.

### Seasonal submissions

- `public.tnt_seasonal_forms` holds event settings, prices and the registration cutoff.
- `public.tnt_seasonal_form_submissions` stores contact details, self-reported
  optional historical membership, age confirmation, creation time and a staff-managed status.
- The event key is `planksgiving-2026`. Registration closes November 26, 2026,
  at 7:00 AM Pacific. Only one registration per email per event is accepted.
- Anonymous visitors can insert the permitted registration fields, but cannot read
  submissions or set administrative status. Authenticated TNT admins with the existing
  `app_metadata.role = admin` claim can read and manage submissions.
- New registrations leave membership unspecified (null), without assuming member
  or guest status. Historical self-reported values are retained and grant no access.
- The migration in `supabase/migrations/20261106211254_tnt_seasonal_form_submissions.sql`
  is also mirrored in the parent TNT checkout. It was applied to TNT and recorded in
  migration history on November 6, 2026.

Staff can review submissions in the Supabase Table Editor. No new TNT dashboard
screen has been added.

### Registration emails

The `seasonal-email-worker` Supabase Edge Function sends through Yahoo SMTP over
TLS on port 465. The sender and staff recipient use server-only mailbox settings;
the participant receives their own confirmation at their submitted address. Member
and guest emails contain different entry and follow-up information.

The two email migrations are mirrored in the parent TNT checkout and applied to
TNT. A private transactional outbox queues both emails only after a successful
registration. A database cron job checks every minute. Jobs are claimed exclusively;
temporary SMTP rejections retry with backoff, permanent rejections stop, and
interrupted sends are held as `uncertain` for staff review to avoid duplicates.
`accepted` means Yahoo accepted the message, not proof of inbox delivery.

Server-only Supabase Edge Function secrets:

- `SEASONAL_SMTP_PASSWORD`: Yahoo-generated app password, configured directly in
  Supabase Secrets. Never place it in `VITE_` variables or commit it.
- `SEASONAL_SMTP_USER` and `SEASONAL_STAFF_EMAIL`: bare mailbox addresses, configured
  directly in Supabase Secrets. They can use the same mailbox.
- `SEASONAL_EMAIL_WORKER_SECRET`: dedicated random worker authentication key,
  also stored in database Vault as `seasonal_email_worker_secret`.

The worker is deployed with gateway JWT verification disabled because it checks
its own private bearer key before accessing data. Public callers cannot process
or inspect the queue. Its claim/finish RPCs are granted only to `service_role`.
The scheduler is active; missing or invalid SMTP credentials leave registrations
queued without consuming delivery attempts.

Deploy updates with `supabase functions deploy seasonal-email-worker --project-ref
jngvmbwwrjlgglqsrggw --use-api --workdir .`. In the shared TNT workspace,
`node scripts/configure-seasonal-email-worker.mjs` configures/rotates the worker
key without logging it, then invokes the worker (which can send pending mail).
Do not run this helper during an active send. It does not change the Yahoo password.

For manual tests, use an inbox you control: saving a form now sends real emails.
Review failed/uncertain jobs in `private.tnt_seasonal_email_outbox` using privileged
database access. Review Yahoo bounces in the sender mailbox. Never blindly retry
an `uncertain` job; first confirm the message was not already sent.

## Build and deploy to Netlify

Deployment accounts:

- GitHub repository: `InfernoTeamLV/Planksgiving-2026-Landing-Page`.
- Netlify project: `infernoplanksgiving2026`, in Monica’s `monica-hd9w0m0` team.
- Future commits and Git pushes from this checkout use the repository-local
  `InfernoTeamLV` identity. Existing commit history is preserved.

```powershell
npm run build
npm run preview
```

Create a Netlify project connected to this repository. Leave the **base directory
empty** (the app lives at the repository root), set the build command to
`npm run build`, and publish directory to `dist`. Netlify will use `netlify.toml`,
including SPA routing and security headers.

Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in the Netlify project
settings with Builds scope, then deploy. `VITE_APP_URL` is optional and unused.
Production builds intentionally fail if the TNT URL or browser-safe key is missing
or a privileged key is supplied. `.env.local` is ignored by Git and is not uploaded
to Netlify. Any change to these variables requires a fresh build
and deployment. Use a separate Supabase project for development if adding write
operations. If you add Supabase Auth, configure its Site URL and allowed redirect
URLs for each environment before implementing the auth flow.

Dependency versions match the packages installed in the parent workspace at setup
time; they are not claimed to be the latest registry releases.

## Local testing workflow

1. Use `npm run dev` while editing the page. Check desktop and narrow mobile widths,
   navigation links, keyboard focus, and the mobile Register button.
2. Run `npm run build` to check TypeScript and produce the production files.
3. Run `npm run preview` and open http://127.0.0.1:4174 to test the production build.
   This previews static output; Netlify headers and redirects apply after deployment.
4. Keep `.env.local` private. This checkout now saves real submissions to TNT.
   Use a test inbox you control for delivery tests and remove only those test rows afterward.
5. `npm run test:registration` checks normalization, validation, duplicate/network
   errors and confirmed-success handling. `npm run test:db` uses an in-memory
   database to check constraints, public privacy, admin access and event closure;
   it does not write to TNT. `npm run test:emails` checks email wording, HTML escaping,
   recipient routing, queue privacy, claims, retries and interrupted sends without
   connecting to Yahoo or writing to TNT.

### Section review

- `/#about`: compare the community introduction with the supplied reference.
- `/#registration`: review contact fields and age confirmation,
  age confirmation, inline errors and the pending/success states. A successful
  submission now writes to TNT.
- `/#faq`: open and close each answer, including with keyboard Enter/Space.
- At mobile widths, check that the header shows only Register, that it jumps to
  the form, and that the hero's date, time and location share one row without
  horizontal overflow. Desktop retains About, FAQ and Register links.

Production images live in `public/images/` as optimized WebP assets. The hero uses
the supplied turkey animation with all 14 frames and original timing preserved.
The header uses the transparent Inferno logo. Original artwork and unused design
alternatives are retained in `design-assets/`, outside the public deployment.
Run `npm run optimize:assets` to reproduce optimized images. The three page images
total 610 KB, down from 4.49 MB (about 86% smaller). Fonts are bundled locally using
the Latin subset of `@fontsource/barlow-condensed`. The tab title is Inferno
Planksgiving 2026, with the turkey-over-circle-logo favicon.

### Production review — November 6, 2026

`npm run build`, registration/database/email tests, `npm run check:production`,
and the dependency audit passed. Desktop and 390px mobile production previews
loaded the logo, animated mascot, autumn background and fonts with the same
common security headers as Netlify, without console errors or horizontal overflow.
The logo links to Inferno's home page; the FAQ waiver opens the supplied intake
form in a new tab with `noopener noreferrer`. Both URLs returned HTTP 200.

Security headers restrict scripts, styles and images to this site and database
connections to the TNT project. Source maps and private credentials are excluded
from deployment. `npm run check:production` verifies bundled links, image/font
references, hidden/source artifacts and privileged-key exposure. To run read-only
live permission and rejected-input checks with the ignored local config, use
`node scripts/check-live-registration-security.mjs` (no saved registrations or emails).

Database-enforced submission limits are 3 per phone per hour, 30 per event per
minute and 200 per event per hour. Rejected attempts do not queue emails. These
limits curb bursts; they do not verify identity or replace CAPTCHA if sustained
abuse becomes an issue. The migration is applied and mirrored in the TNT checkout.

The Supabase security advisor reports no seasonal-form findings. It still flags
TNT's existing disabled leaked-password protection setting. The dashboard confirms
that this feature requires Pro or above, while the project is on Free. This landing
page does not use password authentication; no billing or TNT-wide Auth settings
were changed.

The final security review also hardened email recipients in browser validation,
database constraints and the mail worker. Address lists, display-name syntax and
header injection are rejected, and SMTP receives one structured recipient and an
explicit single-recipient envelope. Mailbox addresses now live in server-only
settings instead of source or test fixtures. Regression checks cover these inputs.
Both the npm website dependencies and all 90 packages in the Deno lockfile had
zero known advisories at review time. `npm run check:secrets` scans working files
and reachable Git history without displaying credential values; the scan was clean.
EXIF/XMP metadata was also removed from the archived original logo; the scanner
checks image metadata before future pushes.

The finished static build is approximately 1 MB before HTTP compression. Original
multi-megabyte design files and Supabase source/configuration are not in `dist`.
Netlify's actual deployed headers, environment values and CDN behavior must still
be verified after a deploy; a local production preview cannot establish those.

This is a normal Git checkout with `origin` pointing to the Planksgiving repo.
For future changes, create a branch with `git switch -c codex/your-change`, commit
the files, and push with `git push -u origin codex/your-change`.

References: [Vite environment variables](https://vite.dev/guide/env-and-mode),
[Supabase client initialization](https://supabase.com/docs/reference/javascript/initializing),
[Vite on Netlify](https://docs.netlify.com/build/frameworks/framework-setup-guides/vite/).

### Latest verification — November 9, 2026

The production build and registration, database, throttling, email, asset and
credential checks passed. Compressed JavaScript is 70.9 KiB, compressed CSS is
6.9 KiB, and the complete uncompressed static build is 1007.5 KiB. The production
preview served the configured security headers and loaded every page image and font.

Production layouts were checked at 320, 390, 768, 1032 and 1368px widths, with no
horizontal overflow or browser warnings/errors. The contact-only form is 500×560px
on tablets/desktop and 540px tall on phones. Three FAQ questions remain. New
submissions omit membership, save it as null and receive neutral confirmation copy.
Historical member/guest submissions remain intact.

Website and email-worker dependency audits reported zero known vulnerabilities.
Public registration reads and mail queue/worker access returned HTTP 401; the
recipient-injection test returned HTTP 400. The existing Pro-only leaked-password
protection warning described above remains the sole Supabase advisor finding.
