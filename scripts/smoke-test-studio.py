#!/usr/bin/env python3
"""
ForjeGames Studio Plugin Smoke Test
=====================================
Runs 10 simulated Studio plugin connections through the full lifecycle.
Fast, safe to run against production, suitable for CI.

Exit code 0 = PASS, 1 = FAIL

Usage:
  python3 scripts/smoke-test-studio.py
  python3 scripts/smoke-test-studio.py --local
  python3 scripts/smoke-test-studio.py --target https://staging.forjegames.com
  python3 scripts/smoke-test-studio.py --connections 5
"""

from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
from threading import Lock

# ── Config ────────────────────────────────────────────────────────────────────
DEFAULT_TARGET      = "https://forjegames.com"
SMOKE_CONNECTIONS   = 10
SMOKE_POLL_ROUNDS   = 3    # only 3 sync polls per session (keeps it fast)
POLL_INTERVAL       = 1.5  # seconds between polls
TIMEOUT             = 12.0 # per-request timeout

FAKE_PLACE_IDS  = ["12345678", "87654321", "11223344", "44332211", "99887766"]
PLUGIN_VERSIONS = ["2.3.1", "2.3.0"]

# ── HTTP helpers ──────────────────────────────────────────────────────────────

def http_get(url: str) -> tuple[int, dict | None]:
    try:
        req = urllib.request.Request(url, headers={"Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            body = resp.read().decode("utf-8")
            return resp.status, json.loads(body) if body else {}
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8") if e.fp else ""
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, {"_raw": body[:200]}
    except Exception as ex:
        return 0, {"_error": str(ex)[:200]}


def http_post(url: str, data: dict) -> tuple[int, dict | None]:
    payload = json.dumps(data).encode("utf-8")
    try:
        req = urllib.request.Request(
            url, data=payload, method="POST",
            headers={"Content-Type": "application/json", "Accept": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            body = resp.read().decode("utf-8")
            return resp.status, json.loads(body) if body else {}
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8") if e.fp else ""
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, {"_raw": body[:200]}
    except Exception as ex:
        return 0, {"_error": str(ex)[:200]}


# ── Single connection ─────────────────────────────────────────────────────────

@dataclass
class Result:
    idx: int
    generate_ok: bool = False
    claim_ok:    bool = False
    connect_ok:  bool = False
    polls_ok:    int  = 0
    errors: list[str] = field(default_factory=list)

    @property
    def passed(self) -> bool:
        return self.generate_ok and self.claim_ok and self.connect_ok and self.polls_ok > 0


def run_one(idx: int, base_url: str) -> Result:
    import random
    r = Result(idx=idx)
    place_id   = FAKE_PLACE_IDS[idx % len(FAKE_PLACE_IDS)]
    plugin_ver = PLUGIN_VERSIONS[idx % len(PLUGIN_VERSIONS)]

    # Step 1: Generate code
    status, data = http_get(f"{base_url}/api/studio/auth?action=generate")
    if status != 200 or not data or "code" not in data:
        r.errors.append(f"generate failed (HTTP {status}): {data}")
        return r
    r.generate_ok = True
    code = data["code"]

    # Step 2: Claim code
    status, data = http_post(f"{base_url}/api/studio/auth", {
        "code":      code,
        "placeId":   place_id,
        "placeName": f"SmokeTestPlace_{idx}",
        "pluginVer": plugin_ver,
    })
    if status != 200 or not data or "token" not in data:
        r.errors.append(f"claim failed (HTTP {status}): {data}")
        return r
    r.claim_ok  = True
    token      = data["token"]
    session_id = data.get("sessionId", "")

    # Step 3: Connect
    status, data = http_post(f"{base_url}/api/studio/connect", {
        "token":         token,
        "placeId":       place_id,
        "placeName":     f"SmokeTestPlace_{idx}",
        "pluginVersion": plugin_ver,
    })
    if status != 200:
        r.errors.append(f"connect failed (HTTP {status}): {data}")
        return r
    r.connect_ok = True

    # Step 4: Poll sync a few times
    last_sync = int(time.time() * 1000)
    for _ in range(SMOKE_POLL_ROUNDS):
        url = (
            f"{base_url}/api/studio/sync"
            f"?sessionId={session_id}"
            f"&token={urllib.parse.quote(token)}"
            f"&pluginVer={plugin_ver}"
            f"&lastSync={last_sync}"
        )
        status, data = http_get(url)
        if status == 200 and data:
            last_sync = data.get("serverTime", last_sync)
            r.polls_ok += 1
        elif status == 429:
            # Rate limited — just count it and back off
            time.sleep(2.0)
        else:
            r.errors.append(f"sync failed (HTTP {status}): {data}")
        time.sleep(POLL_INTERVAL)

    return r


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="ForjeGames Studio Plugin Smoke Test (10 connections)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--target", "-t",
        default=DEFAULT_TARGET,
        help=f"Base URL (default: {DEFAULT_TARGET})",
    )
    parser.add_argument(
        "--local",
        action="store_true",
        help="Target localhost:3000",
    )
    parser.add_argument(
        "--connections", "-n",
        type=int,
        default=SMOKE_CONNECTIONS,
        help=f"Number of connections (default: {SMOKE_CONNECTIONS})",
    )
    args = parser.parse_args()

    if args.local:
        args.target = "http://localhost:3000"

    n = args.connections
    print(f"ForjeGames Studio Smoke Test  ({n} connections -> {args.target})")
    print("-" * 60)

    t_start = time.monotonic()
    results: list[Result] = []

    with ThreadPoolExecutor(max_workers=n) as pool:
        futs = {pool.submit(run_one, i, args.target): i for i in range(n)}
        for fut in as_completed(futs):
            try:
                results.append(fut.result())
            except Exception as exc:
                idx = futs[fut]
                r = Result(idx=idx)
                r.errors.append(f"exception: {exc}")
                results.append(r)

    elapsed = time.monotonic() - t_start
    results.sort(key=lambda r: r.idx)

    passed = sum(1 for r in results if r.passed)
    failed = n - passed

    print(f"\n{'#':>3}  gen  claim  conn  polls  status")
    print("-" * 46)
    for r in results:
        status = "PASS" if r.passed else "FAIL"
        gen  = "OK " if r.generate_ok else "ERR"
        clm  = "OK   " if r.claim_ok  else "ERR  "
        con  = "OK  " if r.connect_ok else "ERR "
        print(f"{r.idx:>3}  {gen}  {clm}  {con}  {r.polls_ok}/{SMOKE_POLL_ROUNDS}  {status}")
        for e in r.errors:
            print(f"     └ {e}")

    print()
    print(f"Elapsed:  {elapsed:.1f}s")
    print(f"Results:  {passed}/{n} passed")

    if failed == 0:
        print(f"\nPASS: All {n} smoke-test connections succeeded")
        sys.exit(0)
    else:
        print(f"\nFAIL: {failed}/{n} connections failed")
        sys.exit(1)


if __name__ == "__main__":
    main()
