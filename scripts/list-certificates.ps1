$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$certificates = Get-ChildItem -Path Cert:\CurrentUser\My |
  Where-Object {
    $_.HasPrivateKey -and
    $_.NotAfter -gt (Get-Date) -and
    ($_.Subject -match 'O=ICP-Brasil' -or $_.Issuer -match 'O=ICP-Brasil')
  } |
  Sort-Object -Property NotAfter -Descending |
  Select-Object Thumbprint, Subject, Issuer, FriendlyName, @{
    Name = "NotAfter"
    Expression = { $_.NotAfter.ToString("o") }
  }

@($certificates) | ConvertTo-Json -Compress
