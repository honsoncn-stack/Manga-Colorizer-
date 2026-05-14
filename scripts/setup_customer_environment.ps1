param(
    [string]$PackageRoot = $(
        $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
        if ((Split-Path -Leaf $scriptDir) -eq "scripts") {
            Split-Path -Parent $scriptDir
        } else {
            $scriptDir
        }
    ),
    [string]$ProjectRoot = "D:\AIProjects\manga-auto-colorizer",
    [string]$CondaEnvPath = "D:\CondaEnvs\manga-color-v2",
    [string]$InstallDir = "D:\Programs\Manga Auto Colorizer",
    [string]$CondaExe = "",
    [string]$CondaInstaller = "",
    [string]$ProjectSource = "",
    [string]$ProjectZip = "",
    [string]$AppSource = "",
    [string]$MangaColorizationSource = "",
    [string]$MangaColorizationZip = "",
    [string]$ProjectRepositoryUrl = "https://github.com/honsoncn-stack/Manga-Colorizer-.git",
    [string]$MangaColorizationRepositoryUrl = "https://github.com/qweasdd/manga-colorization-v2.git",
    [string]$MangaColorizationArchiveUrl = "https://github.com/qweasdd/manga-colorization-v2/archive/refs/heads/master.zip",
    [string]$WeightsSource = "",
    [string]$Wheelhouse = "",
    [string]$TorchIndexUrl = "",
    [switch]$SkipPythonPackages,
    [switch]$SkipAppInstall,
    [switch]$SkipWeightInstall
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Write-Ok {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Assert-DDrivePath {
    param([string]$PathValue, [string]$Label)
    $fullPath = [System.IO.Path]::GetFullPath($PathValue)
    if (-not $fullPath.StartsWith("D:\", [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "$Label must be on D: drive. Current value: $fullPath"
    }
}

function Ensure-Directory {
    param([string]$PathValue)
    New-Item -ItemType Directory -Path $PathValue -Force | Out-Null
}

function Test-NonEmpty {
    param([string]$Value)
    return -not [string]::IsNullOrWhiteSpace($Value)
}

function Find-FirstExistingPath {
    param([string[]]$Candidates)
    foreach ($candidate in $Candidates) {
        if ((Test-NonEmpty $candidate) -and (Test-Path -LiteralPath $candidate)) {
            return (Resolve-Path -LiteralPath $candidate).Path
        }
    }
    return ""
}

function Find-CommandPath {
    param([string]$CommandName)
    $command = Get-Command $CommandName -ErrorAction SilentlyContinue
    if ($null -eq $command) {
        return ""
    }
    return $command.Source
}

function Invoke-Checked {
    param(
        [string]$FilePath,
        [string[]]$Arguments,
        [string]$WorkingDirectory = $ProjectRoot
    )
    Write-Host "+ $FilePath $($Arguments -join ' ')" -ForegroundColor DarkGray
    $process = Start-Process -FilePath $FilePath -ArgumentList $Arguments -WorkingDirectory $WorkingDirectory -NoNewWindow -Wait -PassThru
    if ($process.ExitCode -ne 0) {
        throw "Command failed with exit code $($process.ExitCode): $FilePath"
    }
}

function Expand-SingleRootZip {
    param(
        [string]$ZipPath,
        [string]$TargetDir,
        [string]$ExpectedRelativePath
    )
    if (-not (Test-Path -LiteralPath $ZipPath)) {
        throw "Zip file not found: $ZipPath"
    }
    $tempRoot = Join-Path "D:\Temp" ("manga-auto-colorizer-setup-" + [System.Guid]::NewGuid().ToString("N"))
    Ensure-Directory $tempRoot
    Expand-Archive -LiteralPath $ZipPath -DestinationPath $tempRoot -Force

    $directExpected = Join-Path $tempRoot $ExpectedRelativePath
    if (Test-Path -LiteralPath $directExpected) {
        Copy-FolderContents -SourceDir $tempRoot -TargetDir $TargetDir
        return
    }

    $rootDirs = Get-ChildItem -LiteralPath $tempRoot -Directory
    foreach ($rootDir in $rootDirs) {
        if (Test-Path -LiteralPath (Join-Path $rootDir.FullName $ExpectedRelativePath)) {
            Copy-FolderContents -SourceDir $rootDir.FullName -TargetDir $TargetDir
            return
        }
    }

    throw "Zip extracted, but expected file was not found: $ExpectedRelativePath"
}

function Find-Conda {
    if (Test-NonEmpty $CondaExe) {
        if (Test-Path -LiteralPath $CondaExe) {
            return (Resolve-Path -LiteralPath $CondaExe).Path
        }
        throw "Specified CondaExe not found: $CondaExe"
    }

    $candidates = @(
        $env:CONDA_EXE,
        "D:\Miniconda3\Scripts\conda.exe",
        "D:\Anaconda3\Scripts\conda.exe",
        "C:\ProgramData\miniconda3\Scripts\conda.exe",
        "C:\ProgramData\anaconda3\Scripts\conda.exe",
        "$env:USERPROFILE\miniconda3\Scripts\conda.exe",
        "$env:USERPROFILE\anaconda3\Scripts\conda.exe"
    )
    return Find-FirstExistingPath $candidates
}

function Install-Conda-IfNeeded {
    $foundConda = Find-Conda
    if (Test-NonEmpty $foundConda) {
        Write-Ok "Found Conda: $foundConda"
        return $foundConda
    }

    if (-not (Test-NonEmpty $CondaInstaller)) {
        throw "Conda was not found. Install Miniconda/Anaconda first, or pass -CondaInstaller path\to\Miniconda3-latest-Windows-x86_64.exe."
    }
    if (-not (Test-Path -LiteralPath $CondaInstaller)) {
        throw "Conda installer not found: $CondaInstaller"
    }

    Write-Step "Installing Miniconda silently to D:\Miniconda3"
    Ensure-Directory "D:\Miniconda3"
    $installerArgs = @("/InstallationType=JustMe", "/RegisterPython=0", "/S", "/D=D:\Miniconda3")
    Invoke-Checked -FilePath $CondaInstaller -Arguments $installerArgs -WorkingDirectory $PackageRoot

    $foundConda = Find-Conda
    if (-not (Test-NonEmpty $foundConda)) {
        throw "Miniconda installation finished but conda.exe was not found."
    }
    Write-Ok "Conda installed: $foundConda"
    return $foundConda
}

function Copy-FolderContents {
    param([string]$SourceDir, [string]$TargetDir)
    if (-not (Test-Path -LiteralPath $SourceDir)) {
        throw "Source folder not found: $SourceDir"
    }
    Ensure-Directory $TargetDir
    Copy-Item -Path (Join-Path $SourceDir "*") -Destination $TargetDir -Recurse -Force
}

function Install-ProjectFiles {
    Write-Step "Preparing project files"
    Ensure-Directory (Split-Path -Parent $ProjectRoot)

    if (Test-Path -LiteralPath (Join-Path $ProjectRoot "desktop\backend\server.py")) {
        Write-Ok "Project already exists: $ProjectRoot"
        return
    }

    $projectZipPath = Find-FirstExistingPath @(
        $ProjectZip,
        (Join-Path $PackageRoot "manga-auto-colorizer-project.zip"),
        (Join-Path $PackageRoot "project.zip")
    )
    if (Test-NonEmpty $projectZipPath) {
        Expand-Archive -LiteralPath $projectZipPath -DestinationPath (Split-Path -Parent $ProjectRoot) -Force
        if (Test-Path -LiteralPath (Join-Path $ProjectRoot "desktop\backend\server.py")) {
            Write-Ok "Project extracted from zip: $projectZipPath"
            return
        }
        throw "Project zip extracted, but desktop\backend\server.py was not found under $ProjectRoot."
    }

    $projectSourcePath = Find-FirstExistingPath @(
        $ProjectSource,
        (Join-Path $PackageRoot "project"),
        (Join-Path $PackageRoot "manga-auto-colorizer")
    )
    if (Test-NonEmpty $projectSourcePath) {
        Copy-FolderContents -SourceDir $projectSourcePath -TargetDir $ProjectRoot
        Write-Ok "Project copied from: $projectSourcePath"
        return
    }

    $gitPath = Find-CommandPath "git"
    if ((Test-NonEmpty $gitPath) -and (Test-NonEmpty $ProjectRepositoryUrl)) {
        Invoke-Checked -FilePath $gitPath -Arguments @("clone", "--depth", "1", $ProjectRepositoryUrl, $ProjectRoot) -WorkingDirectory (Split-Path -Parent $ProjectRoot)
        if (Test-Path -LiteralPath (Join-Path $ProjectRoot "desktop\backend\server.py")) {
            Write-Ok "Project cloned from GitHub: $ProjectRepositoryUrl"
            return
        }
    }

    throw "Project files were not found. Provide -ProjectSource, -ProjectZip, or place project files in PackageRoot\project."
}

function Install-MangaColorizationRepo {
    Write-Step "Preparing manga-colorization-v2 repository"
    $repoDir = Join-Path $ProjectRoot "external\manga-colorization-v2"
    if (Test-Path -LiteralPath (Join-Path $repoDir "inference.py")) {
        Write-Ok "manga-colorization-v2 repo exists: $repoDir"
        return
    }

    Ensure-Directory (Split-Path -Parent $repoDir)
    $repoZipPath = Find-FirstExistingPath @(
        $MangaColorizationZip,
        (Join-Path $PackageRoot "manga-colorization-v2.zip")
    )
    if (Test-NonEmpty $repoZipPath) {
        Expand-Archive -LiteralPath $repoZipPath -DestinationPath (Split-Path -Parent $repoDir) -Force
        if (Test-Path -LiteralPath (Join-Path $repoDir "inference.py")) {
            Write-Ok "manga-colorization-v2 extracted from zip"
            return
        }
        throw "manga-colorization-v2 zip extracted, but inference.py was not found under $repoDir."
    }

    $repoSourcePath = Find-FirstExistingPath @(
        $MangaColorizationSource,
        (Join-Path $PackageRoot "manga-colorization-v2"),
        (Join-Path $PackageRoot "external\manga-colorization-v2")
    )
    if (Test-NonEmpty $repoSourcePath) {
        Copy-FolderContents -SourceDir $repoSourcePath -TargetDir $repoDir
        Write-Ok "manga-colorization-v2 copied from: $repoSourcePath"
        return
    }

    $gitPath = Find-CommandPath "git"
    if ((Test-NonEmpty $gitPath) -and (Test-NonEmpty $MangaColorizationRepositoryUrl)) {
        Invoke-Checked -FilePath $gitPath -Arguments @("clone", "--depth", "1", $MangaColorizationRepositoryUrl, $repoDir) -WorkingDirectory (Split-Path -Parent $repoDir)
        if (Test-Path -LiteralPath (Join-Path $repoDir "inference.py")) {
            Write-Ok "manga-colorization-v2 cloned from GitHub"
            return
        }
    }

    if (Test-NonEmpty $MangaColorizationArchiveUrl) {
        try {
            $archivePath = Join-Path "D:\AICache" "manga-colorization-v2-master.zip"
            Write-Warn "Git was not found. Downloading manga-colorization-v2 archive from GitHub."
            Invoke-WebRequest -Uri $MangaColorizationArchiveUrl -OutFile $archivePath
            Expand-SingleRootZip -ZipPath $archivePath -TargetDir $repoDir -ExpectedRelativePath "inference.py"
            if (Test-Path -LiteralPath (Join-Path $repoDir "inference.py")) {
                Write-Ok "manga-colorization-v2 downloaded from GitHub archive"
                return
            }
        } catch {
            Write-Warn "Could not download manga-colorization-v2 automatically: $($_.Exception.Message)"
        }
    }

    Write-Warn "manga-colorization-v2 was not found. The app can open, but colorization will not work until the repo is placed at $repoDir."
}

function Install-Weights {
    if ($SkipWeightInstall) {
        Write-Warn "Skipping model weight installation."
        return
    }

    Write-Step "Preparing model weights"
    $repoDir = Join-Path $ProjectRoot "external\manga-colorization-v2"
    $downloadsDir = Join-Path $ProjectRoot "models\downloads"
    $networksDir = Join-Path $repoDir "networks"
    $denoiserDir = Join-Path $repoDir "denoising\models"
    Ensure-Directory $downloadsDir
    Ensure-Directory $networksDir
    Ensure-Directory $denoiserDir

    $weightsDir = Find-FirstExistingPath @(
        $WeightsSource,
        (Join-Path $PackageRoot "weights"),
        (Join-Path $PackageRoot "models\downloads")
    )
    if (-not (Test-NonEmpty $weightsDir)) {
        Write-Warn "The public Release user kit should include PackageRoot\weights with generator.zip and denoiser.pth. Re-download the full user kit or provide -WeightsSource."
        return
    }

    $generatorZip = Find-FirstExistingPath @(
        (Join-Path $weightsDir "generator.zip")
    )
    $denoiserPth = Find-FirstExistingPath @(
        (Join-Path $weightsDir "denoiser.pth"),
        (Join-Path $weightsDir "net_rgb.pth")
    )

    if (Test-NonEmpty $generatorZip) {
        Copy-Item -LiteralPath $generatorZip -Destination (Join-Path $downloadsDir "generator.zip") -Force
        Copy-Item -LiteralPath $generatorZip -Destination (Join-Path $networksDir "generator.zip") -Force
        Expand-Archive -LiteralPath $generatorZip -DestinationPath $networksDir -Force
        Write-Ok "Generator weight installed."
    } else {
        Write-Warn "generator.zip was not found in $weightsDir."
    }

    if (Test-NonEmpty $denoiserPth) {
        Copy-Item -LiteralPath $denoiserPth -Destination (Join-Path $downloadsDir "denoiser.pth") -Force
        Copy-Item -LiteralPath $denoiserPth -Destination (Join-Path $denoiserDir "net_rgb.pth") -Force
        Write-Ok "Denoiser weight installed."
    } else {
        Write-Warn "denoiser.pth or net_rgb.pth was not found in $weightsDir."
    }
}

function Install-PythonEnvironment {
    Write-Step "Preparing Python environment"
    $condaPath = Install-Conda-IfNeeded
    $pythonExe = Join-Path $CondaEnvPath "python.exe"

    if (-not (Test-Path -LiteralPath $pythonExe)) {
        Invoke-Checked -FilePath $condaPath -Arguments @("create", "-y", "-p", $CondaEnvPath, "python=3.10") -WorkingDirectory $PackageRoot
    } else {
        Write-Ok "Conda env already exists: $CondaEnvPath"
    }

    if ($SkipPythonPackages) {
        Write-Warn "Skipping Python package installation."
        return
    }

    $pipArgsPrefix = @("-m", "pip", "install")
    if (Test-NonEmpty $Wheelhouse) {
        if (-not (Test-Path -LiteralPath $Wheelhouse)) {
            throw "Wheelhouse not found: $Wheelhouse"
        }
        $pipArgsPrefix += @("--no-index", "--find-links", $Wheelhouse)
    }

    Invoke-Checked -FilePath $pythonExe -Arguments @("-m", "pip", "install", "--upgrade", "pip") -WorkingDirectory $ProjectRoot

    $requirementsApp = Join-Path $ProjectRoot "requirements-app.txt"
    if (Test-Path -LiteralPath $requirementsApp) {
        Invoke-Checked -FilePath $pythonExe -Arguments ($pipArgsPrefix + @("-r", $requirementsApp)) -WorkingDirectory $ProjectRoot
    }

    $requiredPackages = @("fastapi", "uvicorn", "pymupdf", "pyyaml", "pillow", "opencv-python", "matplotlib")
    Invoke-Checked -FilePath $pythonExe -Arguments ($pipArgsPrefix + $requiredPackages) -WorkingDirectory $ProjectRoot

    $torchArgs = $pipArgsPrefix + @("torch", "torchvision")
    if ((-not (Test-NonEmpty $Wheelhouse)) -and (Test-NonEmpty $TorchIndexUrl)) {
        $torchArgs += @("--index-url", $TorchIndexUrl)
    }
    Invoke-Checked -FilePath $pythonExe -Arguments $torchArgs -WorkingDirectory $ProjectRoot
}

function Install-DesktopApp {
    if ($SkipAppInstall) {
        Write-Warn "Skipping desktop app installation."
        return
    }

    Write-Step "Installing desktop app to D: drive"
    $appSourcePath = Find-FirstExistingPath @(
        $AppSource,
        (Join-Path $PackageRoot "app\win-unpacked"),
        (Join-Path $PackageRoot "win-unpacked"),
        (Join-Path $ProjectRoot "desktop\release\win-unpacked")
    )
    if (-not (Test-NonEmpty $appSourcePath)) {
        Write-Warn "win-unpacked app folder was not found. If you downloaded the GitHub Release installer, run Manga Auto Colorizer Setup 1.0.0.exe after this script."
        return
    }

    Copy-FolderContents -SourceDir $appSourcePath -TargetDir $InstallDir
    $appExe = Join-Path $InstallDir "Manga Auto Colorizer.exe"
    if (-not (Test-Path -LiteralPath $appExe)) {
        throw "Installed app exe not found: $appExe"
    }

    $desktopShortcut = Join-Path ([Environment]::GetFolderPath("Desktop")) "Manga Auto Colorizer.lnk"
    $shell = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut($desktopShortcut)
    $shortcut.TargetPath = $appExe
    $shortcut.WorkingDirectory = $InstallDir
    $shortcut.IconLocation = $appExe
    $shortcut.Save()
    Write-Ok "Desktop shortcut created: $desktopShortcut"
}

function Validate-Setup {
    Write-Step "Validating installation"
    $pythonExe = Join-Path $CondaEnvPath "python.exe"
    $checks = @(
        (Join-Path $ProjectRoot "desktop\backend\server.py"),
        (Join-Path $ProjectRoot "scripts\library_manager.py"),
        (Join-Path $ProjectRoot "external\manga-colorization-v2\inference.py"),
        $pythonExe,
        (Join-Path $InstallDir "Manga Auto Colorizer.exe")
    )
    foreach ($check in $checks) {
        if (Test-Path -LiteralPath $check) {
            Write-Ok $check
        } else {
            Write-Warn "Missing: $check"
        }
    }

    $checkEnv = Join-Path $ProjectRoot "scripts\check_env.py"
    $doctor = Join-Path $ProjectRoot "scripts\doctor.py"
    if ((Test-Path -LiteralPath $pythonExe) -and (Test-Path -LiteralPath $checkEnv)) {
        Invoke-Checked -FilePath $pythonExe -Arguments @($checkEnv) -WorkingDirectory $ProjectRoot
    }
    if ((Test-Path -LiteralPath $pythonExe) -and (Test-Path -LiteralPath $doctor)) {
        Invoke-Checked -FilePath $pythonExe -Arguments @($doctor) -WorkingDirectory $ProjectRoot
    }
}

Write-Step "Manga Auto Colorizer customer environment setup"
$PackageRoot = [System.IO.Path]::GetFullPath($PackageRoot)
$ProjectRoot = [System.IO.Path]::GetFullPath($ProjectRoot)
$CondaEnvPath = [System.IO.Path]::GetFullPath($CondaEnvPath)
$InstallDir = [System.IO.Path]::GetFullPath($InstallDir)

Assert-DDrivePath $ProjectRoot "ProjectRoot"
Assert-DDrivePath $CondaEnvPath "CondaEnvPath"
Assert-DDrivePath $InstallDir "InstallDir"

Ensure-Directory "D:\Temp"
Ensure-Directory "D:\AICache\pip"
Ensure-Directory "D:\AICache\huggingface"
Ensure-Directory "D:\AICache\torch"
Ensure-Directory "D:\DevTools\ElectronLibs\npm-cache"

$env:PIP_CACHE_DIR = "D:\AICache\pip"
$env:HF_HOME = "D:\AICache\huggingface"
$env:HUGGINGFACE_HUB_CACHE = "D:\AICache\huggingface\hub"
$env:TRANSFORMERS_CACHE = "D:\AICache\huggingface\transformers"
$env:TORCH_HOME = "D:\AICache\torch"
$env:XDG_CACHE_HOME = "D:\AICache"
$env:TEMP = "D:\Temp"
$env:TMP = "D:\Temp"
$env:npm_config_cache = "D:\DevTools\ElectronLibs\npm-cache"

Install-ProjectFiles
Install-MangaColorizationRepo
Install-Weights
Install-PythonEnvironment
Install-DesktopApp
Validate-Setup

Write-Host ""
Write-Ok "Setup finished. Launch the app from the desktop shortcut: Manga Auto Colorizer"
