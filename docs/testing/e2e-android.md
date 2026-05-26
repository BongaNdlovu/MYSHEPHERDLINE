# Maestro Android E2E Tests

Android-first end-to-end tests using [Maestro](https://maestro.mobile.dev/).

## Prerequisites

1. Install Maestro CLI: https://maestro.mobile.dev/docs/getting-started/installation
2. Android emulator running **or** physical device connected
3. App installed on the device:
   - **Preview/production build:** `com.myshepherdline.app` (recommended)
   - **Expo Go:** set `E2E_APP_ID=host.exp.exponent` (limited; prefer dev/preview build)
4. `.env` configured with valid Supabase credentials
5. Test shepherd account created in Supabase Auth
6. At least one member matching `E2E_MEMBER_NAME` in the database for member/visit flows
7. After scoped RLS is applied, that member should be **unassigned or assigned to the test shepherd** — otherwise member/visit flows will show empty results

## Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `E2E_APP_ID` | `com.myshepherdline.app` | Android application id |
| `E2E_EMAIL` | — | Test shepherd email |
| `E2E_PASSWORD` | — | Test shepherd password |
| `E2E_NEW_EMAIL` | — | Unique email for sign-up flow |
| `E2E_MEMBER_NAME` | `Sarah` | Member name visible in directory |

PowerShell example:

```powershell
$env:E2E_APP_ID = "com.myshepherdline.app"
$env:E2E_EMAIL = "shepherd@yourchurch.test"
$env:E2E_PASSWORD = "YourTestPassword123!"
$env:E2E_NEW_EMAIL = "shepherd-new-$(Get-Random)@yourchurch.test"
$env:E2E_MEMBER_NAME = "Sarah Mkhize"
```

## Run the app

Build/install a preview APK first (recommended):

```powershell
npx.cmd eas-cli build --profile preview --platform android
```

Start Metro for local dev builds:

```powershell
npm.cmd start
```

Install/run on emulator:

```powershell
npm.cmd run android
```

## Run E2E tests

All flows:

```powershell
npm.cmd run test:e2e
```

Single flow:

```powershell
maestro test .maestro/flows/02-auth-sign-in-success.yaml
```

## Flow coverage

| Flow | Scenario |
|------|----------|
| 01 | Landing → sign-in screen |
| 02 | Sign-in success → home |
| 03 | Sign-in failure toast |
| 04 | Sign-up |
| 05 | Member search + filter |
| 06 | Member profile |
| 07 | Log visit end-to-end |
| 08 | Complete a task |
| 09 | Reports summary loads |
| 10 | Sign out |
| 11 | Privacy policy |
| 12 | Reports fallback state |

## Push permission flows

Maestro cannot reliably assert OS notification dialogs across all Android versions in CI. Validate push manually after sign-in on a physical device, or extend flow `13-push-permission.yaml` once a dedicated test build disables auto-grant.

## Troubleshooting

- **Missing test IDs:** flows use `constants/testIds.ts` — keep IDs stable when changing UI.
- **Sign-in timeout:** disable email confirmation for the test user or confirm the account first.
- **Member flows fail:** seed a member whose `full_name` matches `E2E_MEMBER_NAME`.
