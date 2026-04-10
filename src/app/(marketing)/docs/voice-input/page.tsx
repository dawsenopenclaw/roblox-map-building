import type { Metadata } from 'next'
import { createMetadata } from '@/lib/metadata'
import DocsLayout from '@/components/docs/DocsLayout'
import Callout from '@/components/docs/Callout'

export const metadata: Metadata = createMetadata({
  title: 'Voice Input',
  description:
    'Use your voice to drive the ForjeGames editor. Push-to-talk with Whisper, auto-punctuation, multi-language support, and hands-free mode switching.',
  path: '/docs/voice-input',
})

const TOC = [
  { id: 'overview', label: 'Overview' },
  { id: 'how-it-works', label: 'How it works' },
  { id: 'activating', label: 'Activating voice input' },
  { id: 'tips', label: 'Tips for good transcription' },
  { id: 'languages', label: 'Supported languages' },
  { id: 'privacy', label: 'Privacy' },
]

export default function VoiceInputPage() {
  return (
    <DocsLayout
      eyebrow="Editor"
      title="Voice Input"
      description="Speak your game into existence. ForjeGames uses OpenAI Whisper for high-accuracy transcription so you can stay focused on the 3D preview."
      toc={TOC}
    >
      <h2 id="overview">Overview</h2>
      <p>
        Voice input lets you drive the editor hands-free. Press a hotkey, describe what
        you want, release the hotkey, and the transcript is sent as a chat prompt in the
        currently-active mode. It&apos;s the fastest way to iterate once your game is
        running and you want to look at the preview instead of the keyboard.
      </p>

      <h2 id="how-it-works">How it works</h2>
      <ol>
        <li>Your browser records audio via the standard Web Audio API.</li>
        <li>When you release the push-to-talk key, the clip is uploaded to our API.</li>
        <li>We transcribe it with OpenAI Whisper-large.</li>
        <li>
          The transcript is placed in the chat box; you can review it, edit it, and hit
          send — or enable <em>auto-send</em> in settings to skip the review step.
        </li>
      </ol>

      <Callout variant="info">
        Transcription costs 0.5 credits per 30 seconds, rounded up. A typical one-line
        prompt is free in practice.
      </Callout>

      <h2 id="activating">Activating voice input</h2>
      <p>There are three ways to trigger voice input:</p>
      <ul>
        <li>
          <strong>Push-to-talk</strong> — hold <kbd>⌘ ;</kbd> (macOS) or{' '}
          <kbd>Ctrl ;</kbd> (Windows/Linux). Release to send.
        </li>
        <li>
          <strong>Mic button</strong> — click the microphone icon at the bottom of the
          chat panel. Click again to stop.
        </li>
        <li>
          <strong>Voice-only mode</strong> — <em>Settings → Voice → Always listening</em>.
          The editor keeps the mic open and uses silence detection to chunk your speech
          into prompts automatically. Only recommended in a quiet room.
        </li>
      </ul>

      <Callout variant="warning" title="Browser permission">
        The first time you use voice input your browser will ask for microphone access.
        If you deny it by accident, re-enable it from the site settings (the padlock icon
        left of the URL) and reload the page.
      </Callout>

      <h2 id="tips">Tips for good transcription</h2>
      <ul>
        <li>Speak at a normal conversational pace — Whisper handles speed well.</li>
        <li>Short pauses between clauses produce cleaner punctuation.</li>
        <li>Say proper nouns twice if they matter (e.g. &quot;Zebra, that&apos;s zebra&quot;).</li>
        <li>
          Background music will reduce accuracy. If you have music running, pause it
          before speaking.
        </li>
      </ul>

      <h2 id="languages">Supported languages</h2>
      <p>
        Whisper supports 99 languages. ForjeGames auto-detects the language on each clip;
        you don&apos;t need to set it. However, the <em>editor UI</em> and the AI
        responses remain in English for now — if you speak French, the transcript is
        French, but the AI will reply in English unless you ask otherwise.
      </p>

      <h2 id="privacy">Privacy</h2>
      <p>
        Audio clips are processed in-memory on our API and deleted within 5 minutes. We
        never persist raw audio to disk and we do not use your clips to train any models.
        Transcripts are stored alongside the rest of your chat history and follow the
        same retention rules.
      </p>
    </DocsLayout>
  )
}
