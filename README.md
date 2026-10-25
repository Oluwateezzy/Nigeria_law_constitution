# Nigeria Constitution and Law

A reader for the Constitution of the Federal Republic of Nigeria and federal Acts. One section fills the screen. Previous and next stay inside that instrument. Search and notes work on the device, with no account required.

iPhone and Android are the primary apps. The web app is the same client.

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

| Area | Choice |
| --- | --- |
| Apps | Expo, Expo Router, TypeScript (iOS, Android, and web) |
| Shared logic | `packages/domain` — search, citations, quota, prompts, sync merge |
| Corpus | `packages/content` — reviewed legislative text and schema |
| On-device data | SQLite with FTS5 |
| Account and sync | Supabase Auth, Postgres, Row Level Security |
| Hosted AI | Supabase Edge Function proxy |
| Subscriptions | App Store and Google Play through RevenueCat; Stripe on web |

## Project structure

```
apps/app/               Expo Router application
packages/content/       Corpus, schema, and provenance
packages/domain/        Shared rules, with no UI or network imports
supabase/migrations/    Postgres schema
supabase/functions/     AI proxy and billing webhooks
```

The screen routes are Library (`/`), Scenario (`/scenario`), Notes (`/notes`), the reader (`/read/[instrumentId]/s/[sectionKey]`), and Settings.

## Getting started

The application is not in this repository yet, so there is nothing to install or run. The commands below are the workflow the app will use once it is added.

### Prerequisites

- Node.js, current LTS
- pnpm
- Xcode, for the iOS app
- Android Studio, for the Android app

### Install

```bash
pnpm install
```

### Run

```bash
pnpm ios
pnpm android
pnpm web
```

### Test

```bash
pnpm typecheck
pnpm test
```

## Configuration

Copy `.env.example` to a local env file when the app is added. The hosted model key, the Supabase service role, and the Stripe secret belong in server configuration only. A person's own API key is stored on the device and is not part of project configuration.

## Corpus

Legislative text ships inside the app after it is taken from a named source and reviewed. This repository does not yet contain that text, and it is not a statement of the current law.

## License

License to be added.
