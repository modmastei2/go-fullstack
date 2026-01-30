# Install git hooks only (assumes gitleaks is already installed)

Write-Host "Installing git hooks..." -ForegroundColor Cyan

# ไปที่ root directory ของ project
$scriptPath = Split-Path -Parent $PSCommandPath
$projectRoot = Split-Path -Parent $scriptPath
Set-Location $projectRoot

# Check git repository
if (-not (Test-Path "$projectRoot\.git")) {
    Write-Host "[ERROR] Not a git repository" -ForegroundColor Red
    exit 1
}

# Check gitleaks
$gitleaksPath = Get-Command gitleaks -ErrorAction SilentlyContinue
if (-not $gitleaksPath) {
    Write-Host "[ERROR] Gitleaks not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "Install with: choco install gitleaks -y"
    Write-Host "Or run: .\scripts\setup-all.ps1"
    exit 1
}

# สร้าง pre-commit hook
$hookContent = @'
#!/bin/bash
# .git/hooks/pre-commit

if gitleaks git --staged --config=.gitleaks.toml >/dev/null 2>&1; then
    exit 0
else
    echo "Gitleaks found secrets! Click 'Open Git Log' to see details."
    exit 1
fi
'@

# เขียนไฟล์ hook (ใช้ LF line ending สำหรับ Git Bash)
$hookPath = Join-Path $projectRoot ".git\hooks\pre-commit"
$hookContent = $hookContent -replace "`r`n", "`n"
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($hookPath, $hookContent, $utf8NoBom)

Write-Host "[OK] Git hooks installed" -ForegroundColor Green
Write-Host ""
Write-Host "Gitleaks version: $(gitleaks version)"