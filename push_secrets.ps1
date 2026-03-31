

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "X GitHub CLI (gh) not found! Please install it first." -ForegroundColor Red
    exit
}

$envFiles = @(".env", ".env.production")
$found = $false

foreach ($file in $envFiles) {
    if (Test-Path $file) {
        $found = $true
        Write-Host "🚀 Syncing secrets from $file..." -ForegroundColor Cyan
        Get-Content $file | ForEach-Object {
            if ($_ -match "^(?<key>[A-Z0-9_]+)=(?<value>.*)$") {
                $key = $Matches.key
                $value = $Matches.value.Trim('"').Trim("'")
                
                Write-Host "-> Setting $key..." -ForegroundColor Gray
                $value | gh secret set $key
            }
        }
    }
}

if (-not $found) {
    Write-Host "X No .env or .env.production files found!" -ForegroundColor Red
    exit
}

Write-Host "All secrets synced to GitHub Repo: neutron420/Sharebite" -ForegroundColor Green
