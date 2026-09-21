// A synthesized crowd cheer + applause bed for the Winner reveal - starts
// the instant the card starts spinning and fades out as the reveal
// animation finishes. Built entirely with the Web Audio API (filtered noise
// bursts shaped into claps/whoops) rather than tonal oscillator "fanfare"
// jingles (an earlier version of this file - those just sounded bad in
// practice). Not bundled/recorded audio or a real crowd sample either, same
// "no copyrighted/hosted audio" boundary this project keeps everywhere else
// (see CLAUDE.md's Spotify/YouTube decisions), and no new dependency.
let audioCtx: AudioContext | null = null

// Call this synchronously from within a real user gesture (the "Final
// Results" button's own click handler) so the AudioContext is already
// running by the time playWinnerCheer() is actually needed, right as
// WinnerRevealCard mounts a moment later - some browsers no longer treat
// that as a fresh gesture otherwise. Same autoplay-policy issue already
// handled for YouTube playback elsewhere in this app (NowPlayingPlayer.tsx).
export function primeWinnerFanfare() {
  try {
    if (!audioCtx) audioCtx = new AudioContext()
    if (audioCtx.state === 'suspended') void audioCtx.resume()
  } catch {
    // Web Audio unsupported/blocked - the cheer just won't play, harmless.
  }
}

function createNoiseBuffer(ctx: AudioContext, durationSec: number): AudioBuffer {
  const length = Math.max(1, Math.floor(ctx.sampleRate * durationSec))
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1
  return buffer
}

// One quick hand-clap - a very short, high-passed noise burst with a sharp
// attack and fast decay. Many of these scattered randomly across the
// duration is what actually reads as "a crowd clapping" rather than a
// single synthesized tone ever could.
function addClap(ctx: AudioContext, dest: AudioNode, at: number) {
  const clapDur = 0.03
  const source = ctx.createBufferSource()
  source.buffer = createNoiseBuffer(ctx, clapDur)
  const highpass = ctx.createBiquadFilter()
  highpass.type = 'highpass'
  highpass.frequency.value = 1800 + Math.random() * 2500
  const gain = ctx.createGain()
  const peak = 0.06 + Math.random() * 0.08
  gain.gain.setValueAtTime(0, at)
  gain.gain.linearRampToValueAtTime(peak, at + 0.004)
  gain.gain.exponentialRampToValueAtTime(0.001, at + clapDur)
  source.connect(highpass)
  highpass.connect(gain)
  gain.connect(dest)
  source.start(at)
  source.stop(at + clapDur + 0.02)
}

// One rising-then-falling "whoop" of cheering, from filtered noise swept
// through a bandpass filter's center frequency - a crude but effective
// stand-in for a voice-like shout, layered under the claps.
function addCheerWhoop(ctx: AudioContext, dest: AudioNode, at: number, duration: number) {
  const source = ctx.createBufferSource()
  source.buffer = createNoiseBuffer(ctx, duration)
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.Q.value = 3.5
  const peakFreq = 1000 + Math.random() * 900
  filter.frequency.setValueAtTime(500, at)
  filter.frequency.linearRampToValueAtTime(peakFreq, at + duration * 0.55)
  filter.frequency.linearRampToValueAtTime(peakFreq * 0.6, at + duration)
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0, at)
  gain.gain.linearRampToValueAtTime(0.1, at + duration * 0.25)
  gain.gain.linearRampToValueAtTime(0, at + duration)
  source.connect(filter)
  filter.connect(gain)
  gain.connect(dest)
  source.start(at)
  source.stop(at + duration + 0.05)
}

// Plays a crowd cheer + applause bed for `durationSec`, faded in at the
// start and out at the end (per the host's request) - meant to span the
// WHOLE reveal animation (spin + burst), started right as it begins rather
// than waiting for it to settle.
export function playWinnerCheer(durationSec: number) {
  try {
    if (!audioCtx) return
    const ctx = audioCtx
    const now = ctx.currentTime
    const fadeIn = 0.2
    const fadeOut = 0.5

    const master = ctx.createGain()
    master.gain.setValueAtTime(0, now)
    master.gain.linearRampToValueAtTime(1, now + fadeIn)
    master.gain.setValueAtTime(1, now + Math.max(fadeIn, durationSec - fadeOut))
    master.gain.linearRampToValueAtTime(0, now + durationSec)
    master.connect(ctx.destination)

    // Continuous filtered-noise "roar" bed underneath the claps/whoops,
    // with a slow random amplitude wobble so it doesn't sound like a flat
    // hiss - many overlapping voices/hands rather than one steady tone.
    const bedSource = ctx.createBufferSource()
    bedSource.buffer = createNoiseBuffer(ctx, durationSec + 0.2)
    bedSource.loop = false
    const bandpass = ctx.createBiquadFilter()
    bandpass.type = 'bandpass'
    bandpass.frequency.value = 1600
    bandpass.Q.value = 0.5
    const bedGain = ctx.createGain()
    const wobbleSteps = Math.max(6, Math.round(durationSec * 5))
    bedGain.gain.setValueAtTime(0, now)
    for (let i = 0; i <= wobbleSteps; i++) {
      const t = now + (i / wobbleSteps) * durationSec
      bedGain.gain.linearRampToValueAtTime(0.12 + Math.random() * 0.1, t)
    }
    bedSource.connect(bandpass)
    bandpass.connect(bedGain)
    bedGain.connect(master)
    bedSource.start(now)
    bedSource.stop(now + durationSec)

    // Dense scattered claps across the whole duration.
    const clapCount = Math.round(durationSec * 16)
    for (let i = 0; i < clapCount; i++) {
      addClap(ctx, master, now + Math.random() * durationSec)
    }

    // A handful of cheering whoops layered in.
    const whoopCount = Math.max(2, Math.round(durationSec / 1.1))
    for (let i = 0; i < whoopCount; i++) {
      const whoopDuration = 0.4 + Math.random() * 0.5
      const start = now + Math.random() * Math.max(0.1, durationSec - whoopDuration)
      addCheerWhoop(ctx, master, start, whoopDuration)
    }
  } catch {
    // The cheer is a nice-to-have flourish, never something that should be
    // able to break the reveal itself.
  }
}
