/**
 * Shared embedding helper for all ingest scripts.
 *
 * Uses local BGE model via @huggingface/transformers — no API, no quota.
 * Re-exports embedLocal as embedThrottled so existing callers don't break.
 */
export { embedLocal as embedThrottled } from './embed-local'
