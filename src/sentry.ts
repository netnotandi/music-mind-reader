import * as Sentry from '@sentry/react'

const DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined

// Same pattern as youtube.ts's API_KEY guard: quietly does nothing rather
// than crashing when the DSN isn't set (local dev, or before the secret is
// added to GitHub Actions) - error reporting just won't fire.
//
// Deliberately error-tracking only, no Session Replay and a near-zero
// traces sample rate - this app has already been bitten once tonight by a
// free-tier quota running out under real play (YouTube search), so this
// starts conservative rather than opting into Sentry's own quota-limited
// features by default.
export function initSentry() {
  if (!DSN) return
  Sentry.init({
    dsn: DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0,
  })
}

export const SentryErrorBoundary = Sentry.ErrorBoundary
