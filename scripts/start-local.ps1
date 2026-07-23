$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

function Write-Step([string]$Message) {
  Write-Host "[ATPV Central] $Message" -ForegroundColor Cyan
}

function Open-Portal {
  if ($env:ATPV_NO_BROWSER -eq "1") { return }

  $command = @'
for ($attempt = 0; $attempt -lt 30; $attempt++) {
  try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:3000" -UseBasicParsing -TimeoutSec 2
    if ($response.StatusCode -eq 200) {
      Start-Process "http://127.0.0.1:3000"
      break
    }
  } catch { }
  Start-Sleep -Seconds 1
}
'@

  Start-Process powershell.exe `
    -ArgumentList @("-NoProfile", "-WindowStyle", "Hidden", "-Command", $command) `
    -WindowStyle Hidden | Out-Null
}

try {
  $projectRoot = Split-Path -Parent $PSScriptRoot
  Set-Location -LiteralPath $projectRoot

  if (-not (Test-Path -LiteralPath (Join-Path $projectRoot "package.json"))) {
    throw "package.json não foi encontrado. Descompacte todo o ZIP antes de iniciar."
  }

  $codexNode = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
  $codexBin = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback"
  if (Test-Path -LiteralPath (Join-Path $codexNode "node.exe")) {
    $env:PATH = "$codexNode;$codexBin;$env:PATH"
  }

  $node = Get-Command node.exe -ErrorAction SilentlyContinue
  if (-not $node) {
    throw "Node.js não foi encontrado. Instale o Node.js 22 LTS em https://nodejs.org e execute novamente."
  }

  $nodeVersion = (& node.exe -p "process.versions.node").Trim()
  $nodeMajor = [int]($nodeVersion.Split('.')[0])
  if ($nodeMajor -lt 22) {
    throw "Node.js $nodeVersion encontrado, mas é necessário Node.js 22 ou superior."
  }
  Write-Step "Node.js $nodeVersion encontrado."

  $nextCommand = Join-Path $projectRoot "node_modules\.bin\next.cmd"
  if (-not (Test-Path -LiteralPath $nextCommand)) {
    Write-Step "Preparando os componentes. Na primeira execução isso pode levar alguns minutos..."

    $npm = Get-Command npm.cmd -ErrorAction SilentlyContinue
    $pnpm = Get-Command pnpm.cmd -ErrorAction SilentlyContinue

    if ($npm) {
      & $npm.Source install --ignore-scripts
    } elseif ($pnpm) {
      # O portal não usa módulos nativos de processamento de imagens.
      # Ignorar scripts opcionais evita prompts ou bloqueios na primeira instalação.
      & $pnpm.Source install --frozen-lockfile=false --ignore-scripts
    } else {
      throw "Nenhum instalador de componentes (npm ou pnpm) foi encontrado. Reinstale o Node.js 22 LTS."
    }

    if ($LASTEXITCODE -ne 0) {
      throw "A instalação dos componentes terminou com erro. Verifique sua conexão com a internet e tente novamente."
    }
  }

  try {
    $existing = Invoke-WebRequest -Uri "http://127.0.0.1:3000" -UseBasicParsing -TimeoutSec 2
    if ($existing.StatusCode -eq 200 -and $existing.Content -match "ATPV Central") {
      Write-Step "O portal já está em execução."
      if ($env:ATPV_NO_BROWSER -ne "1") { Start-Process "http://127.0.0.1:3000" }
      exit 0
    }
  } catch { }

  $portInUse = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
  if ($portInUse) {
    throw "A porta 3000 já está sendo usada por outro programa. Feche o programa e tente novamente."
  }

  $env:NEXT_TELEMETRY_DISABLED = "1"
  Write-Step "Portal disponível em http://127.0.0.1:3000"
  Write-Step "Mantenha esta janela aberta. Pressione Ctrl+C para encerrar."
  Open-Portal

  & $nextCommand dev -H 127.0.0.1 -p 3000
  if ($LASTEXITCODE -ne 0) {
    throw "O servidor encerrou com o código $LASTEXITCODE."
  }
} catch {
  Write-Host ""
  Write-Host "ERRO: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}
