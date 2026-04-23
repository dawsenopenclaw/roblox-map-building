/**
 * Video Analyzer v2 — Full video learning pipeline
 *
 * Extracts dense frames + audio transcription from video files.
 * Designed to let Claude "watch" videos by analyzing thousands of frames
 * and reading audio transcripts.
 *
 * Usage:
 *   npx tsx scripts/video-analyzer.ts <video_or_folder> [options]
 *
 * Options:
 *   --fps N          Frames per second to extract (default: 2, max: 5)
 *   --keyframes      Extract only keyframes/scene changes (smart mode)
 *   --no-audio       Skip audio extraction
 *   --transcript     Attempt speech-to-text on audio (requires Whisper API key)
 *   --summary        Generate a frame-by-frame summary report
 *   --max-frames N   Cap total frames per video (default: 500)
 *
 * Requires: ffmpeg at C:\Users\Dawse\Downloads\ffmpeg_extracted\ffmpeg-8.1-essentials_build\bin\
 */

import { execSync } from 'child_process'
import { existsSync, mkdirSync, readdirSync, writeFileSync, readFileSync, statSync } from 'fs'
import { join, basename, dirname, extname } from 'path'

const FFMPEG_DIR = 'C:\\Users\\Dawse\\Downloads\\ffmpeg_extracted\\ffmpeg-8.1-essentials_build\\bin'
const FFMPEG = join(FFMPEG_DIR, 'ffmpeg.exe')
const FFPROBE = join(FFMPEG_DIR, 'ffprobe.exe')

// ─── Video Info ─────────────────────────────────────────────────────────────

interface VideoInfo {
  duration: number
  width: number
  height: number
  fps: number
  codec: string
  hasAudio: boolean
  fileSize: number
}

function getVideoInfo(videoPath: string): VideoInfo {
  try {
    const raw = execSync(
      `"${FFPROBE}" -v quiet -print_format json -show_format -show_streams "${videoPath}"`,
      { encoding: 'utf-8', timeout: 15000 }
    )
    const info = JSON.parse(raw)
    const videoStream = info.streams?.find((s: any) => s.codec_type === 'video')
    const audioStream = info.streams?.find((s: any) => s.codec_type === 'audio')
    const fpsRaw = videoStream?.r_frame_rate || '30/1'
    const [num, den] = fpsRaw.split('/').map(Number)
    return {
      duration: parseFloat(info.format?.duration || '0'),
      width: parseInt(videoStream?.width || '0'),
      height: parseInt(videoStream?.height || '0'),
      fps: den ? num / den : 30,
      codec: videoStream?.codec_name || 'unknown',
      hasAudio: !!audioStream,
      fileSize: parseInt(info.format?.size || '0'),
    }
  } catch {
    return { duration: 30, width: 0, height: 0, fps: 30, codec: 'unknown', hasAudio: false, fileSize: 0 }
  }
}

// ─── Dense Frame Extraction ─────────────────────────────────────────────────

function extractDenseFrames(
  videoPath: string,
  outputDir: string,
  fps: number,
  maxFrames: number,
): string[] {
  const info = getVideoInfo(videoPath)
  const estimatedFrames = Math.ceil(info.duration * fps) || 30
  const actualFps = estimatedFrames > maxFrames ? Math.max(0.5, maxFrames / Math.max(info.duration, 1)) : Math.max(0.5, fps)

  console.log(`  Extracting at ${actualFps.toFixed(1)} fps (~${Math.min(estimatedFrames, maxFrames)} frames)`)

  const framePattern = join(outputDir, 'frame_%05d.png')
  try {
    // Use scale filter to reduce resolution for faster processing (720p max)
    const scaleFilter = info.width > 1280
      ? ',scale=1280:-1'
      : ''
    const fpsVal = Math.max(0.5, Math.min(5, actualFps))
    const maxF = Math.max(10, Math.min(maxFrames || 500, 1000))
    const vp = videoPath.replace(/\\/g, '/')
    const fp = framePattern.replace(/\\/g, '/')
    const ff = FFMPEG.replace(/\\/g, '/')
    const cmd = `"${ff}" -i "${vp}" -vf "fps=${fpsVal.toFixed(2)}${scaleFilter}" -frames:v ${maxF} -q:v 3 "${fp}" -y`
    execSync(cmd, { timeout: 300000, stdio: 'pipe', maxBuffer: 50 * 1024 * 1024 })
  } catch (err: any) {
    const stderr = err?.stderr?.toString() || ''
    const lastLines = stderr.split('\n').filter((l: string) => l.trim()).slice(-5).join('\n')
    console.warn(`  Frame extraction error:\n${lastLines}`)
  }

  // Collect all extracted frames
  const frames: string[] = []
  for (let i = 1; i <= maxFrames + 10; i++) {
    const framePath = join(outputDir, `frame_${String(i).padStart(5, '0')}.png`)
    if (existsSync(framePath)) frames.push(framePath)
    else break
  }
  return frames
}

// ─── Keyframe / Scene Change Detection ──────────────────────────────────────

function extractKeyframes(
  videoPath: string,
  outputDir: string,
  maxFrames: number,
): string[] {
  console.log(`  Extracting scene-change keyframes (smart mode)`)

  const framePattern = join(outputDir, 'key_%05d.png')
  try {
    // select='gt(scene,0.3)' detects scene changes with 30% threshold
    execSync(
      `"${FFMPEG}" -i "${videoPath}" -vf "select='gt(scene,0.3)',scale=1280:-1" -vsync vfr -frames:v ${maxFrames} -q:v 3 "${framePattern}" -y`,
      { timeout: 300000, stdio: 'pipe', maxBuffer: 50 * 1024 * 1024 }
    )
  } catch {
    console.warn(`  Keyframe extraction failed, falling back to interval mode`)
    return extractDenseFrames(videoPath, outputDir, 1, Math.min(maxFrames, 30))
  }

  const frames: string[] = []
  for (let i = 1; i <= maxFrames + 10; i++) {
    const framePath = join(outputDir, `key_${String(i).padStart(5, '0')}.png`)
    if (existsSync(framePath)) frames.push(framePath)
    else break
  }

  // If scene detection found too few, supplement with interval frames
  if (frames.length < 5) {
    console.log(`  Only ${frames.length} keyframes found, supplementing with interval frames`)
    const extra = extractDenseFrames(videoPath, outputDir, 0.5, 20)
    frames.push(...extra)
  }

  return frames
}

// ─── Audio Extraction ───────────────────────────────────────────────────────

function extractAudio(videoPath: string, outputDir: string): string | null {
  const info = getVideoInfo(videoPath)
  if (!info.hasAudio) {
    console.log(`  No audio track`)
    return null
  }

  const audioFile = join(outputDir, 'audio.wav')
  try {
    // Extract as 16kHz mono WAV (optimal for speech recognition)
    const vp2 = videoPath.replace(/\\/g, '/')
    const af2 = audioFile.replace(/\\/g, '/')
    const ff2 = FFMPEG.replace(/\\/g, '/')
    execSync(
      `"${ff2}" -i "${vp2}" -vn -acodec pcm_s16le -ar 16000 -ac 1 "${af2}" -y`,
      { timeout: 120000, stdio: 'pipe' }
    )
    if (existsSync(audioFile)) {
      const size = statSync(audioFile).size
      console.log(`  Audio extracted: ${(size / 1024 / 1024).toFixed(1)}MB`)
      return audioFile
    }
  } catch {
    console.warn(`  Audio extraction failed`)
  }
  return null
}

// ─── Audio Transcription (Whisper via Groq) ─────────────────────────────────

async function transcribeAudio(audioPath: string, outputDir: string): Promise<string | null> {
  const groqKey = process.env.GROQ_API_KEY
  if (!groqKey) {
    console.log(`  No GROQ_API_KEY — skipping transcription. Set it to enable Whisper.`)
    return null
  }

  console.log(`  Transcribing audio via Groq Whisper...`)

  try {
    // Split audio into 25MB chunks (Groq limit)
    const audioSize = statSync(audioPath).size
    const chunkDuration = Math.floor(25 * 1024 * 1024 / (16000 * 2) ) // ~25MB in seconds at 16kHz mono
    const info = getVideoInfo(audioPath.replace('audio.wav', '*.mp4')) // rough duration
    const numChunks = Math.ceil(audioSize / (25 * 1024 * 1024))

    let fullTranscript = ''

    if (numChunks <= 1) {
      // Single chunk — send directly
      const formData = new FormData()
      const audioBuffer = readFileSync(audioPath)
      const blob = new Blob([audioBuffer], { type: 'audio/wav' })
      formData.append('file', blob, 'audio.wav')
      formData.append('model', 'whisper-large-v3')
      formData.append('language', 'en')

      const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${groqKey}` },
        body: formData,
      })

      if (res.ok) {
        const data = await res.json() as { text?: string }
        fullTranscript = data.text || ''
      } else {
        console.warn(`  Whisper API error: ${res.status}`)
        return null
      }
    } else {
      // Multiple chunks — split and transcribe each
      for (let i = 0; i < numChunks; i++) {
        const chunkPath = join(outputDir, `audio_chunk_${i}.wav`)
        const start = i * chunkDuration
        try {
          execSync(
            `"${FFMPEG}" -i "${audioPath}" -ss ${start} -t ${chunkDuration} -acodec pcm_s16le -ar 16000 -ac 1 "${chunkPath}" -y`,
            { timeout: 30000, stdio: 'pipe' }
          )
          if (!existsSync(chunkPath)) continue

          const formData = new FormData()
          const audioBuffer = readFileSync(chunkPath)
          const blob = new Blob([audioBuffer], { type: 'audio/wav' })
          formData.append('file', blob, 'audio_chunk.wav')
          formData.append('model', 'whisper-large-v3')
          formData.append('language', 'en')

          const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${groqKey}` },
            body: formData,
          })

          if (res.ok) {
            const data = await res.json() as { text?: string }
            if (data.text) fullTranscript += (fullTranscript ? ' ' : '') + data.text
          }
        } catch {
          console.warn(`  Chunk ${i} transcription failed`)
        }
      }
    }

    if (fullTranscript) {
      const transcriptPath = join(outputDir, 'transcript.txt')
      writeFileSync(transcriptPath, fullTranscript)
      console.log(`  Transcript: ${fullTranscript.length} chars`)
      return transcriptPath
    }
  } catch (err) {
    console.warn(`  Transcription error:`, (err as Error).message?.slice(0, 100))
  }
  return null
}

// ─── Frame Summary Report ───────────────────────────────────────────────────

function generateSummary(
  videoPath: string,
  info: VideoInfo,
  frames: string[],
  audioFile: string | null,
  transcriptPath: string | null,
  outputDir: string,
): string {
  const name = basename(videoPath)
  const transcript = transcriptPath ? readFileSync(transcriptPath, 'utf-8') : null

  let report = `# Video Analysis: ${name}\n\n`
  report += `## Metadata\n`
  report += `- Duration: ${info.duration.toFixed(1)}s (${(info.duration / 60).toFixed(1)} min)\n`
  report += `- Resolution: ${info.width}x${info.height}\n`
  report += `- FPS: ${info.fps.toFixed(0)}\n`
  report += `- Codec: ${info.codec}\n`
  report += `- File size: ${(info.fileSize / 1024 / 1024).toFixed(1)}MB\n`
  report += `- Has audio: ${info.hasAudio}\n`
  report += `- Frames extracted: ${frames.length}\n\n`

  if (transcript) {
    report += `## Audio Transcript\n${transcript}\n\n`
  }

  report += `## Frame List\n`
  report += `Total: ${frames.length} frames. Review them at:\n`
  report += `  ${outputDir}\n\n`
  report += `To have Claude analyze frames, use:\n`
  report += `  Read tool on any frame PNG path listed below.\n\n`

  // List frames with timestamps
  const interval = info.duration / Math.max(frames.length, 1)
  for (let i = 0; i < frames.length; i++) {
    const timestamp = (i * interval).toFixed(1)
    report += `- [${timestamp}s] ${frames[i]}\n`
  }

  const reportPath = join(outputDir, 'report.md')
  writeFileSync(reportPath, report)
  return reportPath
}

// ─── Main Analysis ──────────────────────────────────────────────────────────

interface AnalysisResult {
  video: string
  outputDir: string
  info: VideoInfo
  frames: string[]
  audioFile: string | null
  transcriptPath: string | null
  reportPath: string
}

async function analyzeVideo(
  videoPath: string,
  opts: { fps: number; maxFrames: number; keyframes: boolean; audio: boolean; transcript: boolean; summary: boolean },
): Promise<AnalysisResult> {
  const name = basename(videoPath, extname(videoPath))
  const outputDir = join(dirname(videoPath), `${name}_analysis`)
  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true })

  console.log(`\n${'='.repeat(60)}`)
  console.log(`[VideoAnalyzer] ${basename(videoPath)}`)
  console.log(`${'='.repeat(60)}`)

  const info = getVideoInfo(videoPath)
  console.log(`  ${info.duration.toFixed(1)}s | ${info.width}x${info.height} | ${info.codec} | ${(info.fileSize / 1024 / 1024).toFixed(1)}MB`)

  // Extract frames
  let frames: string[]
  if (opts.keyframes) {
    frames = extractKeyframes(videoPath, outputDir, opts.maxFrames)
  } else {
    frames = extractDenseFrames(videoPath, outputDir, opts.fps, opts.maxFrames)
  }
  console.log(`  Total frames: ${frames.length}`)

  // Extract audio
  let audioFile: string | null = null
  if (opts.audio) {
    audioFile = extractAudio(videoPath, outputDir)
  }

  // Transcribe
  let transcriptPath: string | null = null
  if (opts.transcript && audioFile) {
    transcriptPath = await transcribeAudio(audioFile, outputDir)
  }

  // Summary report
  const reportPath = generateSummary(videoPath, info, frames, audioFile, transcriptPath, outputDir)
  console.log(`  Report: ${reportPath}`)

  // Write machine-readable result
  const result: AnalysisResult = { video: videoPath, outputDir, info, frames, audioFile, transcriptPath, reportPath }
  writeFileSync(join(outputDir, 'result.json'), JSON.stringify(result, null, 2))

  return result
}

async function analyzeFolder(
  folderPath: string,
  opts: { fps: number; maxFrames: number; keyframes: boolean; audio: boolean; transcript: boolean; summary: boolean },
): Promise<void> {
  const videoExts = new Set(['.mp4', '.MP4', '.mov', '.MOV', '.avi', '.webm', '.mkv', '.m4v'])
  const files = readdirSync(folderPath)
    .filter(f => videoExts.has(extname(f)))
    .sort()
    .map(f => join(folderPath, f))

  console.log(`\n[VideoAnalyzer] Found ${files.length} video files in ${folderPath}`)

  const results: AnalysisResult[] = []
  let totalFrames = 0

  for (let i = 0; i < files.length; i++) {
    console.log(`\n[${i + 1}/${files.length}]`)
    try {
      const result = await analyzeVideo(files[i], opts)
      results.push(result)
      totalFrames += result.frames.length
    } catch (err) {
      console.error(`  FAILED: ${(err as Error).message?.slice(0, 100)}`)
    }
  }

  // Master report
  let master = `# Video Analysis Summary\n\n`
  master += `Total videos: ${results.length}\n`
  master += `Total frames extracted: ${totalFrames}\n`
  master += `Total duration: ${results.reduce((s, r) => s + r.info.duration, 0).toFixed(0)}s\n\n`

  master += `## Videos\n\n`
  for (const r of results) {
    master += `### ${basename(r.video)}\n`
    master += `- ${r.info.duration.toFixed(1)}s | ${r.info.width}x${r.info.height} | ${r.frames.length} frames\n`
    master += `- Report: ${r.reportPath}\n`
    if (r.transcriptPath) master += `- Transcript: ${r.transcriptPath}\n`
    master += `\n`
  }

  master += `## How to Review\n\n`
  master += `Ask Claude to read specific frames:\n`
  master += `\`\`\`\n`
  master += `Read the file at <frame_path>\n`
  master += `\`\`\`\n\n`
  master += `Or ask Claude to analyze a video's report:\n`
  master += `\`\`\`\n`
  master += `Read the file at <report_path>\n`
  master += `\`\`\`\n`

  const masterPath = join(folderPath, 'MASTER_REPORT.md')
  writeFileSync(masterPath, master)
  console.log(`\n${'='.repeat(60)}`)
  console.log(`DONE! ${results.length} videos, ${totalFrames} frames extracted.`)
  console.log(`Master report: ${masterPath}`)
  console.log(`${'='.repeat(60)}`)
}

// ─── CLI ────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
if (args.length === 0) {
  console.log(`
Video Analyzer v2 — Let Claude "watch" videos

Usage:
  npx tsx scripts/video-analyzer.ts <path> [options]

Arguments:
  <path>           Video file or folder of videos

Options:
  --fps N          Frames per second (default: 2, captures ~120 frames per minute)
  --keyframes      Smart mode: only extract scene changes (fewer but more meaningful frames)
  --max-frames N   Max frames per video (default: 500)
  --no-audio       Skip audio extraction
  --transcript     Transcribe audio via Groq Whisper (needs GROQ_API_KEY)
  --summary        Generate detailed summary report

Examples:
  npx tsx scripts/video-analyzer.ts ./videos/                    # Analyze all videos in folder
  npx tsx scripts/video-analyzer.ts ./vid.mp4 --fps 3            # Dense extraction at 3fps
  npx tsx scripts/video-analyzer.ts ./vid.mp4 --keyframes        # Smart scene detection
  npx tsx scripts/video-analyzer.ts ./videos/ --transcript       # With speech-to-text
`)
  process.exit(0)
}

const targetPath = args[0]
const opts = {
  fps: parseFloat(args.includes('--fps') ? args[args.indexOf('--fps') + 1] : '2') || 2,
  maxFrames: parseInt(args.includes('--max-frames') ? args[args.indexOf('--max-frames') + 1] : '500') || 500,
  keyframes: args.includes('--keyframes'),
  audio: !args.includes('--no-audio'),
  transcript: args.includes('--transcript'),
  summary: args.includes('--summary') || true,
}

if (!existsSync(targetPath)) {
  console.error(`Path not found: ${targetPath}`)
  process.exit(1)
}

;(async () => {
  if (statSync(targetPath).isDirectory()) {
    await analyzeFolder(targetPath, opts)
  } else {
    await analyzeVideo(targetPath, opts)
  }
})()
