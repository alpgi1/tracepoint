# Tracepoint one-shot start for Windows PowerShell (Docker Desktop required).
#   .\start.ps1              first start: PostgreSQL in Docker, dependencies, ingestion, findings, reports, tests
#   .\start.ps1 -Reset       rebuild the database from scratch
#   .\start.ps1 -WithLlm     additionally run a 50-verbatim classifier validation per vehicle (needs API key)
#   .\start.ps1 -SkipTests   skip the test suite
#   .\start.ps1 -Api         start the read API on http://localhost:8000/docs at the end
param([switch]$Reset, [switch]$WithLlm, [switch]$SkipTests, [switch]$Api)
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
$pgPort = if ($env:TRACEPOINT_PG_PORT) { $env:TRACEPOINT_PG_PORT } else { "5432" }
$env:TRACEPOINT_PG_PORT = $pgPort
function Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Blue }
function Ok($msg) { Write-Host "    ok: $msg" -ForegroundColor Green }
function Tp { param([Parameter(ValueFromRemainingArguments)]$args) Push-Location backend; try { & uv run --quiet tracepoint @args; if ($LASTEXITCODE -ne 0) { throw "tracepoint $args failed" } } finally { Pop-Location } }

Step "1/8 Prerequisites"
if (-not (Get-Command uv -ErrorAction SilentlyContinue)) {
  Write-Host "    installing uv ..."
  powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
  $env:Path = "$env:USERPROFILE\.local\bin;$env:Path"
}
if (-not (Get-Command uv -ErrorAction SilentlyContinue)) { throw "uv is not on PATH; open a new terminal" }
Ok "uv $(uv --version)"
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { throw "Docker Desktop is not installed" }
docker info *> $null; if ($LASTEXITCODE -ne 0) { throw "Docker daemon is not running; start Docker Desktop" }
Ok "docker available"

Step "2/8 PostgreSQL"
if ($Reset) { docker compose down -v *> $null }
docker compose up -d *> $null
$ready = $false
for ($i = 0; $i -lt 40; $i++) {
  docker compose exec -T postgres pg_isready -U tracepoint -d tracepoint *> $null
  if ($LASTEXITCODE -eq 0) { $ready = $true; break }
  Start-Sleep -Seconds 2
}
if (-not $ready) { throw "PostgreSQL did not become ready (docker compose logs postgres)" }
$hasTest = docker compose exec -T postgres psql -U tracepoint -d tracepoint -tAc "SELECT 1 FROM pg_database WHERE datname='tracepoint_test'"
if ("$hasTest".Trim() -ne "1") { docker compose exec -T postgres psql -U tracepoint -d tracepoint -c "CREATE DATABASE tracepoint_test OWNER tracepoint" *> $null }
Ok "PostgreSQL 16 running on port $pgPort"

Step "3/8 Configuration (.env)"
if (-not (Test-Path .env)) { Copy-Item .env.example .env; Ok "created .env (add TRACEPOINT_OPENAI_API_KEY for the LLM steps)" } else { Ok ".env exists" }
$dbUrl = "postgresql+psycopg://tracepoint:tracepoint@localhost:$pgPort/tracepoint"
$testUrl = "postgresql+psycopg://tracepoint:tracepoint@localhost:$pgPort/tracepoint_test"
$content = Get-Content .env
$content = $content | ForEach-Object { $_ -replace '^TRACEPOINT_DATABASE_URL=.*', "TRACEPOINT_DATABASE_URL=$dbUrl" -replace '^TRACEPOINT_TEST_DATABASE_URL=.*', "TRACEPOINT_TEST_DATABASE_URL=$testUrl" }
if (-not ($content -match '^TRACEPOINT_DATABASE_URL=')) { $content += "TRACEPOINT_DATABASE_URL=$dbUrl"; $content += "TRACEPOINT_TEST_DATABASE_URL=$testUrl" }
Set-Content .env $content
$env:TRACEPOINT_DATABASE_URL = $dbUrl; $env:TRACEPOINT_TEST_DATABASE_URL = $testUrl

Step "4/8 Backend dependencies"
Push-Location backend; uv sync --all-groups --quiet; Pop-Location
Ok "backend\.venv ready"

Step "5/8 Schema, taxonomy and ingestion"
if ($Reset) { Tp db reset --yes } else { Tp db init }
Tp taxonomy extract
Tp ingest all
Ok "internal files ingested"

Step "6/8 Findings and reports"
foreach ($s in @(@("G60","US"), @("F70","EU"), @("G70","US"), @("G60","EU"))) { Tp findings extract --vehicle $s[0] --market $s[1] }
Tp requirements import
New-Item -ItemType Directory -Force data\reports\baseline, data\reports\findings *> $null
foreach ($s in @(@("F70","EU"), @("G60","US"), @("G60","EU"), @("G70","US"))) { Tp report baseline --vehicle $s[0] --market $s[1] --out-dir (Resolve-Path data\reports\baseline) }
foreach ($s in @(@("G60","US"), @("F70","EU"))) { Tp findings report --vehicle $s[0] --market $s[1] --out-dir (Resolve-Path data\reports\findings) }
Tp agent packs
Tp requirements export
Ok "reports written"

Step "7/8 Tests"
if ($SkipTests) { Ok "skipped" } else { Push-Location backend; uv run --quiet pytest -q; if ($LASTEXITCODE -ne 0) { Pop-Location; throw "tests failed" }; Pop-Location }

Step "8/8 LLM steps"
if ($WithLlm) {
  $key = (Get-Content .env | Where-Object { $_ -match '^TRACEPOINT_OPENAI_API_KEY=' }) -replace '^TRACEPOINT_OPENAI_API_KEY=', ''
  if (-not $key) { throw "TRACEPOINT_OPENAI_API_KEY is empty in .env" }
  foreach ($v in @("F70","G60","G70")) {
    if (-not (Test-Path "config\validation\blind_sample_$v.yaml")) { Tp classify prepare-sample --vehicle $v }
    Tp classify validate --vehicle $v --limit 50
  }
  Ok "LLM validation finished (reports\validation)"
} else { Ok "skipped (use -WithLlm)" }

Step "Status"
Tp status
Write-Host "`nNext: cd backend; uv run uvicorn tracepoint.api.app:app --reload   # http://localhost:8000/docs"
if ($Api) { Push-Location backend; uv run uvicorn tracepoint.api.app:app --port 8000; Pop-Location }
