// One "Final Scoretable" award card - matches the mockups the host shared:
// a small "AWARD" eyebrow, a themed icon, a big title, the winning
// player's name(s), and a one-line subtitle. Purely presentational - no
// phone-chrome/status-bar framing (that was just how the mockup was
// exported), colors come from the app's existing brand tokens rather than
// introducing new ones.
export type AwardIconKind =
  | 'music-mind-reader'
  | 'best-taste'
  | 'master-of-disguise'
  | 'most-predictable'
  | 'musical-criminal'
  | 'overall-winner'

interface AwardCardProps {
  icon: AwardIconKind
  title: string
  subtitle: string
  playerNames: string[]
}

const ICON_COLOR_CLASS: Record<AwardIconKind, string> = {
  'music-mind-reader': 'text-cyan',
  'best-taste': 'text-rating',
  'master-of-disguise': 'text-violet',
  'most-predictable': 'text-pink',
  'musical-criminal': 'text-danger',
  'overall-winner': 'text-blue',
}

function MusicMindReaderIcon() {
  // The same eye-shaped soundwave motif as the app's own logo/wordmark.
  return (
    <svg viewBox="0 0 100 60" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" className="h-28 w-40">
      <path d="M2 30 Q 25 4, 50 30 T 98 30" />
      <path d="M18 30 L18 18 M30 30 L30 8 M42 30 L42 22 M58 30 L58 12 M70 30 L70 24 M82 30 L82 16" />
    </svg>
  )
}

function BestTasteIcon() {
  return (
    <svg viewBox="0 0 80 70" fill="none" className="h-24 w-24">
      <rect x="4" y="38" width="18" height="28" rx="3" fill="currentColor" opacity="0.75" />
      <rect x="30" y="24" width="18" height="42" rx="3" fill="currentColor" opacity="0.9" />
      <rect x="56" y="6" width="18" height="60" rx="3" fill="currentColor" />
      <path
        d="M65 -8l4.7 9.6 10.6 1.5-7.7 7.5 1.8 10.6L65 16l-9.4 5.2 1.8-10.6-7.7-7.5 10.6-1.5z"
        fill="currentColor"
      />
    </svg>
  )
}

function MasterOfDisguiseIcon() {
  return (
    <svg viewBox="0 0 100 50" fill="none" strokeWidth="5" strokeLinecap="round" className="h-20 w-40">
      <path d="M2 25 Q 20 3, 38 25 T 74 25" stroke="currentColor" opacity="0.4" />
      <path d="M14 25 Q 32 47, 50 25 T 86 25" stroke="currentColor" />
    </svg>
  )
}

function MostPredictableIcon() {
  return (
    <svg viewBox="0 0 100 60" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" className="h-20 w-40">
      <path d="M4 2 L64 30 M4 30 L64 30 M4 58 L64 30" />
      <circle cx="72" cy="30" r="9" fill="currentColor" stroke="none" />
    </svg>
  )
}

function MusicalCriminalIcon() {
  return (
    <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" className="h-24 w-24">
      <path d="M40 4 L76 70 H4 Z" />
      <g transform="translate(22 26)">
        <circle cx="7" cy="30" r="7" fill="currentColor" stroke="none" />
        <path d="M14 30 V4 L30 -1 V21" />
      </g>
    </svg>
  )
}

function OverallWinnerIcon() {
  return (
    <svg viewBox="0 0 80 80" fill="none" className="h-32 w-32">
      <defs>
        <linearGradient id="award-winner-ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--mmr-brand-cyan)" />
          <stop offset="50%" stopColor="var(--mmr-brand-violet)" />
          <stop offset="100%" stopColor="var(--mmr-brand-pink)" />
        </linearGradient>
      </defs>
      <circle cx="40" cy="40" r="33" stroke="url(#award-winner-ring)" strokeWidth="6" fill="none" />
      <text x="40" y="54" textAnchor="middle" fontSize="42" fontWeight="800" fill="currentColor">
        1
      </text>
    </svg>
  )
}

const ICON_COMPONENT: Record<AwardIconKind, () => React.JSX.Element> = {
  'music-mind-reader': MusicMindReaderIcon,
  'best-taste': BestTasteIcon,
  'master-of-disguise': MasterOfDisguiseIcon,
  'most-predictable': MostPredictableIcon,
  'musical-criminal': MusicalCriminalIcon,
  'overall-winner': OverallWinnerIcon,
}

export function AwardCard({ icon, title, subtitle, playerNames }: AwardCardProps) {
  const colorClass = ICON_COLOR_CLASS[icon]
  const Icon = ICON_COMPONENT[icon]
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-between rounded-2xl border border-border-strong bg-surface px-6 py-10 text-center">
      <p className={`text-xs font-bold uppercase tracking-[0.3em] ${colorClass}`}>Award</p>
      <h2 className="mt-3 text-2xl font-extrabold uppercase leading-tight text-text">{title}</h2>
      <div className={`relative flex flex-1 items-center justify-center ${colorClass}`}>
        {/* Soft blurred glow behind the icon, plus a drop-shadow on the
            icon itself - the flat line-art otherwise reads as thin/flat
            against the dark card. */}
        <div className="absolute h-28 w-28 rounded-full bg-current opacity-20 blur-2xl" />
        <div className="relative" style={{ filter: 'drop-shadow(0 0 16px currentColor)' }}>
          <Icon />
        </div>
      </div>
      <div>
        <p className="text-lg font-bold uppercase tracking-wide text-text">{playerNames.join(' & ')}</p>
        <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>
      </div>
    </div>
  )
}
