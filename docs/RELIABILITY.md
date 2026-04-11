# ForjeGames Reliability & Observability Reference

This document describes the reliability primitives in `src/lib/reliability`,
`src/lib/observability`, `src/lib/cache`, and `src/lib/health`. All of these
modules are **additive** — existing call sites are expected to migrate to them
gradually.

## Goals

1. **Fail fast** on outbound dependencies that are clearly down (circuit breaker).
2. **Retry intelligently** for transient failures (retry + timeout helpers).
3. **Absorb bursts** without melting upstream providers (token-bucket limiter).
4. **See everything** — metrics, structured logs, slow queries.
5. **Self-report** health via a uniform probe.

---

## 1. Circuit breaker — `src/lib/reliability/circuit-breaker.ts`

Generic per-service breaker. State is held in Redis with an in-process cache
so multiple Vercel functions observe the same breaker.

### State diagram

```
                  failures >= threshold
          +-------------------------------+
          |                               v
        +-+------+    recovery elapsed    +------+
   --->>| closed |<-----------------------| open |
        +--+-----+                        +--+---+
           ^                                 |
           | half-open probe(s) succeed      | first request after recovery
           |                                 v
           |                           +-----------+
           +---------------------------| half-open |
                 half-open probe fails +-----------+
```

- **closed**: failures tracked in a rolling window; threshold trips to open.
- **open**: all calls fail fast with `CircuitOpenError` for `recoveryMs`.
- **half-open**: a limited number of probe requests; success closes, failure re-opens.

### Usage

```ts
import { breakers } from '@/lib/reliability/circuit-breaker'

const result = await breakers.anthropic().execute(async () => {
  return anthropic.messages.create({ /* ... */ })
})
```

Pre-tuned breakers exist for `anthropic`, `fal`, `meshy`, `roblox`, `stripe`.
Create ad-hoc breakers with `getBreaker({ service: 'custom', ... })`.

---

## 2. Retry and timeout — `src/lib/reliability/retry.ts`

Three helpers:

| Helper | What it does |
| --- | --- |
| `withRetry(fn, opts)` | Retries with exponential backoff + full jitter. |
| `withTimeout(fn, ms)` | Races against an AbortController timeout. |
| `withRetryAndTimeout(fn, opts)` | Per-attempt timeout inside a retry loop. |

### Retry semantics

- Default max attempts: **3**
- Default base delay: **200 ms**, factor **2**, cap **10 s**
- Jitter: **full jitter** (AWS algorithm: `random(0, capped_backoff)`)
- Default retryable predicate:
  - Retry on HTTP 5xx, 408, 425, 429
  - Retry on network errors: `ECONNRESET`, `ETIMEDOUT`, `EAI_AGAIN`,
    `ENOTFOUND`, `ECONNREFUSED`, `EPIPE`
  - Never retry on `AbortError` or 4xx (except above)

### Timeline

```
  attempt 1 ---X  wait(jitter)  attempt 2 -------X  wait(jitter)  attempt 3 -----> OK
              ^                                 ^
              retryable?                        retryable?
```

Each returned result includes `{ attempts, totalDurationMs }` so callers can
feed metrics without re-instrumenting.

---

## 3. Token-bucket limiter — `src/lib/reliability/rate-limit-burst.ts`

Unlike the *inbound* rate limiter (`src/lib/rate-limit.ts`), this limiter
applies **backpressure** to outbound calls instead of returning 429.

```
  capacity=10   +----------+
                |##########|   tokens refill at refillPerSecond
  current=3     |###       |
                +----------+
                    |
                    v
               acquire(cost)
                    |
           +--------+--------+
           |                 |
        enough              waits until enough
         tokens             or throws RateLimitBackpressureTimeout
```

Use `withBurstLimit(cfg, fn)` to wrap calls:

```ts
import { BUCKETS, withBurstLimit } from '@/lib/reliability/rate-limit-burst'

await withBurstLimit(BUCKETS.fal, () => fal.run(...))
```

---

## 4. Metrics — `src/lib/observability/metrics.ts`

Three primitive types — `counter`, `histogram`, `gauge` — plus domain helpers:

```ts
metrics.aiCallLatency('claude-opus', 842, 'ok')
metrics.meshUploadTime('meshy', 12_400)
metrics.queueDepth('job-queue', 17)
metrics.cacheHit('showcase', true)
metrics.routeError('/api/enhance', 500)
```

Buffered in memory and flushed every 10s to `POST /api/metrics`, which fans
out to Redis (short time-series) and PostHog (custom events). In dev / test
all metric calls are no-ops.

## 5. Slow query detector — `src/lib/observability/slow-query-detector.ts`

Attach once near startup:

```ts
import { db } from '@/lib/db'
import { attachSlowQueryDetector } from '@/lib/observability/slow-query-detector'
attachSlowQueryDetector(db, { thresholdMs: 500 })
```

Any query exceeding the threshold emits a `db.query.slow_ms` histogram and
a warning-level Sentry event with truncated params and a captured stack.

## 6. Structured logger — `src/lib/observability/structured-logger.ts`

Single-line JSON logs, Vercel log-drain compatible. Context is attached via
`AsyncLocalStorage`:

```ts
runWithLogContext({ requestId: newRequestId(), userId }, () => {
  log.info('enhance.start', { prompt: promptLen })
  // ...later, inside any async stack depth...
  log.warn('enhance.slow', { durationMs: 2_400 })
})
```

## 7. Cache strategies — `src/lib/cache/strategies.ts`

| Pattern | When to use |
| --- | --- |
| `cacheAside` | Simple read-through. Miss -> call origin -> write. |
| `cacheRefresh` | Hot keys. Serve cached while refreshing in background. |
| `cacheBatch` | Batch fetch many keys in one mget; origin only for misses. |

All three use an L1 in-memory cache fronting Redis and include single-flight
stampede protection so only one origin call runs per key.

## 8. CDN headers — `src/lib/cache/cdn-headers.ts`

Four cache classes:

| Class | Cache-Control | Use |
| --- | --- | --- |
| `public` | `public, s-maxage=300, swr=3600` | Anonymous catalog endpoints |
| `dynamic` | `public, s-maxage=30, swr=300` | Server-rendered feeds |
| `personal` | `private, no-store` | Authenticated user data |
| `private` | `no-store, no-cache` | Secrets / Stripe / billing |

## 9. Health checks — `src/lib/health/healthcheck.ts`

Runs parallel probes against: database, Redis, Anthropic, Meshy, Stripe,
Roblox Open Cloud. Each probe is timed out at 2.5s by default and either
counts as `down` (when the dependency is required) or `degraded` (when
optional). Used by `/api/health` and the public `/status` page.

## 10. Metrics ingest — `src/app/api/metrics/route.ts`

Receives buffered metric points via `POST /api/metrics`, validates the
payload, forwards to PostHog (when configured), and stores the most recent
100 samples per metric name + label signature in Redis for the `/status`
page. All downstream writes are fire-and-forget.

---

## Migration checklist

- [ ] Wrap outbound AI calls in `breakers.anthropic().execute(...)`.
- [ ] Replace ad-hoc retry loops with `withRetryAndTimeout`.
- [ ] Apply `BUCKETS.fal` + `withBurstLimit` to image generation code paths.
- [ ] Attach `slow-query-detector` in the Prisma client bootstrap.
- [ ] Wrap route handlers with `runWithLogContext` via middleware.
- [ ] Replace manual `Cache-Control` strings with `cacheHeaders(class)`.
