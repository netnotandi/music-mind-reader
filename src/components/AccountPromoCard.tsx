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

function BarChartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M7 20V10M12 20V4M17 20v-7" />
    </svg>
  )
}

function PeopleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
      <circle cx="17" cy="7.5" r="2.5" />
      <path d="M15.3 14.7c2.7.4 4.7 2.3 4.7 5.3" />
    </svg>
  )
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 20.3s-7.2-4.5-9.4-8.9C1.3 8.3 2.5 5 5.8 4.5c2-.3 3.7.7 4.9 2.3 1.2-1.6 2.9-2.6 4.9-2.3 3.3.5 4.5 3.8 3.2 6.9-2.2 4.4-9.4 8.9-9.4 8.9z" />
    </svg>
  )
}

// Each row's icon reuses the same three brand hues the gradient elsewhere
// (button, wordmark) is built from - accentColors.ts already established
// cyan/violet/pink as this app's three-way accent split, just applied here
// per feature row instead of per award/category.
const FEATURES = [
  { Icon: BarChartIcon, label: 'Game history & stats' },
  { Icon: PeopleIcon, label: 'Friends & invitations' },
  { Icon: HeartIcon, label: 'Saved songs' },
] as const
const FEATURE_COLORS_DARK = ['text-cyan', 'text-violet', 'text-pink']
const FEATURE_COLORS_LIGHT = ['text-cyan-700', 'text-violet-700', 'text-pink-700']

// Purely a signed-out nudge - the actual sign-in/sign-up forms live in
// AccountPanel (inside the hamburger menu); this just opens straight to
// that same panel via uiStore, so there's only ever one copy of the forms.
export function AccountPromoCard() {
  const isLight = useThemeStore((s) => s.resolvedTheme === 'light')
  const status = useUserStore((s) => s.status)
  const requestMenuPanel = useUiStore((s) => s.requestMenuPanel)

  if (status !== 'signed-out') return null

  const featureColors = isLight ? FEATURE_COLORS_LIGHT : FEATURE_COLORS_DARK

  return (
    <div className="w-full max-w-sm text-center md:rounded-2xl md:border md:border-border md:bg-surface/60 md:p-6 md:backdrop-blur">
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

      <h3 className="mb-1 text-lg font-bold text-text">Your music. Your stats. Your friends.</h3>
      <p className={`mb-5 text-sm ${isLight ? 'text-text-secondary' : 'text-cyan'}`}>
        Create a free account to save your game history, track your awards and invite friends
        faster.
      </p>

      <ul className="mb-5 flex flex-col gap-3 text-left">
        {FEATURES.map(({ Icon, label }, i) => (
          <li key={label} className="flex items-center gap-3">
            <Icon className={`h-6 w-6 flex-shrink-0 ${featureColors[i]}`} />
            <span className="text-sm font-medium text-text">{label}</span>
          </li>
        ))}
      </ul>

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
