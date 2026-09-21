// A synthesized crowd cheer for the Winner reveal - starts the instant the
// card starts spinning and fades out as the reveal animation finishes.
// Built entirely with the Web Audio API (percussive noise claps + pitched
// "woo-hoo!" oscillator shouts) - not bundled/recorded audio or a real
// crowd sample, same "no copyrighted/hosted audio" boundary this project
// keeps everywhere else (see CLAUDE.md's Spotify/YouTube decisions), and no
// new dependency either.
//
// First attempt used a continuous filtered-noise "bed" for texture, which
// in practice just read as rain/static hiss rather than a crowd - real
// applause is actually many distinct percussive claps happening close
// together, not a wash of noise, so this version leans entirely on
// individual clap transients (sparse at first, then dense) plus a couple of
// pitched vocal-ish "woo-hoo!" shouts instead.
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

// One hand-clap: a short, punchy noise burst band-passed around the
// 1.5-3.5kHz range real claps concentrate their energy in, with a sharp
// attack and quick decay - distinct little "thwack" transients rather than
// a wash, so a handful of them read as actual claps instead of static.
function addClap(ctx: AudioContext, dest: AudioNode, at: number, peak: number) {
  const clapDur = 0.045
  const source = ctx.createBufferSource()
  source.buffer = createNoiseBuffer(ctx, clapDur)
  const bandpass = ctx.createBiquadFilter()
  bandpass.type = 'bandpass'
  bandpass.frequency.value = 1500 + Math.random() * 2000
  bandpass.Q.value = 1.2
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0, at)
  gain.gain.linearRampToValueAtTime(peak, at + 0.002)
  gain.gain.exponentialRampToValueAtTime(0.001, at + clapDur)
  source.connect(bandpass)
  bandpass.connect(gain)
  gain.connect(dest)
  source.start(at)
  source.stop(at + clapDur + 0.02)
}

// A single shouted "Woo-hoo!" - a pitched sawtooth (softened with a
// low-pass so it doesn't buzz) that glides up quickly for the "Woo-", holds
// with a light vibrato for the "-hoo!", then decays - reads as an actual
// human cheer far better than filtered noise ever does.
function addWoohoo(ctx: AudioContext, dest: AudioNode, at: number, peak: number) {
  const duration = 0.85
  const osc = ctx.createOscillator()
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(300, at)
  osc.frequency.exponentialRampToValueAtTime(680, at + 0.16)
  osc.frequency.exponentialRampToValueAtTime(560, at + 0.45)
  osc.frequency.exponentialRampToValueAtTime(420, at + duration)

  const vibrato = ctx.createOscillator()
  vibrato.frequency.value = 7
  const vibratoGain = ctx.createGain()
  vibratoGain.gain.value = 12
  vibrato.connect(vibratoGain)
  vibratoGain.connect(osc.frequency)

  const lowpass = ctx.createBiquadFilter()
  lowpass.type = 'lowpass'
  lowpass.frequency.value = 2000

  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0, at)
  gain.gain.linearRampToValueAtTime(peak, at + 0.06)
  gain.gain.setValueAtTime(peak, at + 0.4)
  gain.gain.exponentialRampToValueAtTime(0.001, at + duration)

  osc.connect(lowpass)
  lowpass.connect(gain)
  gain.connect(dest)
  osc.start(at)
  osc.stop(at + duration + 0.05)
  vibrato.start(at)
  vibrato.stop(at + duration + 0.05)
}

// Plays a crowd cheer for `durationSec`, faded in at the start and out at
// the end - starts with a few sparse, distinct claps ("clap... clap...
// clap..."), a couple of "woo-hoo!" shouts overlapping in, then builds into
// a dense flurry of claps (applause) for the rest of the duration. Meant to
// span the WHOLE reveal animation (spin + burst), started right as it
// begins rather than waiting for it to settle.
//
// Returns a stop() that silences everything immediately - every clap/whoop
// is scheduled up front and can't individually be un-scheduled, but they
// all route through one master gain node, so cancelling its ramps and
// zeroing it silences the lot in one call. Needed because React's dev-mode
// double-invoke (mount -> cleanup -> mount again) would otherwise fire two
// overlapping cheers on top of each other with no way to stop the first -
// harmless in production (StrictMode double-invoke is dev-only), but WOULD
// also matter for a real early exit (someone taps to skip before the cheer
// finishes on its own).
export function playWinnerCheer(durationSec: number): () => void {
  try {
    if (!audioCtx) return () => {}
    const ctx = audioCtx
    const now = ctx.currentTime
    const fadeIn = 0.05
    const fadeOut = 0.5

    const master = ctx.createGain()
    master.gain.setValueAtTime(0, now)
    master.gain.linearRampToValueAtTime(1, now + fadeIn)
    master.gain.setValueAtTime(1, now + Math.max(fadeIn, durationSec - fadeOut))
    master.gain.linearRampToValueAtTime(0, now + durationSec)
    master.connect(ctx.destination)

    // A few sparse, clearly separated claps up front.
    const sparseCount = 4
    const sparseSpacing = 0.22
    for (let i = 0; i < sparseCount; i++) {
      addClap(ctx, master, now + i * sparseSpacing, 0.35 + Math.random() * 0.1)
    }
    const sparseEnd = sparseCount * sparseSpacing

    // One or two "woo-hoo!" shouts, starting around when the sparse claps
    // finish, staggered slightly so they don't sound perfectly stacked.
    addWoohoo(ctx, master, now + sparseEnd, 0.22)
    if (durationSec > 2.5) {
      addWoohoo(ctx, master, now + sparseEnd + 1.3 + Math.random() * 0.4, 0.18)
    }

    // Dense applause flurry for the remainder of the duration.
    const flurryStart = sparseEnd + 0.15
    const flurryDuration = Math.max(0.3, durationSec - flurryStart)
    const flurryCount = Math.round(flurryDuration * 22)
    for (let i = 0; i < flurryCount; i++) {
      const at = now + flurryStart + Math.random() * flurryDuration
      addClap(ctx, master, at, 0.12 + Math.random() * 0.14)
    }

    return () => {
      try {
        master.gain.cancelScheduledValues(ctx.currentTime)
        master.gain.setValueAtTime(0, ctx.currentTime)
      } catch {
        // ignore - context/node may already be gone
      }
    }
  } catch {
    // The cheer is a nice-to-have flourish, never something that should be
    // able to break the reveal itself.
    return () => {}
  }
}
