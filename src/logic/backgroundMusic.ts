// Loops ambient background music during the low-stakes waiting screens
// (Lobby, Game Setup, Results) and stays silent while a song is actually
// playing or being judged (Submit, Guess) - see useBackgroundMusic in
// App.tsx, which drives every function here off the room's phase. The
// tracks themselves are host-uploaded mp3s in Firebase Storage (not
// public/, unlike winnerFanfare.ts's sound effects - see CLAUDE.md's
// "Bakgrunnshljóð eftir fösum leiksins" section for why: RTDB doesn't suit
// binary files, and Storage is a separate service within the same project).
import { getDownloadURL, ref } from 'firebase/storage'
import { storage } from '../firebase'
import { useMusicStore } from '../state/musicStore'

// Hand-listed, same reasoning as winnerFanfare.ts's WINNER_SOUND_FILES -
// Storage has no trivial client-side directory listing without extra rules
// complexity, so this just has to be kept in sync by hand with whatever's
// actually in the bucket root.
const BACKGROUND_MUSIC_FILES = [
  'aurectheme-cocktail-jazz-603901.mp3',
  'the_mountain-retro-game-593063.mp3',
  'trtasfiq-upbeat-background-music-212772.mp3',
  'vadim_makes_sound_quiz-thinking-timer-loop-551268.mp3',
  'andriih-funny-funny-music-585934.mp3',
  'tunetank-upbeat-funk-background-347615.mp3',
]

const FADE_MS = 1000
const FADE_STEPS = 20
// Truly ambient - meant to sit under the room's own conversation without
// anyone consciously noticing it's there, not a "second song" competing
// for attention. Lowered twice after live listens (first from full volume
// to 0.35, still "way too loud"; then here).
const MAX_VOLUME = 0.12

let audio: HTMLAudioElement | null = null
let fadeTimer: ReturnType<typeof setInterval> | null = null
// The file currently loaded into `audio` (paused or playing) - null before
// the first enterLobby() call, or after stopAndReset(). Distinct from
// whether it's actually audible right now (that's audio.paused/volume).
let currentFile: string | null = null

// Resolved once per file, not once per call - a real HTTPS download URL
// backed by a token, not something to re-fetch on every phase change.
const urlCache = new Map<string, Promise<string>>()

function loadUrl(file: string): Promise<string> {
  let cached = urlCache.get(file)
  if (!cached) {
    cached = getDownloadURL(ref(storage, file))
    urlCache.set(file, cached)
    // Don't cache a failed lookup forever (e.g. rules not published yet) -
    // let a later call retry.
    cached.catch(() => urlCache.delete(file))
  }
  return cached
}

// Kicked off as soon as this module loads, not lazily on first use - by the
// time a player actually clicks Create/Join Game (after typing a name),
// these have very likely already resolved, which matters for
// primeBackgroundMusic()/enterLobby() staying inside the browser's
// autoplay-gesture window instead of racing a fresh network round-trip.
for (const file of BACKGROUND_MUSIC_FILES) {
  loadUrl(file).catch(() => {})
}

function getAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio()
    audio.loop = true
    audio.volume = 0
    // Never added to the DOM - a standalone HTMLAudioElement plays fine
    // without it. Exposed only for local testing, same pattern as
    // NowPlayingPlayer.tsx's window.__mmrPlayer hook.
    if (import.meta.env.DEV) {
      ;(window as unknown as { __mmrBackgroundAudio?: HTMLAudioElement }).__mmrBackgroundAudio = audio
    }
  }
  return audio
}

function clearFade() {
  if (fadeTimer !== null) {
    clearInterval(fadeTimer)
    fadeTimer = null
  }
}

// Ramps audio.volume (0-1) from wherever it is to `to` over FADE_MS - same
// step-interval shape as NowPlayingPlayer.tsx's fadeVolume, just on the
// standard HTMLMediaElement 0-1 range instead of YouTube's 0-100 setVolume.
function fadeTo(el: HTMLAudioElement, to: number, onDone?: () => void) {
  clearFade()
  const from = el.volume
  if (from === to) {
    onDone?.()
    return
  }
  let step = 0
  fadeTimer = setInterval(() => {
    step += 1
    const next = from + ((to - from) * step) / FADE_STEPS
    el.volume = Math.max(0, Math.min(1, next))
    if (step >= FADE_STEPS) {
      clearFade()
      onDone?.()
    }
  }, FADE_MS / FADE_STEPS)
}

function targetVolume(): number {
  return useMusicStore.getState().muted ? 0 : MAX_VOLUME
}

// Call synchronously from within a real user gesture (the Create Game /
// Join Game button handlers) so the shared <audio> element's first play()
// attempt counts as user-gesture-authorized - same reasoning as
// primeWinnerFanfare()/NowPlayingPlayer's autoplay handling elsewhere in
// this app. Harmless to call more than once. This is a best-effort nudge,
// not a guarantee: if the browser still blocks the real playback moments
// later in enterLobby() (a slow network, a strict autoplay policy), the
// music just doesn't start - a missing ambient loop is never worth an
// error state or a "tap to unmute" prompt the way the real game audio gets.
export function primeBackgroundMusic() {
  const el = getAudio()
  void el.play().catch(() => {})
}

// Picks a fresh random track (excluding whatever just played, when there's
// more than one to choose from - same "always visibly change something"
// rule already used for the category picker's Random button) and fades it
// in. The one explicit reshuffle moment the spec calls for - fired only
// when the room's phase transitions INTO 'lobby' (see useBackgroundMusic).
export async function enterLobby() {
  const pool = BACKGROUND_MUSIC_FILES.filter((f) => f !== currentFile)
  const candidates = pool.length > 0 ? pool : BACKGROUND_MUSIC_FILES
  const file = candidates[Math.floor(Math.random() * candidates.length)]
  if (!file) return
  try {
    const url = await loadUrl(file)
    currentFile = file
    const el = getAudio()
    el.src = url
    el.currentTime = 0
    if (!useMusicStore.getState().muted) {
      void el.play().catch(() => {})
    }
    fadeTo(el, targetVolume())
  } catch {
    // Storage fetch failed (rules not published yet, offline, etc.) -
    // background music is a nice-to-have flourish, never something that
    // should be able to break the actual game.
  }
}

// Fades the already-loaded track back in and resumes it, without picking a
// new one - used coming back from submit/guess or the winner reveal.
export function resumePlaying() {
  if (!currentFile || !audio) return
  if (!useMusicStore.getState().muted) void audio.play().catch(() => {})
  fadeTo(audio, targetVolume())
}

// Fades the currently loaded track out, then pauses it - used whenever a
// phase (or the winner reveal) says the music should stop, without
// forgetting where it was or picking a new track.
export function pausePlaying() {
  if (!currentFile || !audio) return
  fadeTo(audio, 0, () => audio?.pause())
}

// Thin, separately-named wrappers around the same pause/resume the phase
// watcher uses - called from WinnerRevealCard's own mount/cleanup effect,
// right alongside its existing playWinnerCheer()/stopCheer() calls, so the
// ambient loop never fights the cheer sound for the same moment.
export const pauseForWinnerReveal = pausePlaying
export const resumeAfterWinnerReveal = resumePlaying

// Called when roomCode becomes null (left the room back to the Home screen,
// which has no background music at all per the spec) so a stale loop can't
// keep playing somewhere it was never meant to be heard.
export function stopAndReset() {
  clearFade()
  if (audio) {
    audio.pause()
    audio.volume = 0
  }
  currentFile = null
}

// Subscribed once, at module load - toggling mute mid-track fades the
// CURRENTLY LOADED audio immediately, rather than waiting for the next
// phase change to notice muted has changed.
useMusicStore.subscribe((state) => {
  if (!audio || !currentFile) return
  if (state.muted) {
    fadeTo(audio, 0, () => audio?.pause())
  } else {
    void audio.play().catch(() => {})
    fadeTo(audio, MAX_VOLUME)
  }
})
