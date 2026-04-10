/**
 * Audio feedback for ForjeGames editor
 * Uses Web Audio API — no external audio files needed
 */

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    } catch {
      return null
    }
  }
  return audioCtx
}

/** Pleasant completion chime — two sine waves sweeping 800Hz→1200Hz, 150ms */
export function playCompletionSound() {
  const ctx = getAudioContext()
  if (!ctx) return
  try {
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(800, now)
    osc.frequency.setValueAtTime(1200, now + 0.08)
    gain.gain.setValueAtTime(0.15, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)
    osc.start(now)
    osc.stop(now + 0.15)
  } catch { /* silent fail */ }
}

/** Error/warning buzz */
export function playErrorSound() {
  const ctx = getAudioContext()
  if (!ctx) return
  try {
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 220 // A3 (low)
    osc.type = 'square'
    gain.gain.setValueAtTime(0.05, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2)
    osc.start(now)
    osc.stop(now + 0.2)
  } catch { /* silent fail */ }
}

/** Subtle click for mode switching */
export function playClickSound() {
  const ctx = getAudioContext()
  if (!ctx) return
  try {
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 1200
    gain.gain.setValueAtTime(0.03, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)
    osc.start(now)
    osc.stop(now + 0.05)
  } catch { /* silent fail */ }
}

/** Achievement unlock jingle — three ascending tones */
export function playAchievementSound() {
  const ctx = getAudioContext()
  if (!ctx) return
  try {
    const now = ctx.currentTime
    const notes = [523, 659, 784] // C5, E5, G5 — major chord arpeggio
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = freq
      const start = now + i * 0.12
      gain.gain.setValueAtTime(0.07, start)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3)
      osc.start(start)
      osc.stop(start + 0.3)
    })
  } catch { /* silent fail */ }
}

/** Playtest start — ascending sweep */
export function playPlaytestStartSound() {
  const ctx = getAudioContext()
  if (!ctx) return
  try {
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(400, now)
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.3)
    gain.gain.setValueAtTime(0.05, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)
    osc.start(now)
    osc.stop(now + 0.35)
  } catch { /* silent fail */ }
}
