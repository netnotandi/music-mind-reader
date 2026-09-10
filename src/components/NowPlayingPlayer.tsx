import { useEffect, useRef, useState } from 'react'
import { loadYouTubeIframeApi } from '../logic/youtube'

interface NowPlayingPlayerProps {
  // The group's current song's video id, or null when it has no stored
  // video (a manual entry that failed to resolve, or a dev-autofilled song)
  // or the round has played through every song (wrapUp).
  videoId: string | null
  // Short mode: fire onCap once this many seconds of the current video have
  // played. null in long mode / wrap-up.
  capSeconds: number | null
  // The current video reached capSeconds of playback (short-mode time cap).
  onCap: () => void
  // Short mode: fire onFloor once this many seconds of the current video
  // have played - the earliest point "everyone answered" may advance it.
  // null in long mode / wrap-up.
  floorSeconds: number | null
  // The current video reached floorSeconds of playback.
  onFloor: () => void
  // The current video reached its natural end.
  onEnded: () => void
  // The round's music has finished - show "all songs played", not a player.
  wrapUp: boolean
}

const FADE_MS = 900
const FADE_STEPS = 18
const VOLUME_STORAGE_KEY = 'mmr-player-volume'

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

// The host's Now Playing player. Uses the YouTube IFrame Player API (not a
// plain embed) so switching songs can crossfade the audio, and so playback
// time / the ENDED event can drive automatic song progression. A black
// overlay fades in step with the audio so the swap reads as intentional.
export function NowPlayingPlayer({
  videoId,
  capSeconds,
  onCap,
  floorSeconds,
  onFloor,
  onEnded,
  wrapUp,
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
  const floorFiredRef = useRef(false)
  const endedFiredRef = useRef(false)
  // Set right before a new video loads; consumed on the next PLAYING event
  // to force the freshly-started video audible (see restoreAudio).
  const wantAudioRef = useRef(false)
  // Kept in refs so the persistent player callbacks always see the latest.
  const capSecondsRef = useRef(capSeconds)
  const onCapRef = useRef(onCap)
  const floorSecondsRef = useRef(floorSeconds)
  const onFloorRef = useRef(onFloor)
  const onEndedRef = useRef(onEnded)
  capSecondsRef.current = capSeconds
  onCapRef.current = onCap
  floorSecondsRef.current = floorSeconds
  onFloorRef.current = onFloor
  onEndedRef.current = onEnded

  const [covered, setCovered] = useState(true)
  const [volume, setVolumeState] = useState(readStoredVolume)
  // A browser can refuse to unmute media that started without a fresh user
  // gesture (every song after the first auto-advances with no click). When
  // we detect that, this shows a one-tap unmute button over the player.
  const [audioBlocked, setAudioBlocked] = useState(false)
  const volumeRef = useRef(volume)
  volumeRef.current = volume

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

  // Bring the freshly-started video up to the host's volume (a short
  // fade-in), then double-check a moment later: if the browser kept it
  // muted because there was no user gesture, surface the tap-to-unmute
  // button.
  function restoreAudio(player: YT.Player) {
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
  }

  // Poll playback position while a video is playing; fire the short-mode
  // time floor / cap once they're crossed.
  function startPoll(player: YT.Player) {
    clearPoll()
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
      const floor = floorSecondsRef.current
      if (!floorFiredRef.current && floor !== null && t >= floor) {
        floorFiredRef.current = true
        onFloorRef.current()
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
        playerVars: { autoplay: 1, playsinline: 1, rel: 0, modestbranding: 1 },
        events: {
          onReady: () => {
            if (cancelled || !player) return
            playerRef.current = player
            playingRef.current = videoId
            if (import.meta.env.DEV) {
              ;(window as unknown as { __mmrPlayer?: YT.Player }).__mmrPlayer = player
            }
            if (videoId) {
              wantAudioRef.current = true
              startPoll(player)
              setCovered(false)
            }
          },
          onStateChange: (e) => {
            if (e.data === YTns.PlayerState.PLAYING) {
              if (wantAudioRef.current) {
                wantAudioRef.current = false
                restoreAudio(e.target)
              } else {
                // resumed after a pause - just make sure it isn't muted
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

  // Crossfade whenever the group's current song actually changes.
  useEffect(() => {
    const player = playerRef.current
    if (!player) return
    if (videoId === playingRef.current) return
    playingRef.current = videoId
    capFiredRef.current = false
    floorFiredRef.current = false
    endedFiredRef.current = false

    setCovered(true)
    fadeVolume(player, 0, () => {
      if (videoId) {
        wantAudioRef.current = true
        try {
          player.setVolume(0)
          player.loadVideoById(videoId)
        } catch {
          // ignore
        }
        startPoll(player)
        setCovered(false)
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

  // Host dragged the volume slider - a user gesture, so this is also the
  // moment a blocked unmute becomes allowed.
  function handleVolumeChange(next: number) {
    setVolumeState(next)
    try {
      localStorage.setItem(VOLUME_STORAGE_KEY, String(next))
    } catch {
      // no storage - the value still applies for this session
    }
    const player = playerRef.current
    if (!player) return
    try {
      player.unMute()
      player.setVolume(next)
    } catch {
      // ignore
    }
    setAudioBlocked(false)
  }

  function forceUnmute() {
    const player = playerRef.current
    if (!player) return
    try {
      player.unMute()
      player.setVolume(volumeRef.current || 100)
    } catch {
      // ignore
    }
    setAudioBlocked(false)
  }

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
        {audioBlocked && !covered && videoId !== null && !wrapUp && (
          <button
            type="button"
            onClick={forceUnmute}
            className="absolute inset-x-0 bottom-0 bg-black/75 px-3 py-2 text-center text-xs font-semibold text-white"
          >
            🔇 Sound is muted — tap to unmute
          </button>
        )}
      </div>

      {videoId !== null && !wrapUp && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-text-muted">Vol</span>
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
      )}
    </div>
  )
}
