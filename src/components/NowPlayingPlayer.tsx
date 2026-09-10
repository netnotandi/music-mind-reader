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

  function fadeVolume(player: YT.Player, to: number, onDone?: () => void) {
    clearFade()
    let from = 100
    try {
      from = player.getVolume()
    } catch {
      // player not ready / already gone - fall back to a full-range fade
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

  // Poll playback position while a video is playing; fire the short-mode
  // time cap once it's crossed.
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
            try {
              player.setVolume(0)
              player.unMute()
            } catch {
              // ignore
            }
            if (videoId) {
              fadeVolume(player, 100)
              startPoll(player)
              setCovered(false)
            }
          },
          onStateChange: (e) => {
            if (e.data === YTns.PlayerState.PLAYING) {
              // YouTube tends to (re)mute a video it just started.
              try {
                e.target.unMute()
              } catch {
                // ignore
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
        try {
          player.loadVideoById(videoId)
          player.unMute()
        } catch {
          // ignore
        }
        fadeVolume(player, 100)
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

  return (
    <div className="relative mb-6 aspect-video overflow-hidden rounded-xl border border-border">
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
    </div>
  )
}
