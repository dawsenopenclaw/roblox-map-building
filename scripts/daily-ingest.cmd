@echo off
REM ───────────────────────────────────────────────────────────────────────────
REM  ForjeGames daily RAG ingestion — runs unattended via Task Scheduler.
REM  Pulls top 8 discovered channels @ 10 videos each = ~80 videos/day,
REM  staying just under Gemini's 1000 RPD free-tier ceiling.
REM
REM  Schedule via PowerShell (one-time setup):
REM    schtasks /Create /TN "ForjeGames RAG Ingest" /TR "C:\dev\roblox-map-building\scripts\daily-ingest.cmd" /SC DAILY /ST 03:00 /F
REM
REM  Logs: C:\dev\roblox-map-building\.transcripts\daily.log
REM ───────────────────────────────────────────────────────────────────────────

cd /d C:\dev\roblox-map-building

REM Load DATABASE_URL from .env.production.local (strip quotes + leading var name)
for /f "tokens=2 delims==" %%A in ('findstr /b "DATABASE_URL=" .env.production.local') do set DATABASE_URL=%%~A

if "%DATABASE_URL%"=="" (
  echo [%DATE% %TIME%] ERROR: DATABASE_URL not loaded from .env.production.local >> .transcripts\daily.log
  exit /b 1
)

echo. >> .transcripts\daily.log
echo === Daily ingest %DATE% %TIME% === >> .transcripts\daily.log

REM 1. Refresh Roblox API dump (UPSERT, only 5-10 changed/day typically).
REM    Skip if quota tight — videos are higher signal.
REM call npx tsx scripts/ingest-roblox-api.ts >> .transcripts\daily.log 2>&1

REM 2. Ingest top 8 discovered channels, 10 videos each = ~80 videos = ~960 chunks.
REM    Stays under daily 1000 RPD cap with headroom for prod query traffic.
call npx tsx scripts/ingest-discovered.ts --top=8 --per=10 >> .transcripts\daily.log 2>&1

echo === Finished %DATE% %TIME% === >> .transcripts\daily.log
