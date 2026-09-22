// One "Final Scoretable" award card - now a host-supplied badge image
// (public/badges/*.jpg, each already a complete card: themed border, icon,
// title and subtitle baked in) with just the dynamic winning player's
// name(s) added underneath, since that's the one thing per-game that no
// static image could contain. Replaces an earlier version built from inline
// SVG icons + app-rendered title/subtitle text - the badge images already
// say all of that (in friendlier, more descriptive copy), so re-rendering
// title/subtitle here would just duplicate it in different words right
// next to the image.
export type AwardIconKind =
  | 'music-mind-reader'
  | 'best-taste'
  | 'master-of-disguise'
  | 'most-predictable'
  | 'musical-criminal'
  | 'overall-winner'

interface AwardCardProps {
  icon: AwardIconKind
  // Kept for caller compatibility (Final Scoretable/game-stats plumbing
  // still carries these) but no longer rendered here - see module comment.
  title: string
  subtitle: string
  playerNames: string[]
}

// public/ files are served at the site root - Vite doesn't rewrite these
// paths, so they're listed by hand (no build-time directory listing for a
// static host), same approach as winnerFanfare.ts's WINNER_SOUND_FILES.
const BADGE_IMAGE: Record<AwardIconKind, string> = {
  'music-mind-reader': '/badges/music_mind_reader.jpg',
  'best-taste': '/badges/best_taste.jpg',
  'master-of-disguise': '/badges/master_of_disguise.jpg',
  'most-predictable': '/badges/most_predictable.jpg',
  'musical-criminal': '/badges/musical_criminal.jpg',
  'overall-winner': '/badges/round_winner.jpg',
}

export function AwardCard({ icon, title, playerNames }: AwardCardProps) {
  return (
    <div className="flex flex-col items-center gap-4 px-2 py-4 text-center">
      {/* The JPGs have an opaque near-black background outside their own
          rounded border art (no alpha channel) - overflow-hidden + rounded-2xl
          on the wrapper softens the image's own square outer corners. Looks
          right in dark mode; may read as a slightly boxy dark card on light
          theme until/unless these get redone as transparent PNGs. */}
      <div className="w-full max-w-xs overflow-hidden rounded-2xl">
        <img src={BADGE_IMAGE[icon]} alt={title} className="block w-full" />
      </div>
      <p className="text-lg font-bold uppercase tracking-wide text-text">{playerNames.join(' & ')}</p>
    </div>
  )
}
