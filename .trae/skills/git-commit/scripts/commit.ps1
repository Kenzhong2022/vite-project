# Usage: & commit.ps1 -Message "<commit message>" [-DryRun]
# Writes Message to a UTF-8 (no BOM) temp file, then runs `git commit -F`.
# This avoids PowerShell 5 limitations: no heredoc support, `&&` unsupported.
# NOTE: keep this file ASCII-only. PS 5.1 reads non-BOM files as ANSI (GBK on
# CN Windows), and multi-byte UTF-8 comments can swallow newlines and break parsing.
param(
  [Parameter(Mandatory = $true)][string]$Message,
  [switch]$DryRun # print the message file instead of committing
)

$ErrorActionPreference = 'Stop'
$msgFile = Join-Path $env:TEMP 'trae-commit-msg.txt'
# WriteAllText with UTF8Encoding($false) = UTF-8 WITHOUT BOM (BOM would corrupt the message)
[System.IO.File]::WriteAllText($msgFile, $Message, (New-Object System.Text.UTF8Encoding($false)))

if ($DryRun) {
  Write-Output "--- message written to $msgFile ---"
  Get-Content $msgFile
  Remove-Item $msgFile
  exit 0
}

git commit -F $msgFile
$code = $LASTEXITCODE
Remove-Item $msgFile
exit $code
