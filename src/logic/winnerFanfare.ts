// A handful of short, synthesized victory jingles (~1s each) - one picked at
// random and played once, right as the Winner reveal card settles. Built
// entirely with the Web Audio API (oscillators + gain envelopes), not
// bundled/recorded audio files or real songs - same "no copyrighted audio
// hosted by the app" boundary this project has kept everywhere else (see
// CLAUDE.md's Spotify/YouTube decisions), and no new dependency either.
let audioCtx: AudioContext | null = null

// Call this synchronously from within a real user gesture (the "Final
// Results" button's own click handler) so the AudioContext is already
// running by the time playRandomWinnerFanfare() is actually needed, ~1.3s
// later once the card's spin animation settles - by then some browsers no
// longer consider it a fresh gesture. Same autoplay-policy issue already
// handled for YouTube playback elsewhere in this app (NowPlayingPlayer.tsx).
export function primeWinnerFanfare() {
  try {
    if (!audioCtx) audioCtx = new AudioContext()
    if (audioCtx.state === 'suspended') void audioCtx.resume()
  } catch {
    // Web Audio unsupported/blocked - the fanfare just won't play, harmless.
  }
}

function tone(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  startOffset: number,
  duration: number,
  type: OscillatorType,
  peakGain: number
) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.value = freq
  const start = ctx.currentTime + startOffset
  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(peakGain, start + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration)
  osc.connect(gain)
  gain.connect(dest)
  osc.start(start)
  osc.stop(start + duration + 0.05)
}

type Jingle = (ctx: AudioContext, dest: AudioNode) => void

const JINGLES: Jingle[] = [
  // Ascending major arpeggio: C5 E5 G5 C6
  (ctx, dest) => {
    ;[523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(ctx, dest, f, i * 0.11, 0.35, 'triangle', 0.22))
  },
  // Two-chord "ta-da": a plain low chord, then a brighter one on top of it
  (ctx, dest) => {
    ;[392, 493.88].forEach((f) => tone(ctx, dest, f, 0, 0.25, 'square', 0.14))
    ;[523.25, 659.25, 783.99].forEach((f) => tone(ctx, dest, f, 0.22, 0.6, 'triangle', 0.2))
  },
  // Rhythmic fanfare call: G G G C
  (ctx, dest) => {
    const beats: [number, number][] = [
      [392, 0],
      [392, 0.14],
      [392, 0.28],
      [587.33, 0.48],
    ]
    beats.forEach(([f, t]) => tone(ctx, dest, f, t, 0.3, 'sawtooth', 0.16))
  },
  // Descending bell cascade
  (ctx, dest) => {
    ;[1046.5, 880, 698.46, 523.25].forEach((f, i) => tone(ctx, dest, f, i * 0.13, 0.5, 'sine', 0.2))
  },
]

export function playRandomWinnerFanfare() {
  try {
    if (!audioCtx) return
    const ctx = audioCtx
    const master = ctx.createGain()
    master.gain.value = 1
    master.connect(ctx.destination)
    const jingle = JINGLES[Math.floor(Math.random() * JINGLES.length)]
    jingle(ctx, master)
  } catch {
    // Fanfare is a nice-to-have flourish, never something that should be
    // able to break the reveal itself.
  }
}
