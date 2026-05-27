# Maestro Android E2E Tests

Android-first end-to-end tests using [Maestro](https://maestro.mobile.dev/).

## Prerequisites

1. Install Maestro CLI: [Maestro installation guide](https://maestro.mobile.dev/docs/getting-started/installation)
2. Android emulator running **or** physical device connected
3. App installed on the device:
   - **Preview/production build:** `com.myshepherdline.app` (recommended)
   - **Expo Go:** set `E2E_APP_ID=host.exp.exponent` (limited; prefer dev/preview build)
4. `.env` configured with valid Supabase credentials
5. Test shepherd account created in Supabase Auth
6. At least one member matching `E2E_MEMBER_NAME` in the database for member/visit flows
7. After scoped RLS is applied, that member must be **assigned to the test shepherd** — otherwise member/visit flows
   will show empty results

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `E2E_APP_ID` | `com.myshepherdline.app` | Android application id |
| `E2E_EMAIL` | — | Test shepherd email |
| `E2E_PASSWORD` | — | Test shepherd password |
| `E2E_ADMIN_EMAIL` | — | Test admin email (admin Maestro flows) |
| `E2E_ADMIN_PASSWORD` | — | Test admin password |
| `E2E_MEMBER_NAME` | `Sipho` | Member name visible in directory (must be assigned to test shepherd) |

PowerShell example:

```powershell
$env:E2E_APP_ID = "com.myshepherdline.app"
$env:E2E_EMAIL = "shepherd@yourchurch.test"
$env:E2E_PASSWORD = "YourTestPassword123!"
$env:E2E_ADMIN_EMAIL = "admin@yourchurch.test"
$env:E2E_ADMIN_PASSWORD = "YourTestPassword123!"
$env:E2E_MEMBER_NAME = "Sipho"
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

Smoke (CI-friendly subset):

```powershell
npm.cmd run test:e2e:smoke
```

Admin flows (requires admin test account):

```powershell
npm.cmd run test:e2e:admin
```

## Flow coverage

| Flow | Scenario |
| --- | --- |
| 01 | Landing → sign-in screen |
| 02 | Sign-in success → home |
| 03 | Sign-in failure toast |
| 04 | Sign-up restricted screen (no public registration) |
| 05 | Member search + filter |
| 06 | Member profile |
| 07 | Log visit end-to-end |
| 08 | Complete a task |
| 09 | Reports summary loads |
| 10 | Sign out |
| 11 | Privacy policy |
| 12 | Reports fallback state |
| 13 | Admin center loads (admin login) |
| 14 | Admin members list |
| 15 | Admin reports screen |
| 16 | Shepherd cannot see Admin entry |

## Push permission flows

Maestro cannot reliably assert OS notification dialogs across all Android versions in CI. Validate push manually after
sign-in on a physical device, or extend flow `13-push-permission.yaml` once a dedicated test build disables auto-grant.

## Troubleshooting

- **Missing test IDs:** flows use `constants/testIds.ts` — keep IDs stable when changing UI.
- **Sign-in timeout:** disable email confirmation for the test user or confirm the account first.
- **Member flows fail:** seed a member whose `full_name` matches `E2E_MEMBER_NAME`.
