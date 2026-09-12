// "Triple Down": a rating is a single assignment per song within a
// category, not a free repeatable score - the same value can't be held by
// two songs from the same rater at once (see the dynamic rating-scale spec
// in CLAUDE.md). Picking a value another of the rater's songs already holds
// doesn't just get rejected - it bumps that song (and any more, contiguously,
// below it) down by one each, absorbed by the first gap below the chosen
// value. See "Triple Down" in CLAUDE.md for the full write-up and example.
//
// `valueToSongId` maps a currently-held rating value to the song holding it
// (for one rater, one category, excluding the song being rated right now).
export function computeCascade(
  valueToSongId: Map<number, string>,
  value: number
): { songId: string; newValue: number }[] | null {
  const moves: { songId: string; newValue: number }[] = []
  let v = value
  while (valueToSongId.has(v)) {
    const songId = valueToSongId.get(v)
    if (songId === undefined) break
    const newValue = v - 1
    // The chain ran all the way down to 0 with no gap to absorb it - there's
    // nowhere left to push the lowest holder, so this value isn't offered.
    if (newValue < 0) return null
    moves.push({ songId, newValue })
    v = newValue
  }
  return moves
}

// UI-only convenience: can this taken value actually be picked right now?
export function hasCascadeRoom(valueToSongId: Map<number, string>, value: number): boolean {
  return computeCascade(valueToSongId, value) !== null
}
