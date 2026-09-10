# A little more each day

A private, single-page gift site: a pink lily that grows a little every day from today's start date until it blooms on a chosen date in the future — then reveals a letter.

## Stack

- React + TypeScript + Vite
- `motion/react` for animation
- Plain CSS (no UI framework)
- `localStorage` for the "watered today" record — no backend, no accounts, no tracking
- Optionally: a Vercel serverless function + Vercel Cron + Gmail SMTP for the monthly anniversary emails, with delivery tracking stored as a JSON file in this GitHub repo (see [below](#monthly-anniversary-emails)) — the frontend itself works fully without any of this configured

## Setup

```bash
npm install
npm run dev
```

Open the printed local URL (Vite defaults to `http://localhost:5173`). The dev server hot-reloads on save.

## Configuration

Everything specific to this gift lives in one file: [`src/config.ts`](src/config.ts).

```ts
export const gardenConfig: GardenConfig = {
  startDate: "2026-09-09",     // YYYY-MM-DD, growth begins here
  bloomDate: "2027-05-11",     // YYYY-MM-DD, full bloom + letter unlock
  timezone: "Europe/Belgrade", // IANA timezone used to resolve "today"
  recipientName: "my love",
  heading: "A little more each day",
  caption: "Something beautiful is growing.",
  letterTitle: "For you",
  letterText: "If patience could grow petals, it would look like this. ...",
  letterSignature: "Yours, always",
};
```

Change the dates, names, and letter text here — nothing else in the codebase needs to be touched for a content change.

### Background photo

The room backdrop is a single image at [`public/background.png`](public/background.png) — a photo of a white vase on a table. The plant is positioned to grow up out of that vase's opening. To swap in a different photo:

1. Replace `public/background.png` with your own image (same filename, or update the path in `src/App.css` → `.room-photo`).
2. The layout assumes the vase opening sits roughly **center-horizontally** and around **55% down** the image, and that the photo is roughly **square**. If your photo's vase is in a different spot, adjust the `.garden-stage` rule in `src/App.css` (`top`, `height`) until the stem lines up with the opening — the dev date-preview panel (see below) is the fastest way to check alignment at different growth stages without waiting for real days to pass.

> The bundled `background.png` is a photo the recipient/user supplied for their own private, non-commercial gift page. If you intend to publish this site somewhere public, make sure you have the rights to use whatever background photo you put in its place.

## How growth is calculated

All of the logic lives in [`src/lib/date.ts`](src/lib/date.ts) and [`src/lib/growth.ts`](src/lib/growth.ts).

- "Today" is resolved as a **calendar date** (`YYYY-MM-DD`) in the configured timezone via `Intl.DateTimeFormat`, not a raw timestamp.
- Calendar dates are converted to whole **epoch days** (`Date.UTC(y, m, d) / 86400000`), and growth is `(today - start) / (bloom - start)`, clamped to `[0, 1]`.
- Because everything after that point is whole-day arithmetic (no hours/minutes involved), the same calendar date always produces the same growth value on any device, and DST transitions never shift it — a day is still a day even when the clock jumps an hour.
- `useGrowth` (a hook) re-resolves "today" on a 60-second interval and whenever the tab regains focus/visibility, so growth advances correctly if the page is left open across midnight.

Growth (0–1) drives a continuous plant illustration (`src/components/plant/`) rather than four discrete images — stem height, leaf size, and bud swell are all smooth functions of the growth value, so the plant changes a little every day rather than jumping between fixed stages.

## Watering

"Water me" plays an animation and rotates through a few short messages every time it's tapped — that's independent of the growth schedule. Once per calendar day (same timezone logic as growth), the date is recorded to `localStorage` under `lily.lastWateredDate`; tapping again the same day still replays the animation but doesn't touch the record. Missing days does nothing — there's no streak, no penalty, no way to "damage" the plant.

## The bloom letter

On the bloom date, the flower plays a one-time opening animation and an "Open your letter" button appears below it. The letter overlay is an accessible modal dialog (focus is trapped and restored, `Escape` closes it, it's labelled for screen readers). This is a delightful date-gate, not a security feature — anyone with the URL and a system clock past the bloom date sees the open flower immediately, and if someone's first-ever visit is after the bloom date, they see it fully bloomed right away with no replayed animation.

`prefers-reduced-motion` is respected throughout: the bloom opens instantly instead of animating, and idle sway/pop animations are skipped.

## Development preview panel

In `npm run dev`, a small "Dev: date preview" panel appears bottom-left with buttons to jump the displayed date to: before the start date, early/mid/late growth, the day before bloom, bloom day, and 30 days after bloom. It only overrides what date the UI *thinks* it is — it never writes to `localStorage`, so previewing never affects the real watering record. This panel is stripped out of production builds automatically (`import.meta.env.DEV` gate) and never renders in `npm run build` / `npm run preview`.

## Building and deploying

```bash
npm run build    # type-checks with tsc, then builds to dist/
npm run preview  # serve the production build locally to double-check it
```

`dist/` (the frontend) is fully static — no server-side code, no environment variables, no API. Deploy it anywhere that serves static files:

- **Netlify / Vercel**: point at this repo, build command `npm run build`, publish directory `dist`.
- **GitHub Pages**: build, then push the contents of `dist/` to a `gh-pages` branch (or use an action that does so). The Vite config already uses relative asset paths (`base: "./"`), so it works from a subpath.
- **Anything else**: copy `dist/` to any static file host (S3, Cloudflare Pages, a plain nginx box, etc).

The optional monthly anniversary emails (below) are the one part of this project that isn't static — they need Vercel specifically, since they use Vercel Cron + a Vercel serverless function.

## Monthly anniversary emails

A separate, optional piece: `/api/monthaversary.ts` is a Vercel serverless function, triggered by Vercel Cron, that emails both of you a "Happy monthaversary!" note every month on the relationship's anniversary day (the same day-of-month as `startDate` in `src/config.ts` — the 11th, in the default config), at 10:00 Europe/Belgrade time. It's independent of the frontend — the static site works fine with or without this configured.

- Before the configured `bloomDate`, the email includes days remaining until the lily blooms.
- On `bloomDate` itself, a special "the lily has bloomed" email is sent instead (no countdown).
- After `bloomDate`, monthly emails continue with no countdown.
- Each recipient gets their own email, addressed by name.
- The relationship start date is `src/config.ts` → `startDate` (already source-controlled, not secret). Recipient email addresses live server-side only, in an env var — never in the frontend bundle.

### How the schedule works (and why it needs a periodic check, not a fixed-time cron)

Vercel Cron schedules are UTC-only, and Hobby-plan projects are limited to **one cron invocation per day** (a more frequent expression fails at deployment — this is why the first deploy attempt here failed until the schedule below was in place). But 10:00 in Europe/Belgrade shifts between UTC+1 (CET) and UTC+2 (CEST) across the year, so a single fixed UTC time can't land on 10:00 local in both seasons. `vercel.json` schedules the function once daily, at **09:00 UTC**:

```json
{ "crons": [{ "path": "/api/monthaversary", "schedule": "0 9 * * *" }] }
```

The function then resolves the current time in `Europe/Belgrade` (via `Intl.DateTimeFormat`, which already accounts for DST) and only actually sends once it's the anniversary day of the month **and** the local hour is 10 or later. 09:00 UTC is deliberately chosen so that check always passes on the day it runs: it's exactly 10:00 local in winter (CET, UTC+1) and 11:00 local in summer (CEST, UTC+2) — never earlier than 10. So the real send time is 10:00 sharp roughly half the year, and drifts up to an hour late the rest of the year; it never misses a day entirely.

The tradeoff of only one invocation per day: there's no same-day retry window. If a send fails (e.g. Gmail is temporarily unreachable) at that one daily check, it won't be retried until the same time next day — by which point it's no longer the anniversary day, so that month's email for whichever recipient failed simply doesn't go out. Nothing is ever backfilled for a day that's already passed. Upgrading to a plan with more frequent cron and changing the schedule back to hourly (`"0 * * * *"`) removes this limitation and gives same-day retries, since the code's `>= 10` check (rather than `=== 10`) already supports that without any other changes.

### Setup

1. **Enable 2-Step Verification** on the sending Gmail account, if not already on (myaccount.google.com/security), then generate an **App Password** at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) (choose "Mail" / "Other"). This is a 16-character password scoped to SMTP access — not your real Google password.
2. **Deploy this repo to Vercel** (if not already) so `vercel.json`'s cron config takes effect — cron jobs only run for production deployments.
3. **Create a fine-grained GitHub personal access token**, scoped to only this repo, with **Contents: Read and write** permission and nothing else: [github.com/settings/tokens?type=beta](https://github.com/settings/tokens?type=beta) → "Generate new token" → Repository access: "Only select repositories" → this repo → Permissions → Repository permissions → Contents → Read and write. This is the durable store: the function commits a small JSON file (`data/monthaversary-deliveries.json` by default) to this repo recording, per recipient and per month, whether that anniversary's email has already been sent — so retries never double-send. No paid database needed.
4. **Set the remaining environment variables** (Project Settings → Environment Variables — see [`.env.example`](.env.example) for the full list with descriptions):
   - `GMAIL_USER` — the Gmail address emails are sent from.
   - `GMAIL_APP_PASSWORD` — from step 1.
   - `ANNIVERSARY_RECIPIENTS` — JSON array of `{"id", "name", "email"}` for each of you. `id` is a stable key used for delivery-dedup; don't change it once emails have gone out for that recipient.
   - `SITE_URL` — the deployed gift site's URL, used for the email's button.
   - `CRON_SECRET` — any long random string (`openssl rand -hex 32`). Vercel automatically sends it as `Authorization: Bearer <value>` on its own Cron requests once this env var exists; you pass it yourself for manual/dry-run calls. **There is no way to trigger a send, or see/change recipients, without this secret** — the endpoint 401s without it.
   - `GITHUB_DATA_TOKEN` — from step 3.
   - `GITHUB_DATA_REPO` — `owner/repo` of this repository, e.g. `ismettrkalac/mije`.
5. Redeploy so the new env vars and `vercel.json` cron config take effect.

No domain purchase, DNS setup, or paid storage is needed with this approach — emails send from your existing Gmail address, and delivery records live in this GitHub repo. Two tradeoffs worth knowing:
- Gmail SMTP has no idempotency-key mechanism, so duplicate-send protection relies solely on the delivery record being checked before every send (see `api/lib/delivery-store.ts`) rather than a provider-side guarantee.
- Since Vercel auto-deploys on push and the delivery record is committed to the same repo/branch as the site, each month's send also triggers a small redeploy of the site (harmless, just worth expecting).

### Dry run (preview without sending)

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://your-site.example.com/api/monthaversary?dryRun=1"
```

Returns the rendered subject/HTML for each recipient without sending anything or touching delivery records. Add `&asOf=YYYY-MM-DD` to preview as if today were a different date (e.g. `asOf=2027-05-11` to preview the bloom-day email, or any other date to preview the regular monthly one) — `asOf` only works together with `dryRun`.

### If credentials aren't set up yet

The integration is fully implemented and safe to deploy as-is: with `GMAIL_USER`/`GMAIL_APP_PASSWORD` unset, real sends fail gracefully per-recipient (reported in the JSON response, nothing left half-sent) while dry runs keep working for previewing copy. Nothing here can send an email or expose a recipient's address without the `CRON_SECRET` — there's no public/unauthenticated path in.

## Project structure

```
src/
  config.ts               Central config — dates, timezone, copy
  lib/
    date.ts                Calendar-day math (timezone-safe, DST-safe)
    growth.ts               Growth curve + stage calculation
    storage.ts              Safe localStorage wrapper (never throws)
  hooks/
    useGrowth.ts             Wall-clock-driven growth state
    useWatering.ts           "Watered today" record
    usePrefersReducedMotion.ts
  components/
    Background.tsx           Full-bleed room photo
    plant/
      Plant.tsx               Assembles stem/leaves/bud/flower from growth
      Leaf.tsx, Bud.tsx, Flower.tsx, geometry.ts
    WaterButton.tsx, WateringOverlay.tsx
    CountdownBadge.tsx
    LetterOverlay.tsx         Accessible modal
    DevDatePanel.tsx          Dev-only date preview (stripped from prod)
  App.tsx, App.css, index.css

api/                        Vercel serverless function (see "Monthly anniversary emails")
  monthaversary.ts           Cron target + dry-run entry point
  lib/
    anniversary.ts           Anniversary-day / bloom-day date math
    recipients.ts            Parses ANNIVERSARY_RECIPIENTS env var
    email-template.ts        Renders the monthly + bloom-day email HTML
    mailer.ts                 Sends via Gmail SMTP (nodemailer)
    delivery-store.ts        Per-recipient/per-month send tracking, stored as a JSON file via the GitHub Contents API

vercel.json                  Hourly cron schedule for api/monthaversary.ts
.env.example                 Documents required env vars for the email function
```
