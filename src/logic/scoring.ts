import type { Guess, Player, Rating, Song } from '../types'

export const CORRECT_GUESS_POINTS = 2
export const NOBODY_GUESSED_BONUS = 5
export const TOP_RATED_SONG_BONUS = 2
export const GREAT_MINDS_BONUS = 1

interface RoundData {
  songs: Song[]
  guesses: Guess[]
  ratings: Rating[]
}

export function averageRating(songId: string, ratings: Rating[]): number {
  const forSong = ratings.filter((r) => r.songId === songId)
  if (forSong.length === 0) return 0
  return forSong.reduce((sum, r) => sum + r.value, 0) / forSong.length
}

export function correctGuessers(song: Song, guesses: Guess[]): string[] {
  return guesses
    .filter((g) => g.songId === song.id && g.guessedPlayerId === song.playerId)
    .map((g) => g.guesserId)
}

function addPoints(totals: Record<string, number>, playerId: string, amount: number) {
  totals[playerId] = (totals[playerId] ?? 0) + amount
}

// Regla 1: rétt ágiskun á eiganda lags gefur giskandanum +2 stig.
export function computeGuessPoints({ songs, guesses }: RoundData): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const song of songs) {
    for (const guesserId of correctGuessers(song, guesses)) {
      addPoints(totals, guesserId, CORRECT_GUESS_POINTS)
    }
  }
  return totals
}

// Regla 2: eigandi lags fær MEÐALTAL (ekki summu) einkunna 0-10 sem stig.
export function computeRatingPoints({ songs, ratings }: RoundData): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const song of songs) {
    addPoints(totals, song.playerId, averageRating(song.id, ratings))
  }
  return totals
}

// Regla 3: ef enginn giskar rétt á eigandann fær eigandinn +5 bónus.
export function computeNobodyGuessedBonus({ songs, guesses }: RoundData): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const song of songs) {
    if (correctGuessers(song, guesses).length === 0) {
      addPoints(totals, song.playerId, NOBODY_GUESSED_BONUS)
    }
  }
  return totals
}

// Regla 4: eigandi/eigendur hæst metna lags umferðarinnar fá +2 bónus.
export function computeTopRatedBonus({ songs, ratings }: RoundData): Record<string, number> {
  const totals: Record<string, number> = {}
  if (songs.length === 0) return totals
  const averages = songs.map((song) => ({ song, avg: averageRating(song.id, ratings) }))
  const maxAvg = Math.max(...averages.map((a) => a.avg))
  if (maxAvg <= 0) return totals
  for (const { song, avg } of averages) {
    if (avg === maxAvg) {
      addPoints(totals, song.playerId, TOP_RATED_SONG_BONUS)
    }
  }
  return totals
}

// Regla 5: "Great Minds" - ef tveir eða fleiri velja sama lagið (titill+flytjandi)
// óháð hvor öðrum fá þeir +1 stig hvor.
export function computeGreatMindsBonus({ songs }: RoundData): Record<string, number> {
  const totals: Record<string, number> = {}
  const groups = new Map<string, Song[]>()
  for (const song of songs) {
    const key = `${song.title.trim().toLowerCase()}::${song.artist.trim().toLowerCase()}`
    const group = groups.get(key) ?? []
    group.push(song)
    groups.set(key, group)
  }
  for (const group of groups.values()) {
    if (group.length >= 2) {
      for (const song of group) {
        addPoints(totals, song.playerId, GREAT_MINDS_BONUS)
      }
    }
  }
  return totals
}

export function computeFinalScores(round: RoundData): Record<string, number> {
  const parts = [
    computeGuessPoints(round),
    computeRatingPoints(round),
    computeNobodyGuessedBonus(round),
    computeTopRatedBonus(round),
    computeGreatMindsBonus(round),
  ]
  const totals: Record<string, number> = {}
  for (const part of parts) {
    for (const [playerId, amount] of Object.entries(part)) {
      addPoints(totals, playerId, amount)
    }
  }
  return totals
}

export interface ScoreBreakdownRow {
  label: string
  detail: string
  points: number
}

// Per-song detail behind a player's total score, for the Results screen's
// expandable breakdown - one row per rule that actually contributed,
// grouped by which song (if any) it came from.
export function computeScoreBreakdown(round: RoundData, playerId: string): ScoreBreakdownRow[] {
  const { songs, guesses, ratings } = round
  const rows: ScoreBreakdownRow[] = []

  const correctGuessCount = guesses.filter((g) => {
    if (g.guesserId !== playerId) return false
    const song = songs.find((s) => s.id === g.songId)
    return song !== undefined && g.guessedPlayerId === song.playerId
  }).length
  if (correctGuessCount > 0) {
    rows.push({
      label: 'Correct Guesses',
      detail: `${correctGuessCount} right guess${correctGuessCount === 1 ? '' : 'es'}`,
      points: correctGuessCount * CORRECT_GUESS_POINTS,
    })
  }

  const averages = songs.map((song) => ({ song, avg: averageRating(song.id, ratings) }))
  const maxAvg = averages.length > 0 ? Math.max(...averages.map((a) => a.avg)) : 0

  const duplicateGroups = new Map<string, Song[]>()
  for (const song of songs) {
    const key = `${song.title.trim().toLowerCase()}::${song.artist.trim().toLowerCase()}`
    const group = duplicateGroups.get(key) ?? []
    group.push(song)
    duplicateGroups.set(key, group)
  }

  for (const song of songs.filter((s) => s.playerId === playerId)) {
    const avg = averageRating(song.id, ratings)
    rows.push({
      label: 'Song Rating',
      detail: `"${song.title}" avg rating ${avg.toFixed(1)}`,
      points: avg,
    })

    if (correctGuessers(song, guesses).length === 0) {
      rows.push({
        label: 'Nobody Guessed',
        detail: `No one correctly guessed "${song.title}"`,
        points: NOBODY_GUESSED_BONUS,
      })
    }

    if (avg > 0 && avg === maxAvg) {
      rows.push({
        label: 'Top Rated Song',
        detail: `"${song.title}" was the highest-rated song`,
        points: TOP_RATED_SONG_BONUS,
      })
    }

    const key = `${song.title.trim().toLowerCase()}::${song.artist.trim().toLowerCase()}`
    if ((duplicateGroups.get(key) ?? []).length >= 2) {
      rows.push({
        label: 'Great Minds',
        detail: `"${song.title}" was also picked by someone else`,
        points: GREAT_MINDS_BONUS,
      })
    }
  }

  return rows
}

export interface Title {
  name: string
  playerId: string
}

// How many times this player correctly guessed a song's owner, within one
// round. Shared by computeTitles (single round) and gameStore.ts's
// applyRoundScoresIfNeeded (folding into the cumulative counter that
// computeCumulativeTitles reads across every round played).
export function countCorrectGuesses(round: RoundData, playerId: string): number {
  const { songs, guesses } = round
  const songById = new Map(songs.map((s) => [s.id, s]))
  return guesses.filter((g) => {
    if (g.guesserId !== playerId) return false
    const song = songById.get(g.songId)
    return song !== undefined && g.guessedPlayerId === song.playerId
  }).length
}

// The sum of each song this player submitted's average rating, and how many
// songs that sum covers - kept as a sum/count pair (rather than a single
// average) so callers accumulating across multiple rounds can combine them
// correctly before dividing, instead of averaging per-round averages.
export function ownSongRatingStats(round: RoundData, playerId: string): { sum: number; count: number } {
  const { songs, ratings } = round
  const ownSongs = songs.filter((s) => s.playerId === playerId)
  const sum = ownSongs.reduce((total, s) => total + averageRating(s.id, ratings), 0)
  return { sum, count: ownSongs.length }
}

// How many other players correctly guessed this player was behind one of
// their songs, within one round - feeds both Master of Disguise (fewest)
// and Most Predictable (most).
export function countGuessedByOthers(round: RoundData, playerId: string): number {
  const { songs, guesses } = round
  const ownSongs = songs.filter((s) => s.playerId === playerId)
  return ownSongs.reduce((sum, s) => sum + correctGuessers(s, guesses).length, 0)
}

// Pairwise version of countCorrectGuesses, within one round: how many times
// this guesser correctly guessed EACH other player's song, keyed by that
// other player's id. Folded into Player.cumulativeCorrectGuessesByTarget by
// applyRoundScoresIfNeeded (gameStore.ts) since raw guesses don't survive
// past the round they happened in.
export function correctGuessesByTargetThisRound(
  round: RoundData,
  guesserId: string
): Record<string, number> {
  const { songs, guesses } = round
  const songById = new Map(songs.map((s) => [s.id, s]))
  const result: Record<string, number> = {}
  for (const g of guesses) {
    if (g.guesserId !== guesserId) continue
    const song = songById.get(g.songId)
    if (song && g.guessedPlayerId === song.playerId) {
      result[song.playerId] = (result[song.playerId] ?? 0) + 1
    }
  }
  return result
}

// Pairwise version of ownSongRatingStats, within one round, from the
// RATER's side instead of the song owner's: sum/count of ratings this rater
// gave to EACH other player's songs, keyed by that other player's id. Folded
// into Player.cumulativeRatingGivenByTarget the same way.
export function ratingsGivenByTargetThisRound(
  round: RoundData,
  raterId: string
): Record<string, { sum: number; count: number }> {
  const { songs, ratings } = round
  const songById = new Map(songs.map((s) => [s.id, s]))
  const result: Record<string, { sum: number; count: number }> = {}
  for (const r of ratings) {
    if (r.raterId !== raterId) continue
    const song = songById.get(r.songId)
    if (!song || song.playerId === raterId) continue
    const entry = result[song.playerId] ?? { sum: 0, count: 0 }
    entry.sum += r.value
    entry.count += 1
    result[song.playerId] = entry
  }
  return result
}

// Total guesses this player made this round, right or wrong - unlike
// countCorrectGuesses, needed for career-wide accuracy % (users/{uid}/
// careerStats in gameStore.ts) since "guessed right" alone can't tell you
// how many attempts it was out of.
export function countGuessAttempts(round: RoundData, playerId: string): number {
  return round.guesses.filter((g) => g.guesserId === playerId).length
}

// Sum/count of every rating this player GAVE to anyone else's song this
// round - the mirror of ownSongRatingStats (which is from the RECEIVING
// side). Feeds career "average rating given" as a separate number from
// "average rating received".
export function ratingsGivenStats(round: RoundData, raterId: string): { sum: number; count: number } {
  const { songs, ratings } = round
  const songById = new Map(songs.map((s) => [s.id, s]))
  let sum = 0
  let count = 0
  for (const r of ratings) {
    if (r.raterId !== raterId) continue
    const song = songById.get(r.songId)
    if (!song || song.playerId === raterId) continue
    sum += r.value
    count += 1
  }
  return { sum, count }
}

// Whether each song this player guessed on this round was correct, in play
// order (round.songs is already sorted by songOrder via
// getCurrentRoundSongs) - feeds the career-wide longest-correct-guess-streak
// counter in gameStore.ts, which keeps walking this sequence round after
// round, game after game, only ever broken by a wrong guess.
export function guessSequenceForPlayer(round: RoundData, playerId: string): boolean[] {
  const { songs, guesses } = round
  const guessBySongId = new Map(guesses.filter((g) => g.guesserId === playerId).map((g) => [g.songId, g]))
  const sequence: boolean[] = []
  for (const song of songs) {
    const guess = guessBySongId.get(song.id)
    if (!guess) continue
    sequence.push(guess.guessedPlayerId === song.playerId)
  }
  return sequence
}

export function computeTitles(round: RoundData, players: Player[]): Title[] {
  const { songs } = round
  if (songs.length === 0 || players.length === 0) return []

  const correctGuessCountByGuesser = players.map((player) => ({
    player,
    count: countCorrectGuesses(round, player.id),
  }))

  const ownSongAvgByPlayer = players.map((player) => {
    const { sum, count } = ownSongRatingStats(round, player.id)
    return { player, avg: count === 0 ? 0 : sum / count }
  })

  const correctGuessersCountByPlayer = players.map((player) => ({
    player,
    count: countGuessedByOthers(round, player.id),
  }))

  const titles: Title[] = []

  // Every title is shared by everyone tied for the extreme value - picking
  // a single winner via sort()[0] would arbitrarily favor whoever happens
  // to come first in the players list.

  const maxGuessCount = Math.max(...correctGuessCountByGuesser.map((x) => x.count))
  if (maxGuessCount > 0) {
    for (const { player, count } of correctGuessCountByGuesser) {
      if (count === maxGuessCount) titles.push({ name: 'Music Mind Reader', playerId: player.id })
    }
  }

  const maxTasteAvg = Math.max(...ownSongAvgByPlayer.map((x) => x.avg))
  if (maxTasteAvg > 0) {
    for (const { player, avg } of ownSongAvgByPlayer) {
      if (avg === maxTasteAvg) titles.push({ name: 'Best Taste', playerId: player.id })
    }
  }

  const minHiddenCount = Math.min(...correctGuessersCountByPlayer.map((x) => x.count))
  for (const { player, count } of correctGuessersCountByPlayer) {
    if (count === minHiddenCount) titles.push({ name: 'Master of Disguise', playerId: player.id })
  }

  const maxPredictableCount = Math.max(...correctGuessersCountByPlayer.map((x) => x.count))
  if (maxPredictableCount > 0) {
    for (const { player, count } of correctGuessersCountByPlayer) {
      if (count === maxPredictableCount) titles.push({ name: 'Most Predictable', playerId: player.id })
    }
  }

  const ratedPlayers = ownSongAvgByPlayer.filter((x) => x.avg > 0)
  if (ratedPlayers.length > 0) {
    const minRatedAvg = Math.min(...ratedPlayers.map((x) => x.avg))
    for (const { player, avg } of ratedPlayers) {
      if (avg === minRatedAvg) titles.push({ name: 'Musical Criminal', playerId: player.id })
    }
  }

  return titles
}

// Same five titles as computeTitles, but computed from each player's
// cumulative counters (folded in every round by applyRoundScoresIfNeeded in
// gameStore.ts) instead of one round's raw songs/guesses/ratings - used for
// the "Final Scoretable" card deck once every pre-committed round has been
// played. Same tie-inclusive-extremes philosophy, same zero-guards, per
// title, as the single-round version above.
export function computeCumulativeTitles(players: Player[]): Title[] {
  if (players.length === 0) return []
  const titles: Title[] = []

  const guessCounts = players.map((player) => ({
    player,
    count: player.cumulativeCorrectGuesses ?? 0,
  }))
  const maxGuessCount = Math.max(...guessCounts.map((x) => x.count))
  if (maxGuessCount > 0) {
    for (const { player, count } of guessCounts) {
      if (count === maxGuessCount) titles.push({ name: 'Music Mind Reader', playerId: player.id })
    }
  }

  const tasteAvgs = players.map((player) => {
    const sum = player.cumulativeRatingSum ?? 0
    const count = player.cumulativeOwnedSongCount ?? 0
    return { player, avg: count === 0 ? 0 : sum / count }
  })
  const maxTasteAvg = Math.max(...tasteAvgs.map((x) => x.avg))
  if (maxTasteAvg > 0) {
    for (const { player, avg } of tasteAvgs) {
      if (avg === maxTasteAvg) titles.push({ name: 'Best Taste', playerId: player.id })
    }
  }

  const hiddenCounts = players.map((player) => ({
    player,
    count: player.cumulativeGuessedByOthersCount ?? 0,
  }))
  const minHiddenCount = Math.min(...hiddenCounts.map((x) => x.count))
  for (const { player, count } of hiddenCounts) {
    if (count === minHiddenCount) titles.push({ name: 'Master of Disguise', playerId: player.id })
  }

  const maxPredictableCount = Math.max(...hiddenCounts.map((x) => x.count))
  if (maxPredictableCount > 0) {
    for (const { player, count } of hiddenCounts) {
      if (count === maxPredictableCount) titles.push({ name: 'Most Predictable', playerId: player.id })
    }
  }

  const ratedPlayers = tasteAvgs.filter((x) => x.avg > 0)
  if (ratedPlayers.length > 0) {
    const minRatedAvg = Math.min(...ratedPlayers.map((x) => x.avg))
    for (const { player, avg } of ratedPlayers) {
      if (avg === minRatedAvg) titles.push({ name: 'Musical Criminal', playerId: player.id })
    }
  }

  return titles
}

// The player(s) tied for the single highest cumulative totalScore - the
// game's overall winner(s), shown as its own card in the Final Scoretable
// deck alongside the five titles above.
export function computeOverallWinners(players: Player[]): string[] {
  if (players.length === 0) return []
  const maxScore = Math.max(...players.map((p) => p.totalScore ?? 0))
  return players.filter((p) => (p.totalScore ?? 0) === maxScore).map((p) => p.id)
}

export interface GameStatsForViewer {
  // Who most often correctly guessed the VIEWER's songs, across the whole
  // game - "[names] read you like a book — guessed your song N times".
  bestGuesserOfYou: { playerIds: string[]; count: number } | null
  // Who the VIEWER most often correctly guessed, across the whole game -
  // "You had [names]'s number — guessed them right N times".
  yourBestGuess: { playerIds: string[]; count: number } | null
  // Players nobody ever correctly guessed, all game (must have actually
  // played at least one song - otherwise "nobody guessed them" is vacuous).
  hardestToRead: string[]
  // The pair who rated each other's songs most similarly, game-wide (same
  // for every viewer) - null if fewer than two players have given each
  // other any rating at all.
  mostInSyncPair: { playerIds: [string, string]; viewerIsMember: boolean } | null
  // Highest cumulativeCorrectGuesses overall - same criterion as the "Music
  // Mind Reader" title, restated as a highlight on this card.
  topOverallGuesser: { playerIds: string[]; count: number } | null
}

// Built once, at game-end, from the final players array (every cumulative
// field fully folded in) - a pure summary, no new writes. Every field is
// null/empty when nothing qualifies, so the card can skip that line
// entirely rather than showing an empty or zeroed-out one.
export function computeGameStatsForViewer(players: Player[], viewerId: string): GameStatsForViewer {
  const others = players.filter((p) => p.id !== viewerId)

  let bestGuesserOfYou: GameStatsForViewer['bestGuesserOfYou'] = null
  const guessedYouCounts = others
    .map((p) => ({ id: p.id, count: p.cumulativeCorrectGuessesByTarget?.[viewerId] ?? 0 }))
    .filter((x) => x.count > 0)
  if (guessedYouCounts.length > 0) {
    const max = Math.max(...guessedYouCounts.map((x) => x.count))
    bestGuesserOfYou = { playerIds: guessedYouCounts.filter((x) => x.count === max).map((x) => x.id), count: max }
  }

  let yourBestGuess: GameStatsForViewer['yourBestGuess'] = null
  const viewer = players.find((p) => p.id === viewerId)
  const yourGuessMap = viewer?.cumulativeCorrectGuessesByTarget ?? {}
  const yourGuessEntries = Object.entries(yourGuessMap).filter(([, count]) => count > 0)
  if (yourGuessEntries.length > 0) {
    const max = Math.max(...yourGuessEntries.map(([, count]) => count))
    yourBestGuess = {
      playerIds: yourGuessEntries.filter(([, count]) => count === max).map(([id]) => id),
      count: max,
    }
  }

  const hardestToRead = players
    .filter((p) => (p.cumulativeGuessedByOthersCount ?? 0) === 0 && (p.cumulativeOwnedSongCount ?? 0) > 0)
    .map((p) => p.id)

  let mostInSyncPair: GameStatsForViewer['mostInSyncPair'] = null
  let bestSyncAvg = 0
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const a = players[i]
      const b = players[j]
      const aGivesB = a.cumulativeRatingGivenByTarget?.[b.id]
      const bGivesA = b.cumulativeRatingGivenByTarget?.[a.id]
      if (!aGivesB || aGivesB.count === 0 || !bGivesA || bGivesA.count === 0) continue
      const avg = (aGivesB.sum / aGivesB.count + bGivesA.sum / bGivesA.count) / 2
      if (avg > bestSyncAvg) {
        bestSyncAvg = avg
        mostInSyncPair = { playerIds: [a.id, b.id], viewerIsMember: a.id === viewerId || b.id === viewerId }
      }
    }
  }

  let topOverallGuesser: GameStatsForViewer['topOverallGuesser'] = null
  const guessCounts = players
    .map((p) => ({ id: p.id, count: p.cumulativeCorrectGuesses ?? 0 }))
    .filter((x) => x.count > 0)
  if (guessCounts.length > 0) {
    const max = Math.max(...guessCounts.map((x) => x.count))
    topOverallGuesser = { playerIds: guessCounts.filter((x) => x.count === max).map((x) => x.id), count: max }
  }

  return { bestGuesserOfYou, yourBestGuess, hardestToRead, mostInSyncPair, topOverallGuesser }
}
