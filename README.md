# A little more each day

A private, single-page gift site: a pink lily that grows a little every day from today's start date until it blooms on a chosen date in the future — then reveals a letter.

## Stack

- React + TypeScript + Vite
- `motion/react` for animation
- Plain CSS (no UI framework)
- `localStorage` for the "watered today" record — no backend, no accounts, no tracking
- Optionally: a Vercel serverless function + Vercel Cron + Redis + Resend for the monthly anniversary emails (see [below](#monthly-anniversary-emails)) — the frontend itself works fully without any of this configured

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

A separate, optional piece: `/api/monthaversary.ts` is a Vercel serverless function, triggered by Vercel Cron, that emails both of you a "Happy monthaversary!" note every month on the relationship's anniversary day (the same day-of-month as `startDate` in `src/config.ts` — the 11th, in the default config), at 09:00 Europe/Belgrade time. It's independent of the frontend — the static site works fine with or without this configured.

- Before the configured `bloomDate`, the email includes days remaining until the lily blooms.
- On `bloomDate` itself, a special "the lily has bloomed" email is sent instead (no countdown).
- After `bloomDate`, monthly emails continue with no countdown.
- Each recipient gets their own email, addressed by name.
- The relationship start date is `src/config.ts` → `startDate` (already source-controlled, not secret). Recipient email addresses live server-side only, in an env var — never in the frontend bundle.

### How the schedule works (and why it needs periodic checks, not a fixed-time cron)

Vercel Cron schedules are UTC-only and (on most plans) can't run more than once a day, but 09:00 in Europe/Belgrade shifts between UTC+1 (CET) and UTC+2 (CEST) across the year. So instead of trying to express "09:00 Belgrade" as a single UTC cron time, `vercel.json` schedules the function **hourly**, in UTC:

```json
{ "crons": [{ "path": "/api/monthaversary", "schedule": "0 * * * *" }] }
```

Every hour, the function resolves the current time in `Europe/Belgrade` (via `Intl.DateTimeFormat`, which already accounts for DST) and only actually sends once it's the anniversary day of the month **and** the local hour is 9 or later — the "or later" is deliberate, so that if a send fails at 09:00 (e.g. Resend is down), the next hourly run that same day retries it, without waiting for next month. Once a recipient has a successful delivery recorded for that month, later runs skip them for the rest of the day. Nothing is ever backfilled for a day that's already passed.

**If your Vercel plan only allows one cron invocation per day** (not hourly), you'll need to pick a single fixed UTC hour instead, and accept that the actual local send time will drift by up to an hour depending on the season — e.g. `"0 8 * * *"` sends at exactly 09:00 Belgrade time in winter (CET) but 10:00 in summer (CEST). Upgrading to a plan with hourly cron is the only way to hit 09:00 local exactly year-round with this design.

### Setup

1. **Resend account** ([resend.com](https://resend.com)): sign up, add and verify a sending domain (DNS records they give you), then create an API key.
2. **Deploy this repo to Vercel** (if not already) so `vercel.json`'s cron config takes effect — cron jobs only run for production deployments.
3. **Add a Redis store**: in the Vercel dashboard → your project → Storage → add a Redis integration (Upstash-backed). This provisions `KV_REST_API_URL` / `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — either naming is supported) as project env vars automatically. This is the durable store that tracks, per recipient and per month, whether that anniversary's email has already been sent — so retries never double-send.
4. **Set the remaining environment variables** (Project Settings → Environment Variables — see [`.env.example`](.env.example) for the full list with descriptions):
   - `RESEND_API_KEY` — from step 1.
   - `RESEND_FROM` — an address on your verified domain, e.g. `"Us <hello@yourdomain.com>"`.
   - `ANNIVERSARY_RECIPIENTS` — JSON array of `{"id", "name", "email"}` for each of you. `id` is a stable key used for delivery-dedup; don't change it once emails have gone out for that recipient.
   - `SITE_URL` — the deployed gift site's URL, used for the email's button.
   - `CRON_SECRET` — any long random string (`openssl rand -hex 32`). Vercel automatically sends it as `Authorization: Bearer <value>` on its own Cron requests once this env var exists; you pass it yourself for manual/dry-run calls. **There is no way to trigger a send, or see/change recipients, without this secret** — the endpoint 401s without it.
5. Redeploy so the new env vars and `vercel.json` cron config take effect.

### Dry run (preview without sending)

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://your-site.example.com/api/monthaversary?dryRun=1"
```

Returns the rendered subject/HTML for each recipient without sending anything or touching delivery records. Add `&asOf=YYYY-MM-DD` to preview as if today were a different date (e.g. `asOf=2027-05-11` to preview the bloom-day email, or any other date to preview the regular monthly one) — `asOf` only works together with `dryRun`.

### If credentials aren't set up yet

The integration is fully implemented and safe to deploy as-is: with `RESEND_API_KEY`/`RESEND_FROM` unset, real sends fail gracefully per-recipient (reported in the JSON response, nothing left half-sent) while dry runs keep working for previewing copy. Nothing here can send an email or expose a recipient's address without the `CRON_SECRET` — there's no public/unauthenticated path in.

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
    resend.ts                Minimal Resend REST client (Idempotency-Key)
    delivery-store.ts        Redis-backed per-recipient/per-month send tracking

vercel.json                  Hourly cron schedule for api/monthaversary.ts
.env.example                 Documents required env vars for the email function
```
