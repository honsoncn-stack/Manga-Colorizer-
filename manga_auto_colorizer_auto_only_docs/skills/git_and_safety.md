# Skill: Git and Safety

## Do Not Commit
```text
input/
output/
models/
logs/
reports/
*.pth
*.pt
*.ckpt
*.safetensors
*.onnx
*.pkl
```

## Commit
```text
README.md
AGENTS.md
configs/
app/
scripts/
docs/
skills/
requirements*.txt
.gitignore
```

## Commands
```powershell
git status
git add README.md AGENTS.md configs app scripts docs skills requirements-automation.txt requirements-app.txt .gitignore
git commit -m "message"
```

## Content Safety
Only process original, authorized, public-domain, or internal test materials.
