import { useEffect, useRef, useState } from 'react'
import { loadYouTubeIframeApi } from '../logic/youtube'

interface NowPlayingPlayerProps {
  // The group's current song's video id, or null when it has no stored
  // video (a manual entry that failed to resolve, or a dev-autofilled song).
  videoId: string | null
}

const FADE_MS = 900
const FADE_STEPS = 18

// The host's Now Playing player. Uses the YouTube IFrame Player API (not a
// plain embed) so switching songs can crossfade the audio - fade the
// current song's volume to 0, load the next one, fade it back up - instead
// of a hard cut. A black overlay fades in step with the audio so the swap
// reads as intentional rather than a glitch.
export function NowPlayingPlayer({ videoId }: NowPlayingPlayerProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YT.Player | null>(null)
  const fadeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // What the player is actually playing right now - so the videoId-change
  // effect can tell a real group advance from an incidental re-render.
  const playingRef = useRef<string | null>(null)
  const [covered, setCovered] = useState(true)

  function clearFade() {
    if (fadeTimerRef.current !== null) {
      clearInterval(fadeTimerRef.current)
      fadeTimerRef.current = null
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
              setCovered(false)
            }
          },
          // YouTube tends to (re)mute a video it just started, especially
          // one swapped in via loadVideoById - unmute again once it's
          // actually playing so the fade-in is audible.
          onStateChange: (e) => {
            if (e.data === YTns.PlayerState.PLAYING) {
              try {
                e.target.unMute()
              } catch {
                // ignore
              }
            }
          },
        },
      })
    })

    return () => {
      cancelled = true
      clearFade()
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

    setCovered(true)
    fadeVolume(player, 0, () => {
      if (videoId) {
        try {
          player.loadVideoById(videoId)
          // loadVideoById fires ~a second after the tap, outside the user
          // gesture, so the browser's autoplay policy may mute it - the
          // volume ramp below is separate from mute state, so clear it.
          player.unMute()
        } catch {
          // ignore
        }
        fadeVolume(player, 100)
        setCovered(false)
      } else {
        try {
          player.stopVideo()
        } catch {
          // ignore
        }
        // leave the overlay up with the "no video" caption
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
        {videoId === null && <span className="text-xs text-slate-300">No video for this song</span>}
      </div>
    </div>
  )
}
