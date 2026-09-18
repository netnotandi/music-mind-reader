import { useState } from 'react'
import { MyListsPanel } from './MyListsPanel'
import { MAX_NAME_LENGTH } from '../state/gameStore'
import { auth } from '../firebase'
import { useUserStore } from '../state/userStore'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 flex-shrink-0">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.11A11.99 11.99 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28V6.61H1.27A11.99 11.99 0 0 0 0 12c0 1.94.46 3.77 1.27 5.39l4-3.11Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.45-3.45C17.95 1.19 15.23 0 12 0 7.31 0 3.26 2.69 1.27 6.61l4 3.11C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  )
}

const inputClasses =
  'w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm text-text placeholder:text-placeholder focus:border-primary focus:outline-none'

function Divider() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-divider" />
      <span className="text-xs font-medium text-text-muted">OR</span>
      <div className="h-px flex-1 bg-divider" />
    </div>
  )
}

function SignedOutView() {
  const busy = useUserStore((s) => s.busy)
  const error = useUserStore((s) => s.error)
  const resetSent = useUserStore((s) => s.resetSent)
  const signInWithGoogle = useUserStore((s) => s.signInWithGoogle)
  const signInWithEmail = useUserStore((s) => s.signInWithEmail)
  const signUpWithEmail = useUserStore((s) => s.signUpWithEmail)
  const sendResetEmail = useUserStore((s) => s.sendResetEmail)
  const clearError = useUserStore((s) => s.clearError)

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function toggleMode() {
    setMode((m) => (m === 'signin' ? 'signup' : 'signin'))
    clearError()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (mode === 'signin') signInWithEmail(email, password)
    else signUpWithEmail(email, password)
  }

  return (
    <div>
      <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-success">Account</h3>
      <p className="mb-3 text-xs text-text-muted">
        Optional — you can play without an account. Signing in remembers your name between games
        and lets you save songs you hear to your own lists.
      </p>

      <button
        type="button"
        onClick={signInWithGoogle}
        disabled={busy}
        className="mb-3 flex w-full items-center justify-center gap-2 rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm font-medium text-text transition hover:border-border-strong disabled:cursor-not-allowed disabled:opacity-60"
      >
        <GoogleIcon />
        Continue with Google
      </button>

      <div className="mb-3">
        <Divider />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="email"
          className={inputClasses}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          className={inputClasses}
        />

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={busy || !email.trim() || !password}
          className="mt-1 rounded-lg border border-primary bg-primary px-3 py-2 text-sm font-semibold text-text-on-primary transition hover:bg-primary-hover active:bg-primary-active disabled:cursor-not-allowed disabled:border-disabled-border disabled:bg-disabled-bg disabled:text-disabled-text"
        >
          {busy ? 'Working…' : mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      <button type="button" onClick={toggleMode} className="mt-3 text-sm text-text-secondary hover:text-text">
        {mode === 'signin' ? "New here? Create an account" : 'Already have an account? Sign in'}
      </button>

      {mode === 'signin' &&
        (resetSent ? (
          <p className="mt-2 text-xs text-text-muted">Password reset email sent — check your inbox.</p>
        ) : (
          <button
            type="button"
            onClick={() => sendResetEmail(email)}
            className="mt-2 block text-xs text-text-muted underline decoration-dotted underline-offset-2 hover:text-text"
          >
            Forgot password?
          </button>
        ))}
    </div>
  )
}

function NeedsProfileView() {
  const busy = useUserStore((s) => s.busy)
  const error = useUserStore((s) => s.error)
  const claimDisplayName = useUserStore((s) => s.claimDisplayName)
  const signOutUser = useUserStore((s) => s.signOutUser)
  const emailValue = useUserStore((s) => s.email)

  const suggested = auth.currentUser?.displayName ?? emailValue?.split('@')[0] ?? ''
  const [name, setName] = useState(suggested.slice(0, MAX_NAME_LENGTH))

  return (
    <div>
      <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-success">Pick a name</h3>
      <p className="mb-3 text-xs text-text-muted">
        You'll get a short number alongside it (like Alex #0421) so people with the same name can
        still tell each other apart.
      </p>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={MAX_NAME_LENGTH}
        placeholder="Display name"
        className={inputClasses}
        autoComplete="off"
      />

      {error && <p className="mt-2 text-sm text-danger">{error}</p>}

      <button
        type="button"
        disabled={busy || name.trim().length < 2}
        onClick={() => claimDisplayName(name)}
        className="mt-3 w-full rounded-lg border border-primary bg-primary px-3 py-2 text-sm font-semibold text-text-on-primary transition hover:bg-primary-hover active:bg-primary-active disabled:cursor-not-allowed disabled:border-disabled-border disabled:bg-disabled-bg disabled:text-disabled-text"
      >
        {busy ? 'Saving…' : 'Continue'}
      </button>

      <button type="button" onClick={signOutUser} className="mt-3 text-sm text-text-secondary hover:text-text">
        Sign out
      </button>
    </div>
  )
}

const ACCOUNT_SUB_TABS = [
  { id: 'lists', label: 'My Lists' },
  { id: 'friends', label: 'Friends' },
  { id: 'stats', label: 'Stats' },
] as const
type AccountSubTab = (typeof ACCOUNT_SUB_TABS)[number]['id']

function FriendsPanel() {
  return <p className="text-sm text-text-muted">Friends are coming soon.</p>
}

function StatsPanel() {
  return <p className="text-sm text-text-muted">Lifetime stats are coming soon.</p>
}

interface ReadyViewProps {
  // Owned by MenuOverlay, not local state here - it needs to know when
  // Account has drilled a level deeper so it can hide its OWN "Back" button
  // (level 1 <-> 2) while this component's "Back" (level 2 <-> 3) is the
  // only one that should show, rather than stacking both at once.
  subTabOpen: boolean
  onSubTabOpenChange: (open: boolean) => void
}

function ReadyView({ subTabOpen, onSubTabOpenChange }: ReadyViewProps) {
  const profile = useUserStore((s) => s.profile)
  const email = useUserStore((s) => s.email)
  const signOutUser = useUserStore((s) => s.signOutUser)
  const [subTab, setSubTab] = useState<AccountSubTab>('lists')

  function openSubTab(id: AccountSubTab) {
    setSubTab(id)
    onSubTabOpenChange(true)
  }

  return (
    <div>
      <div className={`sm:block ${subTabOpen ? 'hidden' : 'block'}`}>
        <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-success">Account</h3>
        <p className="mb-1 text-sm">
          <span className="font-semibold text-text">{profile?.name}</span>{' '}
          <span className="text-text-muted">#{profile?.discriminator}</span>
        </p>
        {email && <p className="mb-3 text-xs text-text-muted">{email}</p>}

        <button
          type="button"
          onClick={signOutUser}
          className="mb-4 rounded-md border border-danger/40 px-3 py-1.5 text-xs font-semibold text-danger transition hover:border-danger"
        >
          Sign out
        </button>

        <div className="flex gap-2" role="tablist">
          {ACCOUNT_SUB_TABS.map(({ id, label }) => {
            const active = subTab === id
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => openSubTab(id)}
                className={`flex-1 rounded-lg border-2 px-2 py-2 text-xs font-semibold transition ${
                  active
                    ? 'border-primary bg-primary-soft text-primary'
                    : 'border-border text-text-secondary hover:border-border-strong'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <div className={`sm:mt-4 sm:block ${subTabOpen ? 'block' : 'hidden'}`}>
        <button
          type="button"
          onClick={() => onSubTabOpenChange(false)}
          className="mb-3 flex items-center gap-1 text-sm text-text-secondary transition hover:text-text sm:hidden"
        >
          ← Back
        </button>
        {subTab === 'lists' ? <MyListsPanel /> : subTab === 'friends' ? <FriendsPanel /> : <StatsPanel />}
      </div>
    </div>
  )
}

function ProfileErrorView() {
  const error = useUserStore((s) => s.error)
  const retryProfileLoad = useUserStore((s) => s.retryProfileLoad)
  const signOutUser = useUserStore((s) => s.signOutUser)

  return (
    <div>
      <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-success">Account</h3>
      <p className="mb-3 text-sm text-danger">{error}</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={retryProfileLoad}
          className="rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm font-medium text-text transition hover:border-border-strong"
        >
          Try again
        </button>
        <button
          type="button"
          onClick={signOutUser}
          className="rounded-lg border border-danger/40 px-3 py-2 text-sm font-semibold text-danger transition hover:border-danger"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}

// Lives inside MenuOverlay's panel switcher, reachable from every screen
// (including the very first CreateJoin screen) since MenuOverlay is mounted
// globally and this panel isn't host- or room-gated. Signing in is entirely
// optional and orthogonal to playing - see the "signed-out" copy below.
// subTabOpen/onSubTabOpenChange are only meaningful for the signed-in
// (ReadyView) case - see that component's own comment.
export function AccountPanel({ subTabOpen, onSubTabOpenChange }: ReadyViewProps) {
  const status = useUserStore((s) => s.status)

  if (status === 'loading') {
    return <p className="text-sm text-text-muted">Checking…</p>
  }
  if (status === 'needs-profile') return <NeedsProfileView />
  if (status === 'ready') return <ReadyView subTabOpen={subTabOpen} onSubTabOpenChange={onSubTabOpenChange} />
  if (status === 'profile-error') return <ProfileErrorView />
  return <SignedOutView />
}
