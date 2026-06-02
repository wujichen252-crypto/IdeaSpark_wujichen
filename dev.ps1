#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Start both frontend (Vite) and backend (Django) dev servers.
    Opens a terminal window for each — close them to stop.
#>

$Root = Split-Path -Parent $PSCommandPath

Write-Host "Starting IdeaSpark dev servers..." -ForegroundColor Cyan
Write-Host "  Backend  → http://localhost:8081" -ForegroundColor Green
Write-Host "  Frontend → http://localhost:5173" -ForegroundColor Green
Write-Host "  (close the server windows to stop)" -ForegroundColor Yellow

Start-Process powershell "-NoExit cd '$Root\backend'; uv run python manage.py runserver 8081"
Start-Process powershell "-NoExit cd '$Root\frontend'; npm run dev"
