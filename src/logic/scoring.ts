import type { Guess, Player, Rating, Song } from '../types'

export const CORRECT_GUESS_POINTS = 3
export const NOBODY_GUESSED_BONUS = 2
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

// Regla 1: rétt ágiskun á eiganda lags gefur giskandanum +3 stig.
export function computeGuessPoints({ songs, guesses }: RoundData): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const song of songs) {
    for (const guesserId of correctGuessers(song, guesses)) {
      addPoints(totals, guesserId, CORRECT_GUESS_POINTS)
    }
  }
  return totals
}

// Regla 2: eigandi lags fær MEÐALTAL (ekki summu) einkunna 0-5 sem stig.
export function computeRatingPoints({ songs, ratings }: RoundData): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const song of songs) {
    addPoints(totals, song.playerId, averageRating(song.id, ratings))
  }
  return totals
}

// Regla 3: ef enginn giskar rétt á eigandann fær eigandinn +2 bónus.
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

export function computeTitles(round: RoundData, players: Player[]): Title[] {
  const { songs, guesses, ratings } = round
  if (songs.length === 0 || players.length === 0) return []

  const songById = new Map(songs.map((s) => [s.id, s]))
  const correctGuessCountByGuesser = players.map((player) => {
    const count = guesses.filter((g) => {
      if (g.guesserId !== player.id) return false
      const song = songById.get(g.songId)
      return song !== undefined && g.guessedPlayerId === song.playerId
    }).length
    return { player, count }
  })

  const avgRatingBySong = new Map(songs.map((s) => [s.id, averageRating(s.id, ratings)]))
  const ownSongAvgByPlayer = players.map((player) => {
    const ownSongs = songs.filter((s) => s.playerId === player.id)
    const avg =
      ownSongs.length === 0
        ? 0
        : ownSongs.reduce((sum, s) => sum + (avgRatingBySong.get(s.id) ?? 0), 0) / ownSongs.length
    return { player, avg }
  })

  const correctGuessersCountByPlayer = players.map((player) => {
    const ownSongs = songs.filter((s) => s.playerId === player.id)
    const count = ownSongs.reduce((sum, s) => sum + correctGuessers(s, guesses).length, 0)
    return { player, count }
  })

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
