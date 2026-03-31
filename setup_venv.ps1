$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $repoRoot

function Invoke-Step {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Command
    )

    Write-Host ">> $Command"
    Invoke-Expression $Command

    if ($LASTEXITCODE -ne 0) {
        throw ("Command failed with exit code {0}: {1}" -f $LASTEXITCODE, $Command)
    }
}

if (-not (Test-Path ".\.venv\Scripts\python.exe")) {
    Invoke-Step "python -m venv .venv --without-pip"
}

if (-not (Test-Path ".\.venv\Scripts\Activate.ps1")) {
    Invoke-Step "@'
import venv

builder = venv.EnvBuilder(with_pip=False)
context = builder.ensure_directories('.venv')
builder.setup_scripts(context)
'@ | python -"
}

Invoke-Step "python -m pip --python .\.venv install -r requirements.txt"

Write-Host ""
Write-Host "Virtual environment is ready."
Write-Host "Run the app with:"
Write-Host ".\\.venv\\Scripts\\Activate.ps1"
Write-Host "python .\\jukeboxd\\FrontEnd\\app.py"
