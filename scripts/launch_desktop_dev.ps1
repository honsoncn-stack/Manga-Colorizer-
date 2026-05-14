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
$env:npm_config_cache = "D:\DevTools\ElectronLibs\npm-cache"

New-Item -ItemType Directory -Path "D:\DevTools\ElectronLibs\npm-cache" -Force | Out-Null

conda activate D:\CondaEnvs\manga-color-v2
pip install fastapi uvicorn

Set-Location "D:\AIProjects\manga-auto-colorizer\desktop\frontend"
npm install

Set-Location "D:\AIProjects\manga-auto-colorizer\desktop"
npm install
npm run dev
