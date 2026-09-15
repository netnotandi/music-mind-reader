// Shown in place of a crashed screen (a render error Sentry's error
// boundary caught, see sentry.ts) - a blank white page with no explanation
// is the worst possible failure mode for a party game mid-round.
export function ErrorFallback() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg px-6 text-center text-text">
      <p className="text-lg font-semibold">Something went wrong.</p>
      <p className="text-sm text-text-secondary">
        Sorry about that - reloading the page usually fixes it.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="rounded-xl border border-primary bg-primary px-5 py-2.5 font-semibold text-text-on-primary"
      >
        Reload
      </button>
    </div>
  )
}
