$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $scriptRoot

& (Join-Path $scriptRoot "load-env-and-run.ps1") node (Join-Path $repoRoot "server\\vision-proxy.mjs")
