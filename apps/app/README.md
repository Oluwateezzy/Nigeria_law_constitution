# App

Expo Router client for iPhone, Android, and web.

## Versions

Recorded for this scaffold:

| Tool         | Version                                           |
| ------------ | ------------------------------------------------- |
| Node.js      | 24.22.1 (Active LTS, pinned in the root `.nvmrc`) |
| Expo SDK     | 58 (`expo` ~58.0.19)                              |
| React Native | 0.88.0                                            |

## Variants

`APP_VARIANT` selects `local` (the default), `preview`, or `production`.

| Variant    | iOS bundle id and Android package |
| ---------- | --------------------------------- |
| local      | `com.nigerialaw.reader.local`     |
| preview    | `com.nigerialaw.reader.preview`   |
| production | `com.nigerialaw.reader`           |

Preview and production use different identifiers. Set the variable before a native run:

```bash
APP_VARIANT=preview pnpm ios
```

## Secrets map

Empty examples live in `apps/app/.env.example` (client) and `supabase/.env.example` (server). Do not commit real values.

| Secret                    | Variable                             | Where it lives                  | Client |
| ------------------------- | ------------------------------------ | ------------------------------- | ------ |
| Supabase URL              | `EXPO_PUBLIC_SUPABASE_URL`           | App env, all variants           | Yes    |
| Supabase anon key         | `EXPO_PUBLIC_SUPABASE_ANON_KEY`      | App env, all variants           | Yes    |
| Supabase service role     | `SUPABASE_SERVICE_ROLE_KEY`          | Supabase function secrets       | Never  |
| Hosted model key          | `HOSTED_MODEL_KEY`                   | Supabase function secrets       | Never  |
| RevenueCat public SDK key | `EXPO_PUBLIC_REVENUECAT_SDK_KEY`     | App env, preview and production | Yes    |
| RevenueCat secret         | `REVENUECAT_SECRET_KEY`              | Supabase function secrets       | Never  |
| Stripe publishable key    | `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | App env, preview and production | Yes    |
| Stripe secret             | `STRIPE_SECRET_KEY`                  | Supabase function secrets       | Never  |
| Stripe webhook secret     | `STRIPE_WEBHOOK_SECRET`              | Supabase function secrets       | Never  |
| RevenueCat webhook secret | `REVENUECAT_WEBHOOK_SECRET`          | Supabase function secrets       | Never  |

The hosted model key, the service role, the Stripe secret, and the RevenueCat secret must never be shipped in the client.
