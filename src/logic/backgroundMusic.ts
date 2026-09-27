// Loops ambient background music during the low-stakes waiting screens
// (Lobby, Game Setup, Results) and stays silent while a song is actually
// playing or being judged (Submit, Guess) - see useBackgroundMusic in
// App.tsx, which drives every function here off the room's phase. The
// tracks themselves are host-uploaded mp3s in Firebase Storage (not
// public/, unlike winnerFanfare.ts's sound effects - see CLAUDE.md's
// "Bakgrunnshljóð eftir fösum leiksins" section for why: RTDB doesn't suit
// binary files, and Storage is a separate service within the same project).
//
// Two separate pools, in two Storage folders: Lobby/ (used for the
// lobby/setup group) and Scorboard/ (sic - matches the host's actual folder
// name in Storage; used for the results/scoreboard group) - picking a fresh
// track happens whenever the active group changes, not on every phase
// change within the same group (see useBackgroundMusic in App.tsx).
import { getDownloadURL, ref } from 'firebase/storage'
import { storage } from '../firebase'
import { useMusicStore } from '../state/musicStore'

// Hand-listed, same reasoning as winnerFanfare.ts's WINNER_SOUND_FILES -
// Storage has no trivial client-side directory listing without extra rules
// complexity, so this just has to be kept in sync by hand with whatever's
// actually in the bucket.
const LOBBY_MUSIC_FILES = [
  'Lobby/the_mountain-retro-game-593063.mp3',
  'Lobby/trtasfiq-upbeat-background-music-212772.mp3',
  'Lobby/tunetank-upbeat-funk-background-347615.mp3',
]
const SCOREBOARD_MUSIC_FILES = [
  'Scorboard/gr0za-upbeat-upbeat-music-596488.mp3',
  'Scorboard/sonican-quiz-background-loop-thinking-news-275636.mp3',
]
const ALL_MUSIC_FILES = [...LOBBY_MUSIC_FILES, ...SCOREBOARD_MUSIC_FILES]

const FADE_MS = 1000
const FADE_STEPS = 20
// Truly ambient - meant to sit under the room's own conversation without
// anyone consciously noticing it's there, not a "second song" competing
// for attention. Lowered five times after live listens: full volume ->
// 0.35 ("way too loud") -> 0.12 -> 0.1 -> 0.08 -> here.
const MAX_VOLUME = 0.06
// Per-track adjustment relative to MAX_VOLUME - the source files come from
// different Pixabay artists and aren't loudness-normalized against each
// other, so the same MAX_VOLUME setting doesn't read as equally loud
// across all of them. 1 = no adjustment; only listed here once a track's
// been flagged as off after a live listen.
const VOLUME_MULTIPLIER: Partial<Record<string, number>> = {
  'Lobby/the_mountain-retro-game-593063.mp3': 0.5,
}

let audio: HTMLAudioElement | null = null
let fadeTimer: ReturnType<typeof setInterval> | null = null
// The file currently loaded into `audio` (paused or playing) - null before
// the first enterLobby() call, or after stopAndReset(). Distinct from
// whether it's actually audible right now (that's audio.paused/volume).
let currentFile: string | null = null

// Independent reasons the music should be silent right now - the phase
// (submit/guess), the Winner-reveal card being up, and the hamburger menu
// being open can all overlap (e.g. opening the menu mid-submit), so this is
// a set rather than a single flag: music only actually plays once EVERY
// reason has cleared, and closing the menu during a silent phase correctly
// leaves it silent instead of forcing playback back on.
type SilenceReason = 'phase' | 'winnerReveal' | 'menu'
const silenceReasons = new Set<SilenceReason>()

function setSilenceReason(reason: SilenceReason, silenced: boolean) {
  if (silenced) silenceReasons.add(reason)
  else silenceReasons.delete(reason)
  applyPlaybackState()
}

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
for (const file of ALL_MUSIC_FILES) {
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
  if (useMusicStore.getState().muted) return 0
  const multiplier = (currentFile !== null ? VOLUME_MULTIPLIER[currentFile] : undefined) ?? 1
  return MAX_VOLUME * multiplier
}

// The single place that decides whether the currently-loaded track should
// actually be audible right now, and fades it there - called after every
// change to silenceReasons, the mute store, or a freshly loaded track
// (pickAndPlay). Never picks a new track itself.
function applyPlaybackState() {
  if (!audio || !currentFile) return
  if (silenceReasons.size > 0 || useMusicStore.getState().muted) {
    fadeTo(audio, 0, () => audio?.pause())
  } else {
    void audio.play().catch(() => {})
    fadeTo(audio, targetVolume())
  }
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

// Picks a fresh random track from `files` (excluding whatever just played,
// when there's more than one to choose from - same "always visibly change
// something" rule already used for the category picker's Random button) and
// fades it in. Shared by enterLobby()/enterScoreboard() below - the one
// explicit reshuffle moment the spec calls for, fired whenever the active
// pool GROUP changes (lobby/setup <-> results), not on every phase change
// within the same group (see useBackgroundMusic in App.tsx).
async function pickAndPlay(files: string[]) {
  const pool = files.filter((f) => f !== currentFile)
  const candidates = pool.length > 0 ? pool : files
  const file = candidates[Math.floor(Math.random() * candidates.length)]
  if (!file) return
  try {
    const url = await loadUrl(file)
    currentFile = file
    const el = getAudio()
    el.src = url
    el.currentTime = 0
    el.volume = 0
    // Respects any active silence reason (e.g. the menu happening to be
    // open at the exact moment the pool group changes) rather than always
    // playing - applyPlaybackState() is the one place that decides that.
    applyPlaybackState()
  } catch {
    // Storage fetch failed (rules not published yet, offline, etc.) -
    // background music is a nice-to-have flourish, never something that
    // should be able to break the actual game.
  }
}

export function enterLobby(): Promise<void> {
  return pickAndPlay(LOBBY_MUSIC_FILES)
}

export function enterScoreboard(): Promise<void> {
  return pickAndPlay(SCOREBOARD_MUSIC_FILES)
}

// Fades the already-loaded track in/out without picking a new one - used by
// useBackgroundMusic (App.tsx) for the submit/guess <-> lobby/setup/results
// silence, driven by the room's phase.
export function resumePlaying() {
  setSilenceReason('phase', false)
}
export function pausePlaying() {
  setSilenceReason('phase', true)
}

// Called from WinnerRevealCard's own mount/cleanup effect, right alongside
// its existing playWinnerCheer()/stopCheer() calls, so the ambient loop
// never fights the cheer sound for the same moment - independent of the
// phase reason above (phase stays 'results' the whole time the card is up).
export function pauseForWinnerReveal() {
  setSilenceReason('winnerReveal', true)
}
export function resumeAfterWinnerReveal() {
  setSilenceReason('winnerReveal', false)
}

// Called when the hamburger menu opens/closes (MenuOverlay.tsx) - ducks the
// ambient loop while the menu is up, independent of whatever phase/reveal
// reason is (or isn't) already active, so closing the menu during a
// silent phase correctly leaves the music off instead of forcing it back on.
export function setMenuOpen(open: boolean) {
  setSilenceReason('menu', open)
}

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
  // A leftover reason (e.g. left the room with the menu still open) must
  // not carry over and silence a future room's music for no visible cause.
  silenceReasons.clear()
}

// Subscribed once, at module load - toggling mute mid-track fades the
// CURRENTLY LOADED audio immediately, rather than waiting for the next
// phase change to notice muted has changed.
useMusicStore.subscribe(() => {
  applyPlaybackState()
})
