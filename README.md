# Nigeria Constitution and Law

A reader for the Constitution of the Federal Republic of Nigeria and federal Acts. One section fills the screen. Previous and next stay inside that instrument. Search and notes work on the device, with no account required.

iPhone and Android are the primary apps. The web app is the same client.

The public web address is not set. No tagged production deploy has been published. On that build, a section link is `/read/cfrn-1999/s/1`, a search link is `/?q=supremacy`, and the scenario screen is `/scenario`. The host serves the app for those paths.

The app explains the text it has loaded. That explanation is not legal advice.

## Features

- Read the Constitution and federal Acts one section at a time, with previous, next, and swipe.
- Search on the device by section number or by ordinary words, including while offline.
- Create and edit notes on a section, or notes that stand alone. Notes save on the device.
- Ask about the section on screen and get a plain-language explanation with a labeled illustration.
- Describe a situation on a separate scenario screen. Answers quote loaded provisions and open them.
- Sign in only to keep notes, reading position, and conversations on another device.

Hosted explanations allow 5 requests per day in Africa/Lagos. Plus raises that to 100 per day. A personal API key stays on the device and does not use that allowance. Reading, search, and notes stay available either way.

## Tech stack

| Area             | Choice                                                            |
| ---------------- | ----------------------------------------------------------------- |
| Apps             | Expo SDK 58, Expo Router, TypeScript (iOS, Android, and web)      |
| Shared logic     | `packages/domain` — search, citations, quota, prompts, sync merge |
| Corpus           | `packages/content` — reviewed legislative text and schema         |
| On-device data   | SQLite with FTS5                                                  |
| Account and sync | Supabase Auth, Postgres, Row Level Security                       |
| Hosted AI        | Supabase Edge Function proxy                                      |
| Subscriptions    | App Store and Google Play through RevenueCat; Stripe on web       |

## Project structure

```
apps/app/               Expo Router application
packages/content/       Corpus, schema, and provenance
packages/domain/        Shared rules, with no UI or network imports
supabase/migrations/    Postgres schema
supabase/functions/     AI proxy and billing webhooks
```

The screen routes are Library (`/`), Scenario (`/scenario`), Notes (`/notes`), the reader (`/read/[instrumentId]/s/[sectionKey]`), and Settings.

## Prerequisites

- Node.js 24.22.1 (see `.nvmrc`)
- pnpm 10.28.2
- Xcode, to run the iOS app
- Android Studio, to run the Android app

## Getting started

```bash
nvm install
nvm use
pnpm install
```

Run one client:

```bash
pnpm ios
pnpm android
pnpm web
```

The app opens on the Library screen.

## Checks

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm scan-secrets
```

`pnpm test` runs the domain sample tests, including the Lagos-day clock.

## Configuration

Copy `apps/app/.env.example` for client values and `supabase/.env.example` for server values. The hosted model key, the Supabase service role, the Stripe secret, and the RevenueCat secret stay on the server. The map of every secret is in [apps/app/README.md](apps/app/README.md).

`APP_VARIANT` is `local` by default. Preview uses a different bundle identifier from production.

## Corpus

Legislative text ships inside the app after it is taken from a named source and reviewed. This repository does not yet contain that text, and it is not a statement of the current law.

## License

License to be added.
