/**
 * Local embedding via @huggingface/transformers — no API, no quota, free forever.
 *
 * Uses BAAI/bge-base-en-v1.5 (768d) which matches our pgvector(768) column.
 * Model is ~438MB ONNX file, downloaded once to HF cache on first call,
 * then loaded from disk. Runs on CPU via WASM/ONNX — no GPU needed.
 *
 * Throughput: ~100ms/embed on modern CPU = ~600 embeds/min = unlimited.
 */

let pipelineInstance: any = null

async function getPipeline() {
  if (pipelineInstance) return pipelineInstance
  // Dynamic import so require() doesn't fail at module scope
  const { pipeline } = await import('@huggingface/transformers')
  console.error('[embed-local] Loading BAAI/bge-base-en-v1.5 (first call downloads ~438MB)...')
  pipelineInstance = await pipeline('feature-extraction', 'Xenova/bge-base-en-v1.5', {
    // Force CPU (no GPU needed)
    device: 'cpu',
    // Use default ONNX runtime (WASM)
  })
  console.error('[embed-local] Model loaded.')
  return pipelineInstance
}

/**
 * Embed a text string locally. Returns a 768-dim float array.
 * First call is slow (model download + load). After that, ~100ms/call.
 */
export async function embedLocal(text: string): Promise<number[]> {
  const pipe = await getPipeline()
  // BGE models recommend prefixing queries with "Represent this sentence:"
  // but for mixed ingest/query use, no prefix is fine — same vector space.
  const output = await pipe(text.slice(0, 512), { pooling: 'cls', normalize: true })
  // output.data is Float32Array, tolist() converts to plain number[]
  return Array.from(output.data as Float32Array)
}
