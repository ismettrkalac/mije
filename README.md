# A little more each day

A private, single-page gift site: a pink lily that grows a little every day from today's start date until it blooms on a chosen date in the future — then reveals a letter.

## Stack

- React + TypeScript + Vite
- `motion/react` for animation
- Plain CSS (no UI framework)
- `localStorage` for the "watered today" record — no backend, no accounts, no tracking

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

`dist/` is fully static — no server-side code, no environment variables, no API. Deploy it anywhere that serves static files:

- **Netlify / Vercel**: point at this repo, build command `npm run build`, publish directory `dist`.
- **GitHub Pages**: build, then push the contents of `dist/` to a `gh-pages` branch (or use an action that does so). The Vite config already uses relative asset paths (`base: "./"`), so it works from a subpath.
- **Anything else**: copy `dist/` to any static file host (S3, Cloudflare Pages, a plain nginx box, etc).

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
```
