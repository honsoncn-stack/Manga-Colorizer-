$ErrorActionPreference = "Stop"

Set-Location "D:\AIProjects\manga-auto-colorizer"

$env:PIP_CACHE_DIR = "D:\AICache\pip"
$env:HF_HOME = "D:\AICache\huggingface"
$env:HUGGINGFACE_HUB_CACHE = "D:\AICache\huggingface\hub"
$env:TRANSFORMERS_CACHE = "D:\AICache\huggingface\transformers"
$env:TORCH_HOME = "D:\AICache\torch"
$env:XDG_CACHE_HOME = "D:\AICache"
$env:TEMP = "D:\Temp"
$env:TMP = "D:\Temp"

conda activate D:\CondaEnvs\manga-color-v2

python scripts\generate_desktop_icon.py
pip install fastapi uvicorn pillow

Set-Location "D:\AIProjects\manga-auto-colorizer\desktop"
npm install

Set-Location "D:\AIProjects\manga-auto-colorizer\desktop\frontend"
npm install

Set-Location "D:\AIProjects\manga-auto-colorizer\desktop"
npm run build:frontend
npm run dist

Write-Host ""
Write-Host "Build output directory: D:\AIProjects\manga-auto-colorizer\desktop\release"
Get-ChildItem -Path "D:\AIProjects\manga-auto-colorizer\desktop\release" -Recurse -File | Where-Object { $_.Extension -eq ".exe" } | Select-Object FullName
