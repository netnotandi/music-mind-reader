import { useUiStore } from '../state/uiStore'
import { useThemeStore } from '../state/themeStore'
import { useUserStore } from '../state/userStore'

function PersonIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" />
    </svg>
  )
}

// Purely a signed-out nudge - the actual sign-in/sign-up forms live in
// AccountPanel (inside the hamburger menu); this just opens straight to
// that same panel via uiStore, so there's only ever one copy of the forms.
export function AccountPromoCard() {
  const isLight = useThemeStore((s) => s.resolvedTheme === 'light')
  const status = useUserStore((s) => s.status)
  const requestMenuPanel = useUiStore((s) => s.requestMenuPanel)

  if (status !== 'signed-out') return null

  return (
    <div className="w-full max-w-sm rounded-2xl border border-border bg-surface/60 p-6 text-center backdrop-blur">
      <div
        className={
          isLight
            ? 'mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full border-2 border-primary text-primary'
            : 'mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-gradient-to-r from-cyan via-violet to-pink p-[1.5px]'
        }
      >
        {isLight ? (
          <PersonIcon className="h-6 w-6" />
        ) : (
          <div className="grid h-full w-full place-items-center rounded-full bg-bg">
            <PersonIcon className="h-6 w-6 text-text" />
          </div>
        )}
      </div>

      <h3 className="mb-1 text-lg font-bold text-text">Save your name for next time</h3>
      <p className="mb-4 text-sm text-text-secondary">
        Create a free account so your name is remembered automatically. Friends, stats and saved
        songs are coming soon.
      </p>

      <button
        type="button"
        onClick={() => requestMenuPanel('account')}
        className={
          isLight
            ? 'w-full rounded-full border border-primary bg-primary px-5 py-3 text-sm font-bold text-text-on-primary transition hover:bg-primary-hover active:bg-primary-active'
            : 'w-full rounded-full bg-gradient-to-r from-cyan via-violet to-pink px-5 py-3 text-sm font-bold text-white transition hover:brightness-110'
        }
      >
        CREATE ACCOUNT
      </button>

      <button
        type="button"
        onClick={() => requestMenuPanel('account')}
        className="mt-3 text-sm text-text-secondary hover:text-text"
      >
        Already have an account? <span className={isLight ? 'text-primary' : 'text-cyan'}>Log in</span>
      </button>
    </div>
  )
}
