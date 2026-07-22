param(
  [Parameter(Mandatory = $true)][string]$BaseUrl,
  [Parameter(Mandatory = $true)][string]$Endpoint,
  [Parameter(Mandatory = $true)][string]$Thumbprint
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

try {
  $renaveUri = [System.Uri]$BaseUrl
  $officialHosts = @(
    "renave.estaleiro.serpro.gov.br",
    "hom.renave.estaleiro.serpro.gov.br"
  )
  if ($renaveUri.Scheme -ne "https" -or $officialHosts -notcontains $renaveUri.Host) {
    throw "Por segurança, somente os endereços oficiais do RENAVE/SERPRO são permitidos."
  }
  if ($Endpoint -notmatch '^/api/pdf-atpv') { throw "Operação não permitida." }

  $certificatePath = "Cert:\CurrentUser\My\$Thumbprint"
  if (-not (Test-Path -LiteralPath $certificatePath)) { throw "Certificado não encontrado no Windows." }

  $certificate = Get-Item -LiteralPath $certificatePath
  if (-not $certificate.HasPrivateKey) { throw "O certificado selecionado não possui chave privada." }
  if ($certificate.NotAfter -le (Get-Date)) { throw "O certificado selecionado está vencido." }

  $response = Invoke-WebRequest `
    -Uri "$($renaveUri.AbsoluteUri.TrimEnd('/'))$Endpoint" `
    -Method Get `
    -Certificate $certificate `
    -Headers @{ Accept = "application/json;charset=UTF-8" } `
    -UseBasicParsing `
    -TimeoutSec 55

  [Console]::Out.Write($response.Content)
} catch {
  $content = $null
  if ($_.Exception.Response) {
    try {
      $stream = $_.Exception.Response.GetResponseStream()
      $reader = New-Object System.IO.StreamReader($stream)
      $content = $reader.ReadToEnd()
      $reader.Dispose()
    } catch { }
  }

  if ($content) {
    [Console]::Out.Write($content)
  } else {
    $message = @{ detalhe = $_.Exception.Message } | ConvertTo-Json -Compress
    [Console]::Error.Write($message)
  }
  exit 1
}
