param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$Command
)

$repoRoot = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $repoRoot ".env"

if (Test-Path $envFile) {
  Get-Content $envFile | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith('#')) {
      return
    }

    $parts = $line -split '=', 2
    if ($parts.Length -eq 2) {
      $name = $parts[0].Trim()
      $value = $parts[1].Trim()
      [System.Environment]::SetEnvironmentVariable($name, $value, 'Process')
    }
  }
}

if (-not $Command -or $Command.Length -eq 0) {
  Write-Error "No command provided."
  exit 1
}

$exe = $Command[0]
$args = @()
if ($Command.Length -gt 1) {
  $args = $Command[1..($Command.Length - 1)]
}

& $exe @args
exit $LASTEXITCODE
