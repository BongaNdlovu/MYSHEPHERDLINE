# MyShepherdLine

Expo + React Native + TypeScript app for congregation shepherding, migrated from the HTML prototype in `reference/prototype/`.

## Stack

- **Mobile:** Expo Router, React Native, TypeScript
- **Auth & data:** Supabase
- **API:** Cloudflare Workers (`worker/`)
- **Push:** Expo Push Notifications

## Setup

1. Install dependencies:

```powershell
npm.cmd install
```

2. Copy env values:

```powershell
copy .env.example .env
```

3. Apply Supabase schema from `supabase/schema.sql`.

4. Deploy the worker:

```powershell
cd worker
npm.cmd install
npx.cmd wrangler secret put SUPABASE_URL
npx.cmd wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npm.cmd run deploy
```

Set `EXPO_PUBLIC_WORKER_API_URL` in `.env` to the deployed `*.workers.dev` URL.

## Run

```powershell
npm.cmd start
npm.cmd run android
```

## EAS

Project ID: `05bdcb19-5d5f-4d5b-bfaa-5f9c5483bfd4`

```powershell
npx.cmd eas-cli build --profile preview --platform android
```

## Reference

The original single-file prototype lives at `reference/prototype/myshepherdline_app.html`.
