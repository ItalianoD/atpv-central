@echo off
setlocal
cd /d "%~dp0"

set "CODEX_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
set "CODEX_BIN=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback"
if exist "%CODEX_NODE%\node.exe" set "PATH=%CODEX_NODE%;%CODEX_BIN%;%PATH%"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js nao foi encontrado. Instale o Node.js 22 ou superior e tente novamente.
  pause
  exit /b 1
)

if not exist "node_modules\.bin\next.cmd" (
  echo Preparando o ATPV Central pela primeira vez...
  where pnpm >nul 2>nul
  if not errorlevel 1 (
    call pnpm install --frozen-lockfile=false
  ) else (
    call npm install
  )
  if errorlevel 1 (
    echo Nao foi possivel instalar os componentes do portal.
    pause
    exit /b 1
  )
)

start "" /b cmd /c "timeout /t 2 /nobreak >nul & start "" http://localhost:3000"
echo ATPV Central iniciado. Para encerrar, feche esta janela.
call node_modules\.bin\next.cmd dev -H 127.0.0.1
