import { spawn } from 'child_process'
import * as path from 'path'
import * as fs from 'fs/promises'
import * as os from 'os'
import * as crypto from 'crypto'

export class SandboxTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Sandbox execution timed out after ${timeoutMs}ms`)
    this.name = 'SandboxTimeoutError'
  }
}

export class SandboxError extends Error {
  constructor(
    message: string,
    public readonly stderr: string
  ) {
    super(message)
    this.name = 'SandboxError'
  }
}

export interface SandboxResult {
  stdout: string
  stderr: string
  exitCode: number
  durationMs: number
}

export async function runInSandbox(
  code: string,
  { timeoutMs = 5000, memoryLimitMb = 128 }: { timeoutMs?: number; memoryLimitMb?: number } = {}
): Promise<SandboxResult> {
  // Write code to a temp file (Deno requires a file path)
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'robloxforge-sandbox-'))
  const tempFile = path.join(tempDir, `${crypto.randomBytes(8).toString('hex')}.ts`)

  try {
    await fs.writeFile(tempFile, code, 'utf-8')

    const startMs = Date.now()

    const result = await new Promise<SandboxResult>((resolve, reject) => {
      // Deno with no permissions = full isolation
      // V8 flags for memory limit
      const denoProcess = spawn(
        'deno',
        [
          'run',
          '--no-prompt',
          `--v8-flags=--max-old-space-size=${memoryLimitMb}`,
          // Deliberately NO --allow-net, --allow-read, --allow-write, --allow-env
          tempFile,
        ],
        {
          stdio: ['ignore', 'pipe', 'pipe'],
        }
      )

      let stdout = ''
      let stderr = ''

      denoProcess.stdout?.on('data', (d: Buffer) => {
        stdout += d.toString()
      })
      denoProcess.stderr?.on('data', (d: Buffer) => {
        stderr += d.toString()
      })

      const timer = setTimeout(() => {
        denoProcess.kill('SIGKILL')
        reject(new SandboxTimeoutError(timeoutMs))
      }, timeoutMs)

      denoProcess.on('close', (code) => {
        clearTimeout(timer)
        const durationMs = Date.now() - startMs
        resolve({
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: code ?? -1,
          durationMs,
        })
      })

      denoProcess.on('error', (err) => {
        clearTimeout(timer)
        // If deno is not installed, fail gracefully
        if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
          resolve({
            stdout: '',
            stderr: 'Deno runtime not available',
            exitCode: -1,
            durationMs: 0,
          })
        } else {
          reject(new SandboxError(err.message, ''))
        }
      })
    })

    if (result.exitCode !== 0 && result.exitCode !== null) {
      throw new SandboxError(
        `Sandbox exited with code ${result.exitCode}: ${result.stderr}`,
        result.stderr
      )
    }

    return result
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {})
  }
}
