# Deploy MyShepherdLine Cloudflare Worker with KV rate limiting.
# Run from repo root: npm run setup:worker
#
# Requires: wrangler logged in (npx wrangler whoami)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
$WranglerConfig = Join-Path $Root 'worker\wrangler.toml'
$EnvFile = Join-Path $Root '.env'

Set-Location $Root

Write-Host "`nMyShepherdLine Worker setup`n" -ForegroundColor Cyan

$whoami = npx.cmd wrangler whoami 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host "Wrangler is not logged in. Run: npx.cmd wrangler login" -ForegroundColor Red
  exit 1
}
Write-Host "Wrangler OK`n" -ForegroundColor Green

# Create KV namespaces if not already in wrangler.toml
$toml = Get-Content $WranglerConfig -Raw
if ($toml -notmatch 'binding = "RATE_LIMIT"') {
  Write-Host "Creating KV namespace RATE_LIMIT..." -ForegroundColor Yellow
  $prod = npx.cmd wrangler kv namespace create RATE_LIMIT --config worker/wrangler.toml 2>&1 | Out-String
  $preview = npx.cmd wrangler kv namespace create RATE_LIMIT --preview --config worker/wrangler.toml 2>&1 | Out-String

  $prodId = if ($prod -match 'id = "([^"]+)"') { $Matches[1] } else { $null }
  $previewId = if ($preview -match 'id = "([^"]+)"') { $Matches[1] } else { $null }

  if (-not $prodId -or -not $previewId) {
    Write-Host "Could not parse KV namespace IDs. Create manually in Cloudflare dashboard." -ForegroundColor Red
    Write-Host $prod
    Write-Host $preview
    exit 1
  }

  $kvBlock = @"

[[kv_namespaces]]
binding = "RATE_LIMIT"
id = "$prodId"
preview_id = "$previewId"
"@

  $toml = $toml -replace '# Optional production rate limiting[\s\S]*?# Set via wrangler secret put DIGEST_CRON_SECRET', ($kvBlock + "`n`n# Set via wrangler secret put DIGEST_CRON_SECRET")
  Set-Content -Path $WranglerConfig -Value $toml -NoNewline
  Write-Host "Updated worker/wrangler.toml with KV bindings" -ForegroundColor Green
} else {
  Write-Host "KV namespace already configured in wrangler.toml" -ForegroundColor Green
}

# Read Supabase URL from .env for convenience
$supabaseUrl = ''
if (Test-Path $EnvFile) {
  Get-Content $EnvFile | ForEach-Object {
    if ($_ -match '^EXPO_PUBLIC_SUPABASE_URL=(.+)$') { $supabaseUrl = $Matches[1].Trim() }
  }
}

Write-Host "`nSetting Worker secrets (you will be prompted if not already set)...`n" -ForegroundColor Yellow

if ($supabaseUrl) {
  Write-Host "Using Supabase URL from .env: $supabaseUrl"
  $supabaseUrl | npx.cmd wrangler secret put SUPABASE_URL --config worker/wrangler.toml
} else {
  npx.cmd wrangler secret put SUPABASE_URL --config worker/wrangler.toml
}

Write-Host "`nPaste your Supabase SERVICE ROLE key (Dashboard -> Settings -> API -> service_role):" -ForegroundColor Yellow
npx.cmd wrangler secret put SUPABASE_SERVICE_ROLE_KEY --config worker/wrangler.toml

Write-Host "`nChoose a random cron secret for digest triggers (save it for your scheduler):" -ForegroundColor Yellow
npx.cmd wrangler secret put DIGEST_CRON_SECRET --config worker/wrangler.toml

Write-Host "`nDeploying Worker..." -ForegroundColor Yellow
$deployOutput = npx.cmd wrangler deploy --config worker/wrangler.toml 2>&1 | Out-String
Write-Host $deployOutput

$workerUrl = $null
if ($deployOutput -match 'https://[\w.-]+\.workers\.dev') {
  $workerUrl = $Matches[0]
}

if ($workerUrl) {
  Write-Host "`nWorker deployed: $workerUrl" -ForegroundColor Green

  if (Test-Path $EnvFile) {
    $envContent = Get-Content $EnvFile -Raw
    if ($envContent -match 'EXPO_PUBLIC_WORKER_API_URL=') {
      $envContent = $envContent -replace 'EXPO_PUBLIC_WORKER_API_URL=.*', "EXPO_PUBLIC_WORKER_API_URL=$workerUrl"
    } else {
      $envContent += "`nEXPO_PUBLIC_WORKER_API_URL=$workerUrl`n"
    }
    Set-Content -Path $EnvFile -Value $envContent.TrimEnd() + "`n"
    Write-Host "Updated .env with EXPO_PUBLIC_WORKER_API_URL" -ForegroundColor Green
  }

  Write-Host "`nHealth check:" -ForegroundColor Cyan
  curl.exe -s "$workerUrl/health"
  Write-Host ""
} else {
  Write-Host "Deploy finished — check output above for your workers.dev URL." -ForegroundColor Yellow
}

Write-Host "`nDone. Run: npm run check:env`n" -ForegroundColor Cyan
