#!/usr/bin/env python3
"""
ForjeGames Studio Plugin Load Test
====================================
Simulates N concurrent Studio plugin connections through the full lifecycle:
  1. GET  /api/studio/auth?action=generate  → pending code
  2. POST /api/studio/auth                  → claim code → JWT + sessionId
  3. POST /api/studio/connect               → handshake
  4. GET  /api/studio/sync  (poll 2s × 15) → command delivery
  5. Queue 100 execute commands across random sessions during steady-state
  6. Verify command delivery on next sync poll

Usage:
  python3 scripts/load-test-studio.py
  python3 scripts/load-test-studio.py --connections 100
  python3 scripts/load-test-studio.py --connections 1000 --duration 60
  python3 scripts/load-test-studio.py --local
  python3 scripts/load-test-studio.py --dry-run
  python3 scripts/load-test-studio.py --target https://staging.forjegames.com
"""

from __future__ import annotations

import argparse
import json
import math
import os
import queue
import random
import statistics
import sys
import time
import traceback
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
from threading import Event, Lock
from typing import Optional

# ── Try aiohttp; fall back to urllib ─────────────────────────────────────────
try:
    import asyncio
    import aiohttp
    HAS_AIOHTTP = True
except ImportError:
    HAS_AIOHTTP = False

# ── Constants ─────────────────────────────────────────────────────────────────
DEFAULT_TARGET      = "https://forjegames.com"
DEFAULT_CONNECTIONS = 100
MAX_CONNECTIONS     = 1000
DEFAULT_DURATION    = 30      # seconds of polling per session
RAMP_WINDOW         = 60      # seconds to spread connection starts
POLL_INTERVAL       = 2.0     # seconds between sync polls
BACKOFF_BASE        = 2.0     # exponential backoff base on 429
MAX_RETRIES         = 3

FAKE_PLACE_IDS  = [str(1_000_000 + i * 7919) for i in range(100)]
PLUGIN_VERSIONS = ["2.1.0", "2.2.0", "2.3.0", "2.3.1"]

# ── Data structures ──────────────────────────────────────────────────────────

@dataclass
class Metrics:
    auth_generate_ok:  int = 0
    auth_generate_fail: int = 0
    auth_claim_ok:     int = 0
    auth_claim_fail:   int = 0
    connect_ok:        int = 0
    connect_fail:      int = 0
    sync_polls:        int = 0
    sync_fail:         int = 0
    rate_limited:      int = 0
    commands_queued:   int = 0
    commands_delivered: int = 0
    errors: dict[str, int] = field(default_factory=dict)
    latencies_ms: list[float] = field(default_factory=list)
    req_timestamps: list[float] = field(default_factory=list)  # epoch seconds

    _lock: Lock = field(default_factory=Lock, repr=False)

    def add_latency(self, ms: float) -> None:
        with self._lock:
            self.latencies_ms.append(ms)

    def record_request(self) -> None:
        with self._lock:
            self.req_timestamps.append(time.monotonic())

    def inc(self, attr: str, n: int = 1) -> None:
        with self._lock:
            setattr(self, attr, getattr(self, attr) + n)

    def add_error(self, kind: str) -> None:
        with self._lock:
            self.errors[kind] = self.errors.get(kind, 0) + 1

    def peak_rps(self) -> float:
        with self._lock:
            if len(self.req_timestamps) < 2:
                return 0.0
            # sliding 1-second window maximum
            best = 0
            ts = sorted(self.req_timestamps)
            lo = 0
            for hi in range(len(ts)):
                while ts[hi] - ts[lo] > 1.0:
                    lo += 1
                best = max(best, hi - lo + 1)
            return float(best)

    def percentile(self, p: float) -> float:
        with self._lock:
            if not self.latencies_ms:
                return 0.0
            s = sorted(self.latencies_ms)
            idx = int(math.ceil(p / 100.0 * len(s))) - 1
            return s[max(0, idx)]


@dataclass
class SessionState:
    idx: int
    token: str = ""
    session_id: str = ""
    place_id: str = ""
    plugin_ver: str = ""
    last_sync: int = 0
    alive: bool = False
    pending_commands: list[str] = field(default_factory=list)
    delivered_commands: list[str] = field(default_factory=list)


# ── HTTP helpers (urllib, stdlib only) ───────────────────────────────────────

def http_get(url: str, timeout: float = 10.0) -> tuple[int, dict | None]:
    """Returns (status_code, parsed_json_or_None)."""
    try:
        req = urllib.request.Request(url, headers={"Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = resp.read().decode("utf-8")
            return resp.status, json.loads(body) if body else None
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8") if e.fp else ""
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, {"_raw": body}
    except Exception as e:
        return 0, {"_error": str(e)}


def http_post(url: str, data: dict, timeout: float = 10.0) -> tuple[int, dict | None]:
    """Returns (status_code, parsed_json_or_None)."""
    payload = json.dumps(data).encode("utf-8")
    try:
        req = urllib.request.Request(
            url,
            data=payload,
            method="POST",
            headers={"Content-Type": "application/json", "Accept": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = resp.read().decode("utf-8")
            return resp.status, json.loads(body) if body else None
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8") if e.fp else ""
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, {"_raw": body}
    except Exception as e:
        return 0, {"_error": str(e)}


# ── Single plugin lifecycle ───────────────────────────────────────────────────

def run_plugin_lifecycle(
    idx: int,
    base_url: str,
    poll_duration: float,
    metrics: Metrics,
    active_sessions: list,
    sessions_lock: Lock,
    command_queue: "queue.Queue[tuple[str, str]]",  # (session_id, cmd_id)
    stop_event: Event,
) -> None:
    """Runs one simulated Studio plugin connection end-to-end."""
    sess = SessionState(
        idx=idx,
        place_id=random.choice(FAKE_PLACE_IDS),
        plugin_ver=random.choice(PLUGIN_VERSIONS),
    )

    # ── Step 1: Generate auth code ──────────────────────────────────────────
    t0 = time.monotonic()
    status, data = http_get(f"{base_url}/api/studio/auth?action=generate")
    metrics.add_latency((time.monotonic() - t0) * 1000)
    metrics.record_request()

    if status == 429:
        metrics.inc("rate_limited")
        metrics.inc("auth_generate_fail")
        return
    if status != 200 or not data or "code" not in data:
        metrics.inc("auth_generate_fail")
        metrics.add_error(f"generate_http_{status}")
        return
    metrics.inc("auth_generate_ok")
    code = data["code"]

    # ── Step 2: Claim code ──────────────────────────────────────────────────
    retries = 0
    while retries <= MAX_RETRIES:
        t0 = time.monotonic()
        status, data = http_post(
            f"{base_url}/api/studio/auth",
            {
                "code":      code,
                "placeId":   sess.place_id,
                "placeName": f"LoadTestPlace_{idx}",
                "pluginVer": sess.plugin_ver,
            },
        )
        latency = (time.monotonic() - t0) * 1000
        metrics.add_latency(latency)
        metrics.record_request()

        if status == 429:
            metrics.inc("rate_limited")
            backoff = BACKOFF_BASE ** retries
            time.sleep(min(backoff, 30.0))
            retries += 1
            continue
        break

    if status != 200 or not data or "token" not in data:
        metrics.inc("auth_claim_fail")
        metrics.add_error(f"claim_http_{status}")
        return
    metrics.inc("auth_claim_ok")
    sess.token      = data["token"]
    sess.session_id = data.get("sessionId", "")

    # ── Step 3: Connect handshake ───────────────────────────────────────────
    t0 = time.monotonic()
    status, data = http_post(
        f"{base_url}/api/studio/connect",
        {
            "token":         sess.token,
            "placeId":       sess.place_id,
            "placeName":     f"LoadTestPlace_{idx}",
            "pluginVersion": sess.plugin_ver,
        },
    )
    metrics.add_latency((time.monotonic() - t0) * 1000)
    metrics.record_request()

    if status == 429:
        metrics.inc("rate_limited")
        metrics.inc("connect_fail")
        return
    if status != 200:
        metrics.inc("connect_fail")
        metrics.add_error(f"connect_http_{status}")
        return
    metrics.inc("connect_ok")
    sess.alive      = True
    sess.last_sync  = int(time.time() * 1000)

    # Register session so the command-queue thread can target it
    with sessions_lock:
        active_sessions.append(sess)

    # ── Step 4: Sync polling ────────────────────────────────────────────────
    poll_end = time.monotonic() + poll_duration
    while time.monotonic() < poll_end and not stop_event.is_set():
        url = (
            f"{base_url}/api/studio/sync"
            f"?sessionId={sess.session_id}"
            f"&token={urllib.parse.quote(sess.token)}"
            f"&pluginVer={sess.plugin_ver}"
            f"&lastSync={sess.last_sync}"
        )

        t0 = time.monotonic()
        status, data = http_get(url)
        latency = (time.monotonic() - t0) * 1000
        metrics.add_latency(latency)
        metrics.record_request()

        if status == 429:
            metrics.inc("rate_limited")
            time.sleep(BACKOFF_BASE)
            continue
        if status != 200:
            metrics.inc("sync_fail")
            metrics.add_error(f"sync_http_{status}")
            # Short pause before retry
            time.sleep(POLL_INTERVAL)
            continue

        metrics.inc("sync_polls")

        if data:
            sess.last_sync = data.get("serverTime", int(time.time() * 1000))
            changes = data.get("changes", []) or []
            # Check if any of our pending commands were delivered
            for change in changes:
                cid = change.get("id") or change.get("commandId")
                if cid in sess.pending_commands:
                    sess.delivered_commands.append(cid)
                    metrics.inc("commands_delivered")

        time.sleep(POLL_INTERVAL)

    # Deregister session
    with sessions_lock:
        try:
            active_sessions.remove(sess)
        except ValueError:
            pass


def queue_commands(
    n: int,
    base_url: str,
    active_sessions: list,
    sessions_lock: Lock,
    metrics: Metrics,
    delay_before: float = 5.0,
) -> None:
    """
    After `delay_before` seconds, queue `n` execute commands spread across
    whichever sessions are alive at that moment.
    """
    time.sleep(delay_before)
    with sessions_lock:
        alive = [s for s in active_sessions if s.alive and s.session_id]

    if not alive:
        return

    for i in range(n):
        sess = alive[i % len(alive)]
        cmd_id = f"lt-cmd-{i:04d}"
        # POST to /api/studio/execute (best-effort — may not exist in all deploys)
        status, _ = http_post(
            f"{base_url}/api/studio/execute",
            {
                "sessionId": sess.session_id,
                "token":     sess.token,
                "id":        cmd_id,
                "type":      "ping",
                "payload":   {"source": "load-test", "seq": i},
            },
        )
        if status in (200, 201, 202):
            metrics.inc("commands_queued")
            sess.pending_commands.append(cmd_id)
        elif status == 429:
            metrics.inc("rate_limited")
        # Slight stagger to avoid burst
        time.sleep(0.05)


# ── urllib.parse is needed for quote ─────────────────────────────────────────
import urllib.parse


# ── Main orchestrator ─────────────────────────────────────────────────────────

def run_load_test(
    target: str,
    n_connections: int,
    duration: float,
    dry_run: bool,
) -> int:
    """Returns 0 on PASS, 1 on FAIL."""

    if dry_run:
        n_connections = 5
        duration = 10.0
        print("[dry-run] Using 5 connections, 10s duration\n")

    print("ForjeGames Studio Load Test")
    print("=" * 60)
    print(f"Target:      {target}")
    print(f"Connections: {n_connections}")
    print(f"Duration:    {duration}s polling per connection")
    print(f"Ramp window: {min(RAMP_WINDOW, n_connections * 0.06):.0f}s")
    print()

    metrics        = Metrics()
    active_sessions: list[SessionState] = []
    sessions_lock  = Lock()
    command_queue: "queue.Queue[tuple[str, str]]" = queue.Queue()
    stop_event     = Event()

    # Stagger connection starts across ramp window
    ramp_secs = min(RAMP_WINDOW, n_connections * 0.06)
    delay_per = ramp_secs / max(n_connections, 1)

    start_wall = time.monotonic()

    max_workers = min(n_connections + 10, 1024)

    with ThreadPoolExecutor(max_workers=max_workers) as pool:
        futures = []

        # Dispatch command queuer in background (starts after 5s)
        futures.append(
            pool.submit(
                queue_commands,
                100,
                target,
                active_sessions,
                sessions_lock,
                metrics,
                delay_before=max(5.0, ramp_secs / 2),
            )
        )

        # Ramp up connections
        for i in range(n_connections):
            sleep_until = start_wall + i * delay_per
            now = time.monotonic()
            if sleep_until > now:
                time.sleep(sleep_until - now)

            futures.append(
                pool.submit(
                    run_plugin_lifecycle,
                    i,
                    target,
                    duration,
                    metrics,
                    active_sessions,
                    sessions_lock,
                    command_queue,
                    stop_event,
                )
            )

        # Wait for all to finish
        for f in as_completed(futures):
            try:
                f.result()
            except Exception as exc:
                metrics.add_error(f"exception:{type(exc).__name__}")

    elapsed = time.monotonic() - start_wall

    # ── Results table ─────────────────────────────────────────────────────────
    total_auth    = metrics.auth_generate_ok + metrics.auth_generate_fail
    total_claim   = metrics.auth_claim_ok + metrics.auth_claim_fail
    total_connect = metrics.connect_ok + metrics.connect_fail
    total_sync    = metrics.sync_polls + metrics.sync_fail
    total_req     = (
        total_auth + total_claim + total_connect
        + total_sync + metrics.commands_queued
    )

    def pct(num: int, den: int) -> str:
        if den == 0:
            return "N/A"
        return f"{100 * num / den:.1f}%"

    p50  = metrics.percentile(50)
    p95  = metrics.percentile(95)
    p99  = metrics.percentile(99)
    prps = metrics.peak_rps()

    error_summary = ", ".join(
        f"{k}={v}" for k, v in sorted(metrics.errors.items())
    ) or "none"

    print()
    print("Results:")
    print(f"  Auth generate:    {metrics.auth_generate_ok}/{total_auth} ({pct(metrics.auth_generate_ok, total_auth)})")
    print(f"  Auth claim:       {metrics.auth_claim_ok}/{total_claim} ({pct(metrics.auth_claim_ok, total_claim)})")
    print(f"  Connect success:  {metrics.connect_ok}/{total_connect} ({pct(metrics.connect_ok, total_connect)})")
    print(f"  Sync polls:       {metrics.sync_polls:,} total ({metrics.sync_fail} failed)")
    print(f"  Sync latency:     p50={p50:.0f}ms  p95={p95:.0f}ms  p99={p99:.0f}ms")
    print(f"  Commands queued:  {metrics.commands_queued}")
    if metrics.commands_queued > 0:
        print(f"  Commands deliv:   {metrics.commands_delivered} ({pct(metrics.commands_delivered, metrics.commands_queued)})")
    print(f"  Rate limited:     {metrics.rate_limited}")
    print(f"  Errors:           {error_summary}")
    print(f"  Total requests:   {total_req:,} in {elapsed:.1f}s")
    print(f"  Peak RPS:         {prps:.0f} req/s")
    print()

    # ── Pass/fail criteria ────────────────────────────────────────────────────
    auth_rate    = metrics.auth_generate_ok / max(total_auth, 1)
    connect_rate = metrics.connect_ok / max(total_connect, 1)
    passed       = auth_rate >= 0.95 and connect_rate >= 0.95

    if passed:
        print(f"PASS: System handled {n_connections} concurrent connections")
    else:
        print(f"FAIL: Auth={auth_rate:.1%}  Connect={connect_rate:.1%}  (need ≥ 95% each)")

    return 0 if passed else 1


# ── CLI ───────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="ForjeGames Studio Plugin Load Test",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--connections", "-n",
        type=int,
        default=DEFAULT_CONNECTIONS,
        help=f"Number of simulated plugin connections (default: {DEFAULT_CONNECTIONS}, max: {MAX_CONNECTIONS})",
    )
    parser.add_argument(
        "--duration", "-d",
        type=float,
        default=DEFAULT_DURATION,
        help=f"Polling duration per session in seconds (default: {DEFAULT_DURATION})",
    )
    parser.add_argument(
        "--target", "-t",
        default=DEFAULT_TARGET,
        help=f"Base URL to test against (default: {DEFAULT_TARGET})",
    )
    parser.add_argument(
        "--local",
        action="store_true",
        help="Target localhost:3000 (overrides --target)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Run with 5 connections only — safe to use against production for smoke testing",
    )
    args = parser.parse_args()

    if args.local:
        args.target = "http://localhost:3000"

    n = min(args.connections, MAX_CONNECTIONS)
    if args.connections > MAX_CONNECTIONS:
        print(f"Warning: capping connections at {MAX_CONNECTIONS}")

    sys.exit(run_load_test(
        target=args.target,
        n_connections=n,
        duration=args.duration,
        dry_run=args.dry_run,
    ))


if __name__ == "__main__":
    main()
