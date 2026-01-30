# Complete setup script for Windows using Chocolatey

#Requires -RunAsAdministrator

Write-Host "Setting up Gitleaks for Go Fullstack Project..." -ForegroundColor Cyan

# Check Chocolatey
Write-Host ""
Write-Host "Step 1: Checking Chocolatey..." -ForegroundColor Blue
if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Host "Chocolatey not found. Installing..." -ForegroundColor Yellow
    
    # ติดตั้ง Chocolatey
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    
    # Refresh environment
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    
    Write-Host "[OK] Chocolatey installed" -ForegroundColor Green
} else {
    Write-Host "[OK] Chocolatey already installed" -ForegroundColor Green
}

# Install Gitleaks
Write-Host ""
Write-Host "Step 2: Installing Gitleaks..." -ForegroundColor Blue
if (-not (Get-Command gitleaks -ErrorAction SilentlyContinue)) {
    choco install gitleaks -y
    
    # Refresh environment
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    
    Write-Host "[OK] Gitleaks installed" -ForegroundColor Green
} else {
    Write-Host "[OK] Gitleaks already installed" -ForegroundColor Green
    choco upgrade gitleaks -y 2>$null
}

# Install Git Hooks
Write-Host ""
Write-Host "Step 3: Installing Git Hooks..." -ForegroundColor Blue

# ไปที่ root directory ของ project
$scriptPath = Split-Path -Parent $PSCommandPath
$projectRoot = Split-Path -Parent $scriptPath
Set-Location $projectRoot

if (-not (Test-Path "$projectRoot\.git")) {
    Write-Host "[ERROR] Not a git repository" -ForegroundColor Red
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
Write-Host "Setup completed successfully" -ForegroundColor Green
Write-Host ""
Write-Host "Gitleaks version: $(gitleaks version)"