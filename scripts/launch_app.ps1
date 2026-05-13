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
python -m streamlit run app\streamlit_app.py
