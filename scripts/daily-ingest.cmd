@echo off
REM ───────────────────────────────────────────────────────────────────────────
REM  ForjeGames nightly RAG ingest — runs unattended via Task Scheduler.
REM
REM  Path B: LOCAL embeddings (BGE via @huggingface/transformers). No quota
REM  limits. Can ingest 200+ videos per run.
REM
REM  Runs VERIFIED curated channels only (no CrashCourse geology, no Kevin
REM  Stratvert Excel). Channels are in scripts/curated-channels.ts.
REM
REM  Schedule: 1AM-10AM daily (single run, takes 1-3 hours depending on
REM  channel count × per-channel limit).
REM
REM  Logs: .transcripts\daily.log
REM ───────────────────────────────────────────────────────────────────────────

cd /d C:\dev\roblox-map-building

REM Load DATABASE_URL from .env.production.local
for /f "tokens=2 delims==" %%A in ('findstr /b "DATABASE_URL=" .env.production.local') do set DATABASE_URL=%%~A

if "%DATABASE_URL%"=="" (
  echo [%DATE% %TIME%] ERROR: DATABASE_URL not loaded >> .transcripts\daily.log
  exit /b 1
)

echo. >> .transcripts\daily.log
echo === Nightly ingest %DATE% %TIME% === >> .transcripts\daily.log

REM Ingest verified curated channels, 20 videos each = ~440 videos.
REM Local embedding = no rate limits. Takes ~1-2 hours on CPU.
call npx tsx scripts/ingest-curated.ts --per-channel=20 >> .transcripts\daily.log 2>&1

echo === Finished %DATE% %TIME% === >> .transcripts\daily.log
