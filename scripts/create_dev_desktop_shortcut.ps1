$ErrorActionPreference = "Stop"

$projectRoot = "D:\AIProjects\manga-auto-colorizer"
$launchScript = Join-Path $projectRoot "scripts\launch_desktop_dev.ps1"
$desktopPath = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktopPath "Manga Auto Colorizer.lnk"
$powershellPath = Join-Path $env:WINDIR "System32\WindowsPowerShell\v1.0\powershell.exe"
$iconCandidates = @(
    (Join-Path $projectRoot "assets\logo.ico"),
    (Join-Path $projectRoot "desktop\build\icon.ico")
)

if (-not (Test-Path -LiteralPath $launchScript)) {
    throw "Launch script not found: $launchScript"
}

$iconPath = ""
foreach ($candidate in $iconCandidates) {
    if (Test-Path -LiteralPath $candidate) {
        $iconPath = $candidate
        break
    }
}

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $powershellPath
$shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$launchScript`""
$shortcut.WorkingDirectory = $projectRoot
$shortcut.Description = "Manga Auto Colorizer development launcher"
if ($iconPath) {
    $shortcut.IconLocation = "$iconPath,0"
}
$shortcut.Save()

Write-Host "Shortcut created: $shortcutPath"
Write-Host "Target: $powershellPath $($shortcut.Arguments)"
if ($iconPath) {
    Write-Host "Icon: $iconPath"
} else {
    Write-Host "Icon: default PowerShell icon"
}
