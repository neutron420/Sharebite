

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "X GitHub CLI (gh) not found! Please install it first." -ForegroundColor Red
    exit
}

if (-not (Test-Path ".env")) {
    Write-Host "X .env file not found!" -ForegroundColor Red
    exit
}

Write-Host "Syncing ShareBite secrets to GitHub..." -ForegroundColor Cyan

Get-Content .env | ForEach-Object {
    if ($_ -match "^(?<key>[A-Z0-9_]+)=(?<value>.*)$") {
        $key = $Matches.key
        $value = $Matches.value.Trim('"').Trim("'")
        
        Write-Host "-> Setting $key..." -ForegroundColor Gray
        $value | gh secret set $key
    }
}

Write-Host "✅ All secrets synced to GitHub Repo: neutron420/Sharebite" -ForegroundColor Green
