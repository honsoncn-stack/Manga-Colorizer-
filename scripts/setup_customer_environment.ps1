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
    [ValidateSet("auto", "cpu", "cuda")]
    [string]$TorchVariant = "auto",
    [string]$CudaTorchIndexUrl = "https://download.pytorch.org/whl/cu128",
    [string]$CpuTorchIndexUrl = "https://download.pytorch.org/whl/cpu",
    [switch]$SkipPythonPackages,
    [switch]$SkipTorchInstall,
    [switch]$ForceTorchInstall,
    [switch]$SkipAppInstall,
    [switch]$SkipWeightInstall,
    [switch]$PlanOnly,
    [switch]$NonInteractive
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

$script:CorePythonDependencies = @(
    [pscustomobject]@{ Module = "streamlit"; Package = "streamlit" },
    [pscustomobject]@{ Module = "PIL"; Package = "pillow" },
    [pscustomobject]@{ Module = "yaml"; Package = "pyyaml" },
    [pscustomobject]@{ Module = "rich"; Package = "rich" },
    [pscustomobject]@{ Module = "fastapi"; Package = "fastapi" },
    [pscustomobject]@{ Module = "uvicorn"; Package = "uvicorn" },
    [pscustomobject]@{ Module = "fitz"; Package = "pymupdf" },
    [pscustomobject]@{ Module = "cv2"; Package = "opencv-python" },
    [pscustomobject]@{ Module = "matplotlib"; Package = "matplotlib" },
    [pscustomobject]@{ Module = "numpy"; Package = "numpy" },
    [pscustomobject]@{ Module = "skimage"; Package = "scikit-image" }
)

$script:TorchPythonDependencies = @(
    [pscustomobject]@{ Module = "torch"; Package = "torch" },
    [pscustomobject]@{ Module = "torchvision"; Package = "torchvision" }
)

function Assert-DDrivePath {
    param([string]$PathValue, [string]$Label)
    $fullPath = [System.IO.Path]::GetFullPath($PathValue)
    if (-not $fullPath.StartsWith("D:\", [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "$Label must be on D: drive. Current value: $fullPath"
    }
}

function Resolve-CondaEnvPathFromUserInput {
    param([string]$UserInput)
    $value = $UserInput.Trim().Trim('"')
    if (-not (Test-NonEmpty $value)) {
        return ""
    }

    $commandMatch = [regex]::Match($value, "-CondaEnvPath\s+(`"([^`"]+)`"|'([^']+)'|(\S+))")
    if ($commandMatch.Success) {
        $value = @(
            $commandMatch.Groups[2].Value,
            $commandMatch.Groups[3].Value,
            $commandMatch.Groups[4].Value
        ) | Where-Object { Test-NonEmpty $_ } | Select-Object -First 1
    }

    $value = $value.Trim().Trim('"').Trim("'")

    $fullPath = [System.IO.Path]::GetFullPath($value)
    if (Test-Path -LiteralPath $fullPath -PathType Leaf) {
        if ((Split-Path -Leaf $fullPath) -ieq "python.exe") {
            return (Split-Path -Parent $fullPath)
        }
        throw "Please provide a Conda environment directory or a python.exe path. Current input: $fullPath"
    }

    if (Test-Path -LiteralPath $fullPath -PathType Container) {
        $pythonInDir = Join-Path $fullPath "python.exe"
        if (Test-Path -LiteralPath $pythonInDir -PathType Leaf) {
            return $fullPath
        }
        throw "The folder exists but python.exe was not found in it: $fullPath"
    }

    throw "Path not found: $fullPath"
}

function Confirm-TargetCondaEnv {
    if ($NonInteractive) {
        return
    }

    Write-Step "Choosing Python/Torch environment"
    Write-Host "Default environment: $CondaEnvPath"
    Write-Host "If you already have a D: drive Conda/Python environment, choose it here."
    Write-Host "The script will check installed packages and only install missing pieces."
    Write-Host ""

    $candidates = @(Find-CandidatePythonEnvs)
    if ($candidates.Count -gt 0) {
        Write-Host "Detected environments:" -ForegroundColor Cyan
        for ($index = 0; $index -lt $candidates.Count; $index++) {
            $candidate = $candidates[$index]
            $status = Get-PythonEnvStatusText -EnvPath $candidate
            Write-Host ("  [{0}] {1}  -  {2}" -f ($index + 1), $candidate, $status)
        }
        Write-Host ""
        Write-Host "Type a number to reuse one of the environments above."
    }

    Write-Host "Or paste a D: drive environment folder / python.exe path."
    Write-Host "Example env folder: D:\CondaEnvs\my-env"
    Write-Host "Example python.exe: D:\CondaEnvs\my-env\python.exe"
    Write-Host "Press Enter to use or create the default environment."
    $userInput = Read-Host "Choose environment"

    $chosenEnv = ""
    if (-not (Test-NonEmpty $userInput)) {
        $chosenEnv = [System.IO.Path]::GetFullPath($CondaEnvPath)
    } elseif ($userInput.Trim() -match "^\d+$") {
        $choiceIndex = [int]$userInput.Trim() - 1
        if (($choiceIndex -lt 0) -or ($choiceIndex -ge $candidates.Count)) {
            throw "Invalid environment number: $userInput"
        }
        $chosenEnv = $candidates[$choiceIndex]
    } else {
        $chosenEnv = Resolve-CondaEnvPathFromUserInput $userInput
    }

    Assert-DDrivePath $chosenEnv "CondaEnvPath"
    $script:CondaEnvPath = $chosenEnv
    Write-Ok "Selected Conda/Python environment: $script:CondaEnvPath"

    $nvidiaDetected = Test-NvidiaGpuAvailable
    if ($nvidiaDetected) {
        Write-Ok "NVIDIA GPU detected by nvidia-smi. CUDA Torch is recommended for faster colorization."
    } else {
        Write-Warn "No NVIDIA GPU was detected by nvidia-smi. Version 1.0 only accelerates NVIDIA CUDA; AMD/Intel GPUs will use CPU mode unless you configure an experimental Torch backend yourself."
    }

    $pythonExe = Join-Path $script:CondaEnvPath "python.exe"
    if (-not (Test-Path -LiteralPath $pythonExe)) {
        Write-Warn "python.exe was not found in the selected environment. The script will create it if Conda is available."
        return
    }

    $coreModules = Get-DependencyModules $script:CorePythonDependencies
    $torchModules = Get-DependencyModules $script:TorchPythonDependencies
    $missingCore = @(Get-PythonMissingModules -PythonExe $pythonExe -Modules $coreModules)
    $missingTorch = @(Get-PythonMissingModules -PythonExe $pythonExe -Modules $torchModules)

    if ($missingCore.Count -eq 0) {
        Write-Ok "App Python dependencies are already available."
    } else {
        Write-Warn "Missing app Python modules: $($missingCore -join ', ')"
        if (-not $SkipPythonPackages) {
            $answer = Read-Host "Install these missing app packages into this environment? [Y/n]"
            if ((Test-NonEmpty $answer) -and $answer.Trim().ToLowerInvariant().StartsWith("n")) {
                $script:SkipPythonPackages = $true
                Write-Warn "Skipping app Python package installation by user choice."
            }
        }
    }

    if ($missingTorch.Count -eq 0) {
        $torchStatus = Get-PythonTorchStatus -PythonExe $pythonExe
        if ($torchStatus.CudaAvailable) {
            Write-Ok "Torch CUDA is available. Torch download will be skipped. Device: $($torchStatus.DeviceName)"
        } elseif ($nvidiaDetected -and (-not $SkipTorchInstall)) {
            Write-Warn "Torch and torchvision exist, but this environment is CPU-only. Colorization will be much slower."
            Write-Warn "Current Torch: $($torchStatus.TorchVersion), torch.version.cuda: $($torchStatus.TorchCudaVersion)"
            $answer = Read-Host "Reinstall Torch with CUDA build now? This can download 1GB+ data. [Y/n]"
            if ((Test-NonEmpty $answer) -and $answer.Trim().ToLowerInvariant().StartsWith("n")) {
                Write-Warn "Keeping CPU Torch by user choice."
            } else {
                $script:ForceTorchInstall = $true
                $script:TorchVariant = "cuda"
                Write-Warn "Torch will be reinstalled with CUDA support."
            }
        } else {
            Write-Warn "Torch and torchvision are available, but CUDA is not available. Torch download will be skipped."
        }
    } else {
        Write-Warn "Missing Torch modules: $($missingTorch -join ', ')"
        if (-not $SkipTorchInstall) {
            $defaultTorchChoice = if ($nvidiaDetected) { "G" } else { "C" }
            $answer = Read-Host "Install Torch for [G]PU CUDA / [C]PU only / [N]o? This can download 1GB+ data. Default: $defaultTorchChoice"
            if (-not (Test-NonEmpty $answer)) {
                $answer = $defaultTorchChoice
            }
            $normalizedAnswer = $answer.Trim().ToLowerInvariant()
            if ($normalizedAnswer.StartsWith("n")) {
                $script:SkipTorchInstall = $true
                Write-Warn "Skipping Torch installation by user choice. The app can open, but colorization may not work until Torch is installed."
            } elseif ($normalizedAnswer.StartsWith("g")) {
                $script:TorchVariant = "cuda"
                Write-Warn "Torch will be installed with CUDA support."
            } elseif ($normalizedAnswer.StartsWith("c")) {
                $script:TorchVariant = "cpu"
                Write-Warn "Torch will be installed as CPU-only."
            } else {
                throw "Invalid Torch choice: $answer. Please choose G, C, or N."
            }
        }
    }
}

function Show-EnvironmentPreflight {
    Write-Step "Environment preflight"
    Write-Host "This mode only checks your computer and prints a reuse plan. It will not install or download anything."
    Write-Host ""
    Write-Host "ProjectRoot: $ProjectRoot"
    Write-Host "Default CondaEnvPath: $CondaEnvPath"
    Write-Host "InstallDir: $InstallDir"
    Write-Host ""

    if (Test-NvidiaGpuAvailable) {
        Write-Ok "NVIDIA GPU detected by nvidia-smi. CUDA Torch is recommended."
    } else {
        Write-Warn "No NVIDIA GPU detected by nvidia-smi. Version 1.0 will use CPU mode on AMD/Intel/non-NVIDIA machines."
    }

    $candidates = @(Find-CandidatePythonEnvs)
    if ($candidates.Count -eq 0) {
        Write-Warn "No existing D: drive Conda/Python environment was found."
        Write-Host "Run the setup script without -PlanOnly and press Enter to create the default environment."
        return
    }

    Write-Host ""
    Write-Host "Detected reusable environments:" -ForegroundColor Cyan
    for ($index = 0; $index -lt $candidates.Count; $index++) {
        $candidate = $candidates[$index]
        $status = Get-PythonEnvStatusText -EnvPath $candidate
        Write-Host ("  [{0}] {1}  -  {2}" -f ($index + 1), $candidate, $status)
    }

    Write-Host ""
    Write-Host "Next step:"
    Write-Host "  1. Run the setup script again without -PlanOnly."
    Write-Host "  2. Type the number of the environment you want to reuse, or paste a python.exe path."
    Write-Host "  3. The script will ask before installing missing app packages or CUDA/CPU Torch."
}

function Confirm-InstallPlan {
    if ($NonInteractive) {
        return
    }

    Write-Step "Install plan review"
    Write-Host "Nothing below has been installed yet in this step. Review the plan before continuing."
    Write-Host ""
    Write-Host "ProjectRoot: $ProjectRoot"
    Write-Host "CondaEnvPath: $CondaEnvPath"
    Write-Host "InstallDir: $InstallDir"
    Write-Host ""

    $nvidiaDetected = Test-NvidiaGpuAvailable
    if ($nvidiaDetected) {
        Write-Ok "NVIDIA GPU detected. Preferred Torch target: CUDA"
    } else {
        Write-Warn "NVIDIA GPU not detected. Preferred Torch target: CPU. AMD/Intel GPU acceleration is not part of the 1.0 release script."
    }

    $pythonExe = Join-Path $CondaEnvPath "python.exe"
    if (Test-Path -LiteralPath $pythonExe -PathType Leaf) {
        Write-Host "Python environment: existing"
        $missingCore = @(Get-PythonMissingModules -PythonExe $pythonExe -Modules (Get-DependencyModules $script:CorePythonDependencies))
        $missingTorch = @(Get-PythonMissingModules -PythonExe $pythonExe -Modules (Get-DependencyModules $script:TorchPythonDependencies))
        $torchStatus = Get-PythonTorchStatus -PythonExe $pythonExe

        if ($SkipPythonPackages) {
            Write-Warn "App Python packages: skipped by user choice"
        } elseif ($missingCore.Count -eq 0) {
            Write-Ok "App Python packages: already available"
        } else {
            Write-Warn "App Python packages: will install missing modules: $($missingCore -join ', ')"
        }

        if ($SkipTorchInstall) {
            Write-Warn "Torch: skipped by user choice"
        } elseif ($ForceTorchInstall) {
            Write-Warn "Torch: will reinstall $TorchVariant build from $(Resolve-TorchInstallIndexUrl)"
        } elseif ($missingTorch.Count -gt 0) {
            Write-Warn "Torch: will install missing modules for $TorchVariant build from $(Resolve-TorchInstallIndexUrl): $($missingTorch -join ', ')"
        } elseif ($torchStatus.CudaAvailable) {
            Write-Ok "Torch: CUDA already available, download skipped. Device: $($torchStatus.DeviceName)"
        } else {
            Write-Warn "Torch: CPU-only already available, download skipped. Colorization will run on CPU unless CUDA Torch is installed."
        }
    } else {
        Write-Warn "Python environment: does not exist yet, will create it if Conda is available."
        if ($SkipPythonPackages) {
            Write-Warn "App Python packages: skipped by user choice"
        } else {
            Write-Warn "App Python packages: will install into the new environment"
        }
        if ($SkipTorchInstall) {
            Write-Warn "Torch: skipped by user choice"
        } else {
            Write-Warn "Torch: will install $TorchVariant build from $(Resolve-TorchInstallIndexUrl)"
        }
    }

    Write-Host ""
    if ($SkipWeightInstall) {
        Write-Warn "Model weights: skipped by user choice"
    } else {
        Write-Host "Model weights: install only if missing"
    }
    if ($SkipAppInstall) {
        Write-Warn "Desktop app: skipped by user choice"
    } else {
        Write-Host "Desktop app: install only if missing, then create/update shortcut"
    }

    Write-Host ""
    $answer = Read-Host "Continue with this plan? [Y/n]"
    if ((Test-NonEmpty $answer) -and $answer.Trim().ToLowerInvariant().StartsWith("n")) {
        throw "Setup stopped by user before installation."
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

function Test-ReadyFile {
    param([string]$PathValue, [long]$MinBytes = 1)
    if (-not (Test-NonEmpty $PathValue)) {
        return $false
    }
    if (-not (Test-Path -LiteralPath $PathValue -PathType Leaf)) {
        return $false
    }
    $item = Get-Item -LiteralPath $PathValue
    return ($item.Length -ge $MinBytes)
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

function Get-DependencyModules {
    param([object[]]$Dependencies)
    return @($Dependencies | ForEach-Object { $_.Module })
}

function Get-PackagesForMissingModules {
    param([object[]]$Dependencies, [string[]]$MissingModules)
    $missingSet = @{}
    foreach ($module in $MissingModules) {
        $missingSet[$module] = $true
    }

    $packages = @()
    foreach ($dependency in $Dependencies) {
        if ($missingSet.ContainsKey($dependency.Module)) {
            $packages += $dependency.Package
        }
    }
    return @($packages | Select-Object -Unique)
}

function Get-PythonMissingModules {
    param([string]$PythonExe, [string[]]$Modules)
    if (-not (Test-Path -LiteralPath $PythonExe)) {
        return @($Modules)
    }
    if ($Modules.Count -eq 0) {
        return @()
    }

    $moduleList = ($Modules | ForEach-Object { "'$($_.Replace("'", "\\'"))'" }) -join ", "
    $importCode = @"
import importlib.util
modules = [$moduleList]
missing = [name for name in modules if importlib.util.find_spec(name) is None]
for name in missing:
    print(name)
"@
    $output = & $PythonExe -c $importCode 2>$null
    if ($LASTEXITCODE -ne 0) {
        return @($Modules)
    }
    return @($output | Where-Object { Test-NonEmpty $_ })
}

function Test-PythonImports {
    param([string]$PythonExe, [string[]]$Modules)
    $missing = @(Get-PythonMissingModules -PythonExe $PythonExe -Modules $Modules)
    return ($missing.Count -eq 0)
}

function Test-NvidiaGpuAvailable {
    $nvidiaSmi = Find-CommandPath "nvidia-smi"
    if (-not (Test-NonEmpty $nvidiaSmi)) {
        return $false
    }

    $output = & $nvidiaSmi -L 2>$null
    return (($LASTEXITCODE -eq 0) -and ($null -ne $output) -and (($output | Measure-Object).Count -gt 0))
}

function Get-PythonTorchStatus {
    param([string]$PythonExe)
    $status = [ordered]@{
        HasTorch = $false
        HasTorchvision = $false
        CudaAvailable = $false
        TorchVersion = ""
        TorchvisionVersion = ""
        TorchCudaVersion = ""
        DeviceName = ""
    }
    if (-not (Test-Path -LiteralPath $PythonExe)) {
        return [pscustomobject]$status
    }

    $code = @"
try:
    import torch
    print('HasTorch=1')
    print('TorchVersion=' + str(getattr(torch, '__version__', '')))
    print('TorchCudaVersion=' + str(getattr(torch.version, 'cuda', '')))
    cuda_available = bool(torch.cuda.is_available())
    print('CudaAvailable=' + ('1' if cuda_available else '0'))
    if cuda_available:
        print('DeviceName=' + str(torch.cuda.get_device_name(0)))
except Exception as exc:
    print('HasTorch=0')
try:
    import torchvision
    print('HasTorchvision=1')
    print('TorchvisionVersion=' + str(getattr(torchvision, '__version__', '')))
except Exception:
    print('HasTorchvision=0')
"@
    $output = & $PythonExe -c $code 2>$null
    if ($LASTEXITCODE -ne 0) {
        return [pscustomobject]$status
    }

    foreach ($line in $output) {
        if (-not (Test-NonEmpty $line)) {
            continue
        }
        $parts = $line -split "=", 2
        if ($parts.Count -ne 2) {
            continue
        }
        $key = $parts[0]
        $value = $parts[1]
        switch ($key) {
            "HasTorch" { $status.HasTorch = ($value -eq "1") }
            "HasTorchvision" { $status.HasTorchvision = ($value -eq "1") }
            "CudaAvailable" { $status.CudaAvailable = ($value -eq "1") }
            "TorchVersion" { $status.TorchVersion = $value }
            "TorchvisionVersion" { $status.TorchvisionVersion = $value }
            "TorchCudaVersion" { $status.TorchCudaVersion = $value }
            "DeviceName" { $status.DeviceName = $value }
        }
    }
    return [pscustomobject]$status
}

function Resolve-TorchInstallIndexUrl {
    if (Test-NonEmpty $TorchIndexUrl) {
        return $TorchIndexUrl
    }
    if (Test-NonEmpty $Wheelhouse) {
        return ""
    }

    $variant = $TorchVariant.ToLowerInvariant()
    if ($variant -eq "auto") {
        if (Test-NvidiaGpuAvailable) {
            $variant = "cuda"
        } else {
            $variant = "cpu"
        }
    }

    if ($variant -eq "cuda") {
        return $CudaTorchIndexUrl
    }
    return $CpuTorchIndexUrl
}

function Find-CandidatePythonEnvs {
    $candidates = @(
        $CondaEnvPath,
        $env:CONDA_PREFIX,
        "D:\CondaEnvs\manga-color-v2"
    )

    foreach ($envRoot in @("D:\CondaEnvs", "D:\Miniconda3\envs", "D:\Anaconda3\envs")) {
        if (Test-Path -LiteralPath $envRoot -PathType Container) {
            $candidates += @(Get-ChildItem -LiteralPath $envRoot -Directory -ErrorAction SilentlyContinue | ForEach-Object { $_.FullName })
        }
    }

    $valid = @()
    foreach ($candidate in $candidates) {
        if (-not (Test-NonEmpty $candidate)) {
            continue
        }
        $fullPath = [System.IO.Path]::GetFullPath($candidate)
        $pythonExe = Join-Path $fullPath "python.exe"
        if (Test-Path -LiteralPath $pythonExe -PathType Leaf) {
            $valid += $fullPath
        }
    }
    return @($valid | Select-Object -Unique)
}

function Get-PythonEnvStatusText {
    param([string]$EnvPath)
    $pythonExe = Join-Path $EnvPath "python.exe"
    $missingCore = @(Get-PythonMissingModules -PythonExe $pythonExe -Modules (Get-DependencyModules $script:CorePythonDependencies))
    $missingTorch = @(Get-PythonMissingModules -PythonExe $pythonExe -Modules (Get-DependencyModules $script:TorchPythonDependencies))
    $torchStatus = Get-PythonTorchStatus -PythonExe $pythonExe
    $torchText = if ($missingTorch.Count -gt 0) {
        "missing Torch: $($missingTorch -join ', ')"
    } elseif ($torchStatus.CudaAvailable) {
        "Torch CUDA ready: $($torchStatus.DeviceName)"
    } else {
        "Torch CPU only"
    }

    if (($missingCore.Count -eq 0) -and ($missingTorch.Count -eq 0)) {
        return "ready: app deps + $torchText"
    }
    if (($missingCore.Count -eq 0) -and ($missingTorch.Count -gt 0)) {
        return "app deps ready; $torchText"
    }
    if (($missingCore.Count -gt 0) -and ($missingTorch.Count -eq 0)) {
        return "$torchText; missing app deps: $($missingCore -join ', ')"
    }
    return "missing app deps: $($missingCore -join ', '); missing Torch: $($missingTorch -join ', ')"
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
        $localInstallers = @(
            (Join-Path $PackageRoot "Miniconda3-latest-Windows-x86_64.exe"),
            (Join-Path $PackageRoot "miniconda.exe"),
            (Join-Path $PackageRoot "tools\Miniconda3-latest-Windows-x86_64.exe")
        )
        $CondaInstaller = Find-FirstExistingPath $localInstallers
        if (-not (Test-NonEmpty $CondaInstaller)) {
            $localInstallerMatches = @(Get-ChildItem -LiteralPath $PackageRoot -Filter "Miniconda3*Windows*x86_64*.exe" -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending)
            if ($localInstallerMatches.Count -gt 0) {
                $CondaInstaller = $localInstallerMatches[0].FullName
            }
        }
    }

    if (-not (Test-NonEmpty $CondaInstaller)) {
        throw @"
Conda was not found.

For first-time users:
1. Download Miniconda3-latest-Windows-x86_64.exe from https://docs.conda.io/en/latest/miniconda.html
2. Put it next to this script in $PackageRoot
3. Run this setup script again.

Advanced users can also pass:
powershell -ExecutionPolicy Bypass -File .\setup_customer_environment.ps1 -CondaInstaller D:\path\to\Miniconda3-latest-Windows-x86_64.exe
"@
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

    $generatorTarget = Join-Path $networksDir "generator.zip"
    $denoiserTarget = Join-Path $denoiserDir "net_rgb.pth"
    $generatorInstalled = Test-ReadyFile $generatorTarget 1048576
    $denoiserInstalled = Test-ReadyFile $denoiserTarget 1048576

    if ($generatorInstalled -and $denoiserInstalled) {
        Write-Ok "Model weights already exist. Skipping weight copy."
        return
    }

    $weightsDir = Find-FirstExistingPath @(
        $WeightsSource,
        (Join-Path $PackageRoot "weights"),
        (Join-Path $PackageRoot "models\downloads")
    )
    if (-not (Test-NonEmpty $weightsDir)) {
        if (-not $generatorInstalled) {
            Write-Warn "Missing generator.zip. Provide PackageRoot\weights\generator.zip or pass -WeightsSource."
        }
        if (-not $denoiserInstalled) {
            Write-Warn "Missing denoiser.pth. Provide PackageRoot\weights\denoiser.pth or pass -WeightsSource."
        }
        return
    }

    $generatorZip = Find-FirstExistingPath @(
        (Join-Path $weightsDir "generator.zip")
    )
    $denoiserPth = Find-FirstExistingPath @(
        (Join-Path $weightsDir "denoiser.pth"),
        (Join-Path $weightsDir "net_rgb.pth")
    )

    if ($generatorInstalled) {
        Write-Ok "Generator weight already exists. Skipping: $generatorTarget"
    } elseif (Test-NonEmpty $generatorZip) {
        Copy-Item -LiteralPath $generatorZip -Destination (Join-Path $downloadsDir "generator.zip") -Force
        Copy-Item -LiteralPath $generatorZip -Destination $generatorTarget -Force
        Expand-Archive -LiteralPath $generatorZip -DestinationPath $networksDir -Force
        Write-Ok "Generator weight installed."
    } else {
        Write-Warn "generator.zip was not found in $weightsDir."
    }

    if ($denoiserInstalled) {
        Write-Ok "Denoiser weight already exists. Skipping: $denoiserTarget"
    } elseif (Test-NonEmpty $denoiserPth) {
        Copy-Item -LiteralPath $denoiserPth -Destination (Join-Path $downloadsDir "denoiser.pth") -Force
        Copy-Item -LiteralPath $denoiserPth -Destination $denoiserTarget -Force
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

    try {
        Invoke-Checked -FilePath $pythonExe -Arguments @("-m", "pip", "--version") -WorkingDirectory $ProjectRoot
    } catch {
        Write-Warn "pip was not available in the Conda environment. Running ensurepip."
        Invoke-Checked -FilePath $pythonExe -Arguments @("-m", "ensurepip", "--upgrade") -WorkingDirectory $ProjectRoot
    }

    $coreModules = Get-DependencyModules $script:CorePythonDependencies
    $missingCore = @(Get-PythonMissingModules -PythonExe $pythonExe -Modules $coreModules)
    if ($missingCore.Count -eq 0) {
        Write-Ok "App Python dependencies already available. Skipping app package install."
    } else {
        $packagesToInstall = @(Get-PackagesForMissingModules -Dependencies $script:CorePythonDependencies -MissingModules $missingCore)
        Write-Warn "Installing missing app packages: $($packagesToInstall -join ', ')"
        Invoke-Checked -FilePath $pythonExe -Arguments ($pipArgsPrefix + $packagesToInstall) -WorkingDirectory $ProjectRoot
    }

    $torchModules = Get-DependencyModules $script:TorchPythonDependencies
    $missingTorch = @(Get-PythonMissingModules -PythonExe $pythonExe -Modules $torchModules)
    if (($missingTorch.Count -eq 0) -and (-not $ForceTorchInstall)) {
        $torchStatus = Get-PythonTorchStatus -PythonExe $pythonExe
        if ($torchStatus.CudaAvailable) {
            Write-Ok "Torch and torchvision already available with CUDA. Skipping Torch install. Device: $($torchStatus.DeviceName)"
        } else {
            Write-Ok "Torch and torchvision already available as CPU-only. Skipping Torch install."
        }
    } elseif ($SkipTorchInstall) {
        Write-Warn "Skipping Torch installation. Missing modules: $($missingTorch -join ', ')"
    } else {
        $torchPackagesToInstall = if ($missingTorch.Count -eq 0) {
            @($script:TorchPythonDependencies | ForEach-Object { $_.Package })
        } else {
            @(Get-PackagesForMissingModules -Dependencies $script:TorchPythonDependencies -MissingModules $missingTorch)
        }
        Write-Warn "Installing missing Torch packages: $($torchPackagesToInstall -join ', ')"
        $torchArgs = $pipArgsPrefix
        if ($ForceTorchInstall) {
            $torchArgs += @("--upgrade", "--force-reinstall")
        }
        $torchArgs += $torchPackagesToInstall
        $resolvedTorchIndexUrl = Resolve-TorchInstallIndexUrl
        if ((-not (Test-NonEmpty $Wheelhouse)) -and (Test-NonEmpty $resolvedTorchIndexUrl)) {
            Write-Warn "Torch install index: $resolvedTorchIndexUrl"
            $torchArgs += @("--index-url", $resolvedTorchIndexUrl)
        }
        Invoke-Checked -FilePath $pythonExe -Arguments $torchArgs -WorkingDirectory $ProjectRoot
    }
}

function New-DesktopShortcutForApp {
    param([string]$AppExe, [string]$WorkingDir)
    $desktopShortcut = Join-Path ([Environment]::GetFolderPath("Desktop")) "Manga Auto Colorizer.lnk"
    $shell = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut($desktopShortcut)
    $shortcut.TargetPath = $AppExe
    $shortcut.WorkingDirectory = $WorkingDir
    $shortcut.IconLocation = $AppExe
    $shortcut.Save()
    Write-Ok "Desktop shortcut ready: $desktopShortcut"
}

function Install-DesktopApp {
    if ($SkipAppInstall) {
        Write-Warn "Skipping desktop app installation."
        return
    }

    Write-Step "Installing desktop app to D: drive"
    $appExe = Join-Path $InstallDir "Manga Auto Colorizer.exe"
    if (Test-ReadyFile $appExe 1024) {
        Write-Ok "Desktop app already exists. Skipping app copy: $appExe"
        New-DesktopShortcutForApp -AppExe $appExe -WorkingDir $InstallDir
        return
    }

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
    if (-not (Test-Path -LiteralPath $appExe)) {
        throw "Installed app exe not found: $appExe"
    }

    New-DesktopShortcutForApp -AppExe $appExe -WorkingDir $InstallDir
}

function Ensure-ProjectRuntimeDirectories {
    Write-Step "Preparing runtime directories"
    $runtimeDirs = @(
        (Join-Path $ProjectRoot "input"),
        (Join-Path $ProjectRoot "input\pages_bw"),
        (Join-Path $ProjectRoot "input\pdf"),
        (Join-Path $ProjectRoot "input\cbz"),
        (Join-Path $ProjectRoot "output"),
        (Join-Path $ProjectRoot "logs"),
        (Join-Path $ProjectRoot "reports"),
        (Join-Path $ProjectRoot "library"),
        (Join-Path $ProjectRoot "library\books")
    )
    foreach ($dir in $runtimeDirs) {
        Ensure-Directory $dir
        Write-Ok "Runtime directory ready: $dir"
    }
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

if ($PlanOnly) {
    Show-EnvironmentPreflight
    return
}

Confirm-TargetCondaEnv
Confirm-InstallPlan

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
Ensure-ProjectRuntimeDirectories
Install-MangaColorizationRepo
Install-Weights
Install-PythonEnvironment
Install-DesktopApp
Validate-Setup

Write-Host ""
Write-Ok "Setup finished. Launch the app from the desktop shortcut: Manga Auto Colorizer"
