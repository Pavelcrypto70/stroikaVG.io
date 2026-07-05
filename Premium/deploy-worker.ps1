# Deploy Cloudflare Worker (one-time setup)
# 1. Create token: https://dash.cloudflare.com/profile/api-tokens
#    Template: "Edit Cloudflare Workers"
# 2. Run in PowerShell:
#    $env:CLOUDFLARE_API_TOKEN = "your_token_here"
#    .\deploy-worker.ps1
# 3. Copy the workers.dev URL into Premium/script.js -> FORM_API

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not $env:CLOUDFLARE_API_TOKEN) {
  Write-Host "Set CLOUDFLARE_API_TOKEN first." -ForegroundColor Red
  exit 1
}

npx --yes wrangler@3 deploy
npx --yes wrangler@3 secret bulk .dev.vars

Write-Host "Done. Update FORM_API in script.js with the URL shown above." -ForegroundColor Green
