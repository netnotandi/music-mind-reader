// GoatCounter (see index.html's script tag) only counts raw page loads by
// default - since this is a single-page app that changes screens without
// reloading, that alone can't tell "someone opened the link and bounced"
// apart from "a group actually played a full round". These are lightweight
// custom events for the handful of moments that actually answer that,
// sent to the same GoatCounter site (no new external service, no new
// quota to run out of).
declare global {
  interface Window {
    goatcounter?: {
      count: (options: { path: string; title?: string; event?: boolean }) => void
    }
  }
}

export function trackEvent(name: string) {
  try {
    // Absent when the script is blocked (ad blockers, some privacy
    // extensions) or hasn't loaded yet - a missed event is fine, but
    // analytics must never be the thing that breaks the game.
    window.goatcounter?.count({ path: name, event: true })
  } catch {
    // ignore
  }
}
