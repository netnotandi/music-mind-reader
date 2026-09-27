import { useEffect, useLayoutEffect, useRef, useState } from 'react'

interface SwipeCarouselProps {
  canGoPrev: boolean
  canGoNext: boolean
  onCommitPrev: () => void
  onCommitNext: () => void
  renderPrev: () => React.ReactNode
  renderCurrent: () => React.ReactNode
  renderNext: () => React.ReactNode
}

const MIN_SWIPE_DISTANCE_PX = 50
// Small dead zone before committing to horizontal-vs-vertical, so an
// intentional swipe isn't misread as a scroll (or vice versa) from its very
// first pixel of movement.
const AXIS_LOCK_THRESHOLD_PX = 10
// A drag past a boundary (no prev/next to go to) still moves a little, so it
// doesn't feel like the touch was simply ignored - but heavily damped, and
// renderPrev/renderNext are never called in that direction (see the render
// below), so there's nothing real to peek at, just the current card giving
// a little.
const BLOCKED_RESISTANCE = 0.3
const SNAP_TRANSITION_MS = 220
const SNAP_TRANSITION = `transform ${SNAP_TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`

// Drag-to-swipe card stack: renders the previous/current/next item side by
// side in a 3-wide track and follows the finger 1:1 while dragging, so the
// neighbor peeks into view immediately instead of only reacting once the
// finger lifts (see CLAUDE.md's swipe section - the original threshold-only
// version worked, but felt abrupt in real use on a phone, per the host).
// On release: past the distance threshold, the CSS transition finishes the
// slide the rest of the way, and only once THAT settles does the index
// actually change (handleTransitionEnd) - so the swapped-in content is
// already sitting in the right place with no flash. Short of the
// threshold, it springs back to center and nothing changes.
export function SwipeCarousel({
  canGoPrev,
  canGoNext,
  onCommitPrev,
  onCommitNext,
  renderPrev,
  renderCurrent,
  renderNext,
}: SwipeCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [dragPx, setDragPx] = useState(0)
  const [settling, setSettling] = useState(false)
  const startRef = useRef({ x: 0, y: 0 })
  const axisRef = useRef<'undecided' | 'horizontal' | 'vertical'>('undecided')
  const draggingRef = useRef(false)
  const pendingCommitRef = useRef<'prev' | 'next' | null>(null)
  // transitionend has been observed (live, in this exact bounce-back-to-
  // the-same-value scenario) to sometimes never fire - most likely the
  // browser deciding no visually distinct transition actually needs to run
  // and skipping it silently. Relying on it alone left onTouchStart's
  // `if (settling) return` guard stuck forever after one such drag, so a
  // timeout mirroring the CSS duration resolves things either way -
  // whichever fires first wins, guarded by settledRef so it only runs once.
  const settleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const settledRef = useRef(true)

  // Measured synchronously (not just via ResizeObserver's own callback,
  // which fires asynchronously even for its initial observation) so the
  // very first paint already uses the real width - otherwise the track
  // would flash showing the prev slot for one frame before catching up.
  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    setWidth(el.getBoundingClientRect().width)
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width
      if (w !== undefined) setWidth(w)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    return () => {
      if (settleTimeoutRef.current !== null) clearTimeout(settleTimeoutRef.current)
    }
  }, [])

  function resolveSettle() {
    if (settledRef.current) return
    settledRef.current = true
    if (settleTimeoutRef.current !== null) {
      clearTimeout(settleTimeoutRef.current)
      settleTimeoutRef.current = null
    }
    const commit = pendingCommitRef.current
    pendingCommitRef.current = null
    setSettling(false)
    setDragPx(0)
    if (commit === 'next') onCommitNext()
    else if (commit === 'prev') onCommitPrev()
  }

  function onTouchStart(e: React.TouchEvent) {
    if (!settledRef.current) return
    const t = e.touches[0]
    startRef.current = { x: t.clientX, y: t.clientY }
    axisRef.current = 'undecided'
    draggingRef.current = true
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!draggingRef.current) return
    const t = e.touches[0]
    const dx = t.clientX - startRef.current.x
    const dy = t.clientY - startRef.current.y
    if (axisRef.current === 'undecided') {
      if (Math.abs(dx) < AXIS_LOCK_THRESHOLD_PX && Math.abs(dy) < AXIS_LOCK_THRESHOLD_PX) return
      axisRef.current = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical'
      if (axisRef.current === 'vertical') {
        // Let the page scroll instead - don't fight a vertical gesture.
        draggingRef.current = false
        return
      }
    }
    e.preventDefault()
    let next = dx
    if (dx > 0) next = canGoPrev ? Math.min(dx, width) : Math.min(dx * BLOCKED_RESISTANCE, width * 0.4)
    else if (dx < 0) next = canGoNext ? Math.max(dx, -width) : Math.max(dx * BLOCKED_RESISTANCE, -width * 0.4)
    setDragPx(next)
  }

  function onTouchEnd() {
    if (!draggingRef.current) return
    draggingRef.current = false
    if (axisRef.current !== 'horizontal') {
      setDragPx(0)
      return
    }
    const passedThreshold = Math.abs(dragPx) >= MIN_SWIPE_DISTANCE_PX
    let target = 0
    let commit: 'prev' | 'next' | null = null
    if (passedThreshold && dragPx < 0 && canGoNext) {
      target = -width
      commit = 'next'
    } else if (passedThreshold && dragPx > 0 && canGoPrev) {
      target = width
      commit = 'prev'
    }
    if (dragPx === target) {
      // Nothing to animate (e.g. a tap with no real movement) - resolve
      // immediately rather than waiting on a transitionend that won't fire.
      setDragPx(0)
      if (commit === 'next') onCommitNext()
      else if (commit === 'prev') onCommitPrev()
      return
    }
    pendingCommitRef.current = commit
    settledRef.current = false
    setSettling(true)
    setDragPx(target)
    if (settleTimeoutRef.current !== null) clearTimeout(settleTimeoutRef.current)
    settleTimeoutRef.current = setTimeout(resolveSettle, SNAP_TRANSITION_MS + 60)
  }

  function handleTransitionEnd(e: React.TransitionEvent) {
    if (e.target !== e.currentTarget || e.propertyName !== 'transform') return
    resolveSettle()
  }

  return (
    <div
      ref={containerRef}
      className="overflow-hidden"
      style={{ touchAction: 'pan-y' }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div
        onTransitionEnd={handleTransitionEnd}
        style={{
          display: 'flex',
          transform: `translateX(${-width + dragPx}px)`,
          transition: settling ? SNAP_TRANSITION : 'none',
        }}
      >
        <div style={{ flex: '0 0 100%', minWidth: 0 }}>{canGoPrev ? renderPrev() : null}</div>
        <div style={{ flex: '0 0 100%', minWidth: 0 }}>{renderCurrent()}</div>
        <div style={{ flex: '0 0 100%', minWidth: 0 }}>{canGoNext ? renderNext() : null}</div>
      </div>
    </div>
  )
}
