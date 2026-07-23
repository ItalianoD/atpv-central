@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

if not exist "%~dp0scripts\start-local.ps1" (
  echo ERRO: os arquivos do ATPV Central não foram encontrados.
  echo.
  echo Descompacte todo o arquivo ZIP em uma pasta antes de executar INICIAR.bat.
  echo Não execute o programa diretamente de dentro do ZIP.
  echo.
  pause
  exit /b 1
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-local.ps1"
if errorlevel 1 (
  echo.
  echo A inicialização não foi concluída. A mensagem acima indica o que precisa ser corrigido.
  echo.
  pause
  exit /b 1
)
