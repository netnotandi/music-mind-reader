import { useRef } from 'react'

const MIN_SWIPE_DISTANCE_PX = 50
// A swipe that drifts too far vertically is a scroll, not a left-right
// swipe intent - ignored rather than accidentally firing navigation.
const MAX_VERTICAL_DRIFT_PX = 60

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void
  onTouchEnd: (e: React.TouchEvent) => void
}

// Plain touch-event swipe detection (no library - matches the project's
// minimal-dependency approach) for card/song browsing on mobile. Swipe left
// = next (same direction as flipping through photos, matches the "Next ->"
// button), swipe right = previous. Purely additive - the existing Prev/Next
// buttons are untouched, this just gives touch users a second way to
// trigger the exact same callbacks, so any disabled/boundary logic already
// baked into onNext/onPrevious (e.g. clamping at the first/last card)
// applies here too for free.
export function useSwipeNavigation(onNext: () => void, onPrevious: () => void): SwipeHandlers {
  const startX = useRef(0)
  const startY = useRef(0)

  function onTouchStart(e: React.TouchEvent) {
    const touch = e.touches[0]
    startX.current = touch.clientX
    startY.current = touch.clientY
  }

  function onTouchEnd(e: React.TouchEvent) {
    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - startX.current
    const deltaY = touch.clientY - startY.current
    if (Math.abs(deltaX) < MIN_SWIPE_DISTANCE_PX || Math.abs(deltaY) > MAX_VERTICAL_DRIFT_PX) return
    if (deltaX < 0) onNext()
    else onPrevious()
  }

  return { onTouchStart, onTouchEnd }
}
