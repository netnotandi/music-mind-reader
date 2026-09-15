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
    <svg viewBox="0 0 100 60" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="h-16 w-24">
      <path d="M2 30 Q 25 4, 50 30 T 98 30" />
      <path d="M18 30 L18 20 M30 30 L30 12 M42 30 L42 24 M58 30 L58 16 M70 30 L70 26 M82 30 L82 20" />
    </svg>
  )
}

function BestTasteIcon() {
  return (
    <svg viewBox="0 0 80 70" fill="none" className="h-16 w-16">
      <rect x="6" y="42" width="14" height="24" rx="2" fill="currentColor" opacity="0.55" />
      <rect x="28" y="30" width="14" height="36" rx="2" fill="currentColor" opacity="0.75" />
      <rect x="50" y="14" width="14" height="52" rx="2" fill="currentColor" />
      <path
        d="M57 0l3.5 7.2 7.9 1.1-5.7 5.6 1.3 7.9L57 18l-7 3.8 1.3-7.9-5.7-5.6 7.9-1.1z"
        fill="currentColor"
      />
    </svg>
  )
}

function MasterOfDisguiseIcon() {
  return (
    <svg viewBox="0 0 100 50" fill="none" strokeWidth="3" strokeLinecap="round" className="h-14 w-24">
      <path d="M2 25 Q 20 5, 38 25 T 74 25" stroke="currentColor" opacity="0.35" />
      <path d="M14 25 Q 32 45, 50 25 T 86 25" stroke="currentColor" />
    </svg>
  )
}

function MostPredictableIcon() {
  return (
    <svg viewBox="0 0 100 60" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="h-14 w-24">
      <path d="M4 6 L64 30 M4 30 L64 30 M4 54 L64 30" />
      <circle cx="70" cy="30" r="7" fill="currentColor" stroke="none" />
    </svg>
  )
}

function MusicalCriminalIcon() {
  return (
    <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-16 w-16">
      <path d="M40 6 L74 68 H6 Z" />
      <g transform="translate(24 28)">
        <circle cx="6" cy="26" r="6" fill="currentColor" stroke="none" />
        <path d="M12 26 V4 L26 0 V18" />
        <path d="M20 6 L20 3" />
      </g>
    </svg>
  )
}

function OverallWinnerIcon() {
  return (
    <svg viewBox="0 0 80 80" fill="none" className="h-20 w-20">
      <defs>
        <linearGradient id="award-winner-ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--mmr-brand-cyan)" />
          <stop offset="50%" stopColor="var(--mmr-brand-violet)" />
          <stop offset="100%" stopColor="var(--mmr-brand-pink)" />
        </linearGradient>
      </defs>
      <circle cx="40" cy="40" r="34" stroke="url(#award-winner-ring)" strokeWidth="4" fill="none" />
      <text x="40" y="52" textAnchor="middle" fontSize="34" fontWeight="700" fill="currentColor">
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
      <div className={`flex flex-1 items-center justify-center ${colorClass}`}>
        <Icon />
      </div>
      <div>
        <p className="text-lg font-bold uppercase tracking-wide text-text">{playerNames.join(' & ')}</p>
        <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>
      </div>
    </div>
  )
}
