// Plays a real crowd-cheer sound clip for the Winner reveal - one picked at
// random from a small local set, right as the card starts spinning. Two
// earlier attempts synthesized the sound from scratch (tonal "fanfare"
// jingles, then filtered-noise claps) and neither convinced on a real
// listen, so this uses actual sound-effect files the host sourced and
// dropped into public/sounds/ themselves (their responsibility that they're
// cleared to use - e.g. royalty-free SFX, not a clip pulled from a
// copyrighted song, matching how this app handles music/audio everywhere
// else: see CLAUDE.md's Spotify/YouTube decisions).
let audioCtx: AudioContext | null = null

// Full-volume source clips read as too loud against the rest of the reveal -
// lowered after live-listen feedback, same "adjust after hearing it live"
// pattern as backgroundMusic.ts's MAX_VOLUME.
const MAX_VOLUME = 0.5

// public/ files are served at the site root - Vite doesn't rewrite these
// paths, so they need to be listed by hand (no build-time directory
// listing for a static host). Keep this in sync with whatever's actually in
// public/sounds/.
const WINNER_SOUND_FILES = [
  '/sounds/769801__thelastoneonearth__groovy-winner-end-version.wav',
  '/sounds/547657__awrecordingit__totalwin1.wav',
  '/sounds/u_ss015dykrt-brass-fanfare-with-timpani-and-winchimes-reverberated-146260.mp3',
  '/sounds/pw23check-winning-218995.mp3',
  '/sounds/freesound_community-winning-82808.mp3',
]

// Decoded buffers are cached per URL so picking the same file twice in one
// session (or preloading below) doesn't re-fetch/re-decode it.
const bufferCache = new Map<string, Promise<AudioBuffer>>()

function loadBuffer(ctx: AudioContext, url: string): Promise<AudioBuffer> {
  let cached = bufferCache.get(url)
  if (!cached) {
    cached = fetch(url)
      .then((res) => res.arrayBuffer())
      .then((data) => ctx.decodeAudioData(data))
    bufferCache.set(url, cached)
    // Don't cache a failed fetch/decode forever - let a later call retry.
    cached.catch(() => bufferCache.delete(url))
  }
  return cached
}

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

// Picks and plays one random clip from WINNER_SOUND_FILES, faded in over a
// few ms to avoid a click at the very start, then left to play out to its
// own natural end - these are already-produced short clips, not something
// that needs to be capped/looped to match the reveal animation's length.
//
// Only the CHOSEN file is fetched (not all of them) - one of these is 13MB,
// so preloading the whole set on every reveal would be wasteful, especially
// on mobile data.
//
// Returns a stop() that silences playback immediately, in case this
// component unmounts before the clip finishes (a real early tap-to-skip, or
// React's dev-only StrictMode mount/cleanup/mount) - there'd otherwise be no
// way to stop an already-started AudioBufferSourceNode's playback.
export function playWinnerCheer(): () => void {
  let stopped = false
  let source: AudioBufferSourceNode | null = null

  void (async () => {
    try {
      if (!audioCtx) return
      const ctx = audioCtx
      const url = WINNER_SOUND_FILES[Math.floor(Math.random() * WINNER_SOUND_FILES.length)]
      const buffer = await loadBuffer(ctx, url)
      if (stopped) return

      const gain = ctx.createGain()
      const now = ctx.currentTime
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(MAX_VOLUME, now + 0.03)
      gain.connect(ctx.destination)

      source = ctx.createBufferSource()
      source.buffer = buffer
      source.connect(gain)
      source.start(now)
    } catch {
      // The cheer is a nice-to-have flourish, never something that should
      // be able to break the reveal itself (missing file, decode failure,
      // Web Audio unsupported, etc. all land here).
    }
  })()

  return () => {
    stopped = true
    try {
      source?.stop()
    } catch {
      // Already stopped, or never actually started yet - fine either way.
    }
  }
}
