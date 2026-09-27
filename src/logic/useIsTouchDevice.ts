import { useEffect, useState } from 'react'

const QUERY = '(pointer: coarse)'

// "Coarse pointer" (finger on a touchscreen) vs "fine pointer" (mouse/
// trackpad) - a much more reliable phone-vs-desktop signal than sniffing
// navigator.userAgent, which is easy for a browser to misreport (e.g. an
// iPad in "Request Desktop Site" mode) or simply spoof. Not infallible
// either (a touchscreen laptop, or a tablet with a mouse attached, can go
// either way), but accurate enough in practice for a UI-layout decision -
// which controls to show, never anything that affects game correctness.
function readIsTouch(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia(QUERY).matches
}

export function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(readIsTouch)

  useEffect(() => {
    const mql = window.matchMedia(QUERY)
    const handler = () => setIsTouch(mql.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  return isTouch
}
