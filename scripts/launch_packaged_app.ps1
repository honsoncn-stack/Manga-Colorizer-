$ErrorActionPreference = "Stop"

$releaseRoot = "D:\AIProjects\manga-auto-colorizer\desktop\release"
if (-not (Test-Path $releaseRoot)) {
    Write-Host "Release directory not found. Run: powershell -ExecutionPolicy Bypass -File scripts\build_desktop_installer.ps1"
    exit 1
}

$portableExe = Get-ChildItem -Path $releaseRoot -Recurse -File -Filter "*.exe" | Where-Object {
    $_.Name -match "portable" -or ($_.Name -notmatch "Setup" -and $_.Name -notmatch "blockmap")
} | Select-Object -First 1

if (-not $portableExe) {
    Write-Host "Portable exe not found. Run: powershell -ExecutionPolicy Bypass -File scripts\build_desktop_installer.ps1"
    exit 1
}

Start-Process -FilePath $portableExe.FullName -WorkingDirectory "D:\AIProjects\manga-auto-colorizer"
