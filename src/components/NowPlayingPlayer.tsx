import { useEffect, useRef, useState } from 'react'
import { loadYouTubeIframeApi } from '../logic/youtube'

interface NowPlayingPlayerProps {
  // The group's current song's video id, or null when it has no stored
  // video (a manual entry that failed to resolve, or a dev-autofilled song)
  // or the round has played through every song (wrapUp).
  videoId: string | null
  // Short mode: fire onCap once this many seconds of the current video have
  // played. null in long mode / wrap-up / on a follower device.
  capSeconds: number | null
  // The current video reached capSeconds of playback (short-mode time cap).
  onCap: () => void
  // The current video reached its natural end.
  onEnded: () => void
  // The round's music has finished - show "all songs played", not a player.
  wrapUp: boolean
  // This device isn't the host. Everyone sees the video (so people playing
  // remotely can follow along), but a follower starts MUTED - a room full
  // of phones shouldn't all blast overlapping audio - and can unmute to
  // hear it themselves.
  follower: boolean
}

const FADE_MS = 900
const FADE_STEPS = 18
const VOLUME_STORAGE_KEY = 'mmr-player-volume'
const SOUND_ON_STORAGE_KEY = 'mmr-player-sound-on'

function readStoredVolume(): number {
  try {
    const raw = localStorage.getItem(VOLUME_STORAGE_KEY)
    if (raw !== null) {
      const v = Number(raw)
      if (Number.isFinite(v) && v >= 0 && v <= 100) return v
    }
  } catch {
    // no storage - fall through
  }
  return 100
}

// The Now Playing player. Uses the YouTube IFrame Player API (not a plain
// embed) so switching songs can crossfade the audio, and so playback time /
// the ENDED event can drive automatic song progression (host only). A black
// overlay fades in step with the audio so the swap reads as intentional.
// Every device renders one; only the host's drives progression and plays
// with sound by default.
export function NowPlayingPlayer({
  videoId,
  capSeconds,
  onCap,
  onEnded,
  wrapUp,
  follower,
}: NowPlayingPlayerProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YT.Player | null>(null)
  const fadeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // What the player is actually playing right now - so the videoId-change
  // effect can tell a real group advance from an incidental re-render.
  const playingRef = useRef<string | null>(null)
  // Latches so onCap / onEnded fire at most once per video.
  const capFiredRef = useRef(false)
  const endedFiredRef = useRef(false)
  // Set right before a new video loads; consumed on the next PLAYING event
  // to apply the wanted audio state to the freshly-started video.
  const pendingAudioRef = useRef(false)
  // Kept in refs so the persistent player callbacks always see the latest.
  const capSecondsRef = useRef(capSeconds)
  const onCapRef = useRef(onCap)
  const onEndedRef = useRef(onEnded)
  capSecondsRef.current = capSeconds
  onCapRef.current = onCap
  onEndedRef.current = onEnded

  const [covered, setCovered] = useState(true)
  const [volume, setVolumeState] = useState(readStoredVolume)
  // Does this device want to hear the music? The host does by default; a
  // follower doesn't until they turn it on (remembered per device).
  const [soundOn, setSoundOn] = useState(() => {
    if (!follower) return true
    try {
      return localStorage.getItem(SOUND_ON_STORAGE_KEY) === '1'
    } catch {
      return false
    }
  })
  // A browser can refuse to unmute media that started without a fresh user
  // gesture (every song after the first auto-advances with no click). When
  // we detect that, this shows a one-tap unmute button over the player.
  const [audioBlocked, setAudioBlocked] = useState(false)
  const volumeRef = useRef(volume)
  const soundOnRef = useRef(soundOn)
  volumeRef.current = volume
  soundOnRef.current = soundOn

  function clearFade() {
    if (fadeTimerRef.current !== null) {
      clearInterval(fadeTimerRef.current)
      fadeTimerRef.current = null
    }
  }
  function clearPoll() {
    if (pollTimerRef.current !== null) {
      clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }
  }

  // Ramp the player volume from where it is to `to` over FADE_MS. Used for
  // the fade-OUT before a song swap; the fade-IN is handled on the PLAYING
  // event instead, where setVolume calls aren't swallowed by a player that
  // is still buffering the new video.
  function fadeVolume(player: YT.Player, to: number, onDone?: () => void) {
    clearFade()
    let from = to
    try {
      from = player.getVolume()
    } catch {
      // player not ready / already gone - jump straight to the target
    }
    let step = 0
    fadeTimerRef.current = setInterval(() => {
      step += 1
      const next = Math.round(from + ((to - from) * step) / FADE_STEPS)
      try {
        player.setVolume(Math.max(0, Math.min(100, next)))
      } catch {
        clearFade()
        return
      }
      if (step >= FADE_STEPS) {
        clearFade()
        onDone?.()
      }
    }, FADE_MS / FADE_STEPS)
  }

  // Apply this device's wanted audio state to a video that just started.
  // Sound wanted -> unmute + fade up, then double-check the browser didn't
  // silently keep it muted (no user gesture) and surface tap-to-unmute if
  // so. Sound not wanted -> keep it muted, but pre-set the volume so it's
  // audible the instant they do unmute.
  function applyAudioOnPlaying(player: YT.Player) {
    if (soundOnRef.current) {
      try {
        player.unMute()
        player.setVolume(0)
      } catch {
        // ignore
      }
      fadeVolume(player, volumeRef.current)
      setAudioBlocked(false)
      window.setTimeout(() => {
        try {
          if (player.isMuted()) {
            player.unMute()
            player.setVolume(volumeRef.current)
            if (player.isMuted()) setAudioBlocked(true)
          }
        } catch {
          // player gone - nothing to do
        }
      }, 700)
    } else {
      try {
        player.mute()
        player.setVolume(volumeRef.current)
      } catch {
        // ignore
      }
    }
  }

  // Poll playback position while a video is playing; fire the short-mode
  // time cap once it's crossed (host only - a follower gets capSeconds
  // null and this no-ops).
  function startPoll(player: YT.Player) {
    clearPoll()
    if (capSecondsRef.current === null) return
    pollTimerRef.current = setInterval(() => {
      let t = 0
      try {
        t = player.getCurrentTime()
      } catch {
        return
      }
      const cap = capSecondsRef.current
      if (!capFiredRef.current && cap !== null && t >= cap) {
        capFiredRef.current = true
        onCapRef.current()
      }
    }, 1000)
  }

  // Create the player once. The div YouTube replaces with its iframe is
  // created imperatively and lives inside wrapperRef, so React never tries
  // to reconcile (or removeChild) a node the API has taken over.
  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return
    let cancelled = false
    let player: YT.Player | null = null

    const host = document.createElement('div')
    host.style.width = '100%'
    host.style.height = '100%'
    wrapper.appendChild(host)

    loadYouTubeIframeApi().then((YTns) => {
      if (cancelled) return
      player = new YTns.Player(host, {
        videoId: videoId ?? undefined,
        playerVars: {
          autoplay: 1,
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
          // A follower device often reaches this screen with no user
          // gesture at all (the phase change is pushed from Firebase), so
          // start muted - muted autoplay is always allowed - and let them
          // unmute.
          ...(follower ? { mute: 1 } : {}),
        },
        events: {
          onReady: () => {
            if (cancelled || !player) return
            playerRef.current = player
            playingRef.current = videoId
            try {
              if (soundOnRef.current) {
                player.unMute()
              } else {
                player.mute()
                // a gesture-less muted load can land paused - nudge it
                player.playVideo()
              }
            } catch {
              // ignore
            }
            if (import.meta.env.DEV) {
              ;(window as unknown as { __mmrPlayer?: YT.Player }).__mmrPlayer = player
            }
            if (videoId) {
              pendingAudioRef.current = true
              startPoll(player)
              setCovered(false)
            }
          },
          onStateChange: (e) => {
            if (e.data === YTns.PlayerState.PLAYING) {
              if (pendingAudioRef.current) {
                pendingAudioRef.current = false
                applyAudioOnPlaying(e.target)
              } else if (soundOnRef.current) {
                // resumed after a pause - keep it audible
                try {
                  e.target.unMute()
                } catch {
                  // ignore
                }
              }
            }
            if (e.data === YTns.PlayerState.ENDED && !endedFiredRef.current) {
              endedFiredRef.current = true
              onEndedRef.current()
            }
          },
        },
      })
    })

    return () => {
      cancelled = true
      clearFade()
      clearPoll()
      try {
        player?.destroy()
      } catch {
        // ignore
      }
      player = null
      playerRef.current = null
      wrapper.replaceChildren()
    }
    // Created once; song changes are handled by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // If capSeconds turns up on a device that wasn't polling yet - a follower
  // who just got promoted to host mid-song (host succession reassigns
  // hostId without the song itself changing) - start polling the song
  // that's already playing right away, instead of only noticing on the
  // NEXT song change. Without this, that one song would quietly run to a
  // natural end (or forever) even though the group is meant to be in short
  // mode, because startPoll had already returned early (capSeconds was
  // still null) back when this song's crossfade effect first ran it.
  // Re-running on a null capSeconds is harmless too - startPoll always
  // clears any existing interval first.
  useEffect(() => {
    const player = playerRef.current
    if (!player) return
    startPoll(player)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capSeconds])

  // Crossfade whenever the group's current song actually changes.
  useEffect(() => {
    const player = playerRef.current
    if (!player) return
    if (videoId === playingRef.current) return
    playingRef.current = videoId
    capFiredRef.current = false
    endedFiredRef.current = false

    setCovered(true)
    fadeVolume(player, 0, () => {
      if (videoId) {
        pendingAudioRef.current = true
        try {
          player.setVolume(0)
          player.loadVideoById(videoId)
        } catch {
          // ignore
        }
        startPoll(player)
        setCovered(false)
        // A gesture-less load can land paused on some browsers - nudge it.
        window.setTimeout(() => {
          try {
            const state = player.getPlayerState()
            if (state !== 1 && state !== 3) player.playVideo()
          } catch {
            // player gone
          }
        }, 1200)
      } else {
        clearPoll()
        try {
          player.stopVideo()
        } catch {
          // ignore
        }
        // leave the overlay up with its caption
      }
    })
  }, [videoId])

  function persistSoundOn(on: boolean) {
    try {
      localStorage.setItem(SOUND_ON_STORAGE_KEY, on ? '1' : '0')
    } catch {
      // no storage - still applies for this session
    }
  }

  // Toggling / dragging volume is a user gesture, so it's also the moment a
  // browser-blocked unmute becomes allowed.
  function setSound(on: boolean) {
    setSoundOn(on)
    soundOnRef.current = on
    persistSoundOn(on)
    const player = playerRef.current
    if (!player) return
    try {
      if (on) {
        player.unMute()
        player.setVolume(volumeRef.current || 100)
      } else {
        player.mute()
      }
    } catch {
      // ignore
    }
    setAudioBlocked(false)
  }

  function handleVolumeChange(next: number) {
    setVolumeState(next)
    volumeRef.current = next
    try {
      localStorage.setItem(VOLUME_STORAGE_KEY, String(next))
    } catch {
      // no storage - still applies for this session
    }
    const player = playerRef.current
    if (!player) return
    try {
      player.setVolume(next)
      if (soundOnRef.current) player.unMute()
    } catch {
      // ignore
    }
  }

  const showControls = videoId !== null && !wrapUp

  return (
    <div className="mb-6">
      <div className="relative aspect-video overflow-hidden rounded-xl border border-border">
        <div ref={wrapperRef} className="absolute inset-0" />
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black"
          style={{ opacity: covered ? 1 : 0, transition: `opacity ${FADE_MS}ms ease` }}
        >
          {wrapUp ? (
            <span className="text-xs text-slate-300">All songs played</span>
          ) : videoId === null ? (
            <span className="text-xs text-slate-300">No video for this song</span>
          ) : null}
        </div>
        {showControls && soundOn && audioBlocked && !covered && (
          <button
            type="button"
            onClick={() => setSound(true)}
            className="absolute inset-x-0 bottom-0 bg-black/75 px-3 py-2 text-center text-xs font-semibold text-white"
          >
            🔇 Sound is muted — tap to unmute
          </button>
        )}
      </div>

      {showControls &&
        (soundOn ? (
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSound(false)}
              aria-label="Mute"
              className="text-sm text-text-muted transition hover:text-text"
            >
              🔊
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              aria-label="Player volume"
              className="h-1 flex-1 accent-primary"
            />
            <span className="w-8 text-right text-xs tabular-nums text-text-muted">{volume}</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setSound(true)}
            className="mt-2 w-full rounded-lg border border-primary bg-primary-soft px-4 py-2 text-sm font-semibold text-primary transition hover:border-primary"
          >
            🔇 Unmute to hear the music
          </button>
        ))}
    </div>
  )
}
