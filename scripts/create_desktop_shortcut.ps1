$ErrorActionPreference = "Stop"

$projectRoot = "D:\AIProjects\manga-auto-colorizer"
$releaseRoot = Join-Path $projectRoot "desktop\release"
$iconPath = Join-Path $projectRoot "desktop\build\icon.ico"
$desktopPath = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktopPath "Manga Auto Colorizer.lnk"

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

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $portableExe.FullName
$shortcut.WorkingDirectory = $projectRoot
if (Test-Path $iconPath) {
    $shortcut.IconLocation = "$iconPath,0"
}
$shortcut.Description = "Manga Auto Colorizer"
$shortcut.Save()

Write-Host "Shortcut created: $shortcutPath"
Write-Host "Target: $($portableExe.FullName)"
