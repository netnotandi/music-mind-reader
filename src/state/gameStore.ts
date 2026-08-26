import { create } from 'zustand'
import type { Category, Guess, Player, Rating, Song } from '../types'
import { CATEGORIES, MOCK_SONG_POOL, PLAYERS } from './mockData'

export const MAX_SELECTED_CATEGORIES = 3

interface GameState {
  players: Player[]
  categories: Category[]
  currentPlayerId: string
  isHost: boolean
  selectedCategoryIds: string[]
  songs: Song[]
  guesses: Guess[]
  ratings: Rating[]
  currentSongIndex: number
  // playerIds who have submitted their guesses/ratings for a category,
  // keyed by categoryId - the group can't advance past a category until
  // everyone's in, so no one's answers change after someone else has
  // already seen them locked in.
  categorySubmissions: Record<string, string[]>

  setCurrentPlayer: (playerId: string) => void
  setIsHost: (isHost: boolean) => void
  toggleCategory: (categoryId: string) => void
  confirmCategories: () => void
  submitSong: (playerId: string, categoryId: string, title: string, artist: string) => void
  autofillRemainingSongs: () => void
  submitGuess: (songId: string, guesserId: string, guessedPlayerId: string) => void
  submitRating: (songId: string, raterId: string, value: number) => void
  submitCategoryAnswers: (
    categoryId: string,
    playerId: string,
    answers: { songId: string; guessedPlayerId: string | null; rating: number | null }[]
  ) => void
  autofillCategorySubmissions: (categoryId: string, excludePlayerId: string) => void
  nextSong: () => void
  prevSong: () => void
  setSongIndex: (index: number) => void
  startNewRound: () => void
}

export const useGameStore = create<GameState>((set) => ({
  players: PLAYERS,
  categories: CATEGORIES,
  currentPlayerId: PLAYERS[0].id,
  isHost: false,
  selectedCategoryIds: [],
  songs: [],
  guesses: [],
  ratings: [],
  currentSongIndex: 0,
  categorySubmissions: {},

  setCurrentPlayer: (playerId) => set({ currentPlayerId: playerId }),

  setIsHost: (isHost) => set({ isHost }),

  toggleCategory: (categoryId) =>
    set((state) => {
      const alreadySelected = state.selectedCategoryIds.includes(categoryId)
      if (!alreadySelected && state.selectedCategoryIds.length >= MAX_SELECTED_CATEGORIES) return state
      const selectedCategoryIds = alreadySelected
        ? state.selectedCategoryIds.filter((id) => id !== categoryId)
        : [...state.selectedCategoryIds, categoryId]
      return { selectedCategoryIds }
    }),

  // Locks in the category selection and starts a fresh round - carrying
  // over songs, guesses, or ratings from a previous round would let a
  // category look already-submitted or corrupt scoring for the new one.
  confirmCategories: () =>
    set({ songs: [], guesses: [], ratings: [], currentSongIndex: 0, categorySubmissions: {} }),

  submitSong: (playerId, categoryId, title, artist) =>
    set((state) => {
      const withoutExisting = state.songs.filter(
        (s) => !(s.playerId === playerId && s.categoryId === categoryId)
      )
      const song: Song = { id: `${playerId}:${categoryId}`, playerId, categoryId, title, artist }
      return { songs: [...withoutExisting, song] }
    }),

  autofillRemainingSongs: () =>
    set((state) => {
      const newSongs: Song[] = []
      let pickIndex = 0
      for (const categoryId of state.selectedCategoryIds) {
        const missingPlayers = state.players.filter(
          (p) =>
            !state.songs.some((s) => s.playerId === p.id && s.categoryId === categoryId) &&
            !newSongs.some((s) => s.playerId === p.id && s.categoryId === categoryId)
        )
        for (const player of missingPlayers) {
          const pick = MOCK_SONG_POOL[pickIndex % MOCK_SONG_POOL.length]
          pickIndex++
          newSongs.push({
            id: `${player.id}:${categoryId}`,
            playerId: player.id,
            categoryId,
            title: pick.title,
            artist: pick.artist,
          })
        }
      }
      return { songs: [...state.songs, ...newSongs] }
    }),

  submitGuess: (songId, guesserId, guessedPlayerId) =>
    set((state) => ({
      guesses: [
        ...state.guesses.filter((g) => !(g.songId === songId && g.guesserId === guesserId)),
        { songId, guesserId, guessedPlayerId },
      ],
    })),

  submitRating: (songId, raterId, value) =>
    set((state) => ({
      ratings: [
        ...state.ratings.filter((r) => !(r.songId === songId && r.raterId === raterId)),
        { songId, raterId, value },
      ],
    })),

  submitCategoryAnswers: (categoryId, playerId, answers) =>
    set((state) => {
      let guesses = state.guesses
      let ratings = state.ratings
      for (const { songId, guessedPlayerId, rating } of answers) {
        if (guessedPlayerId) {
          guesses = [
            ...guesses.filter((g) => !(g.songId === songId && g.guesserId === playerId)),
            { songId, guesserId: playerId, guessedPlayerId },
          ]
        }
        if (rating !== null) {
          ratings = [
            ...ratings.filter((r) => !(r.songId === songId && r.raterId === playerId)),
            { songId, raterId: playerId, value: rating },
          ]
        }
      }
      const alreadySubmitted = state.categorySubmissions[categoryId] ?? []
      const categorySubmissions = alreadySubmitted.includes(playerId)
        ? state.categorySubmissions
        : { ...state.categorySubmissions, [categoryId]: [...alreadySubmitted, playerId] }
      return { guesses, ratings, categorySubmissions }
    }),

  // Dev helper mirroring autofillRemainingSongs: fills in plausible
  // guesses/ratings for every player who hasn't submitted this category yet
  // (other than excludePlayerId), so the "wait for everyone" gate can be
  // tested solo. Each simulated player's guesses are a rotation of the
  // other players - a valid one-guess-per-name assignment by construction.
  autofillCategorySubmissions: (categoryId, excludePlayerId) =>
    set((state) => {
      const alreadySubmitted = new Set(state.categorySubmissions[categoryId] ?? [])
      const missingPlayers = state.players.filter(
        (p) => p.id !== excludePlayerId && !alreadySubmitted.has(p.id)
      )
      const categorySongs = state.songs.filter((s) => s.categoryId === categoryId)

      let guesses = state.guesses
      let ratings = state.ratings
      const newlySubmitted: string[] = []

      missingPlayers.forEach((player, playerIndex) => {
        const otherSongs = categorySongs.filter((s) => s.playerId !== player.id)
        const candidates = state.players.filter((p) => p.id !== player.id)
        otherSongs.forEach((song, i) => {
          const guessedPlayerId = candidates[(i + playerIndex) % candidates.length].id
          const rating = (i * 2 + playerIndex) % 6
          guesses = [
            ...guesses.filter((g) => !(g.songId === song.id && g.guesserId === player.id)),
            { songId: song.id, guesserId: player.id, guessedPlayerId },
          ]
          ratings = [
            ...ratings.filter((r) => !(r.songId === song.id && r.raterId === player.id)),
            { songId: song.id, raterId: player.id, value: rating },
          ]
        })
        newlySubmitted.push(player.id)
      })

      return {
        guesses,
        ratings,
        categorySubmissions: {
          ...state.categorySubmissions,
          [categoryId]: [...alreadySubmitted, ...newlySubmitted],
        },
      }
    }),

  nextSong: () =>
    set((state) => ({
      currentSongIndex: Math.min(state.currentSongIndex + 1, getCurrentRoundSongs(state).length - 1),
    })),

  prevSong: () => set((state) => ({ currentSongIndex: Math.max(state.currentSongIndex - 1, 0) })),

  setSongIndex: (index) =>
    set((state) => ({
      currentSongIndex: Math.max(0, Math.min(index, getCurrentRoundSongs(state).length - 1)),
    })),

  // Starts a fresh round for the same group of players still in the Lobby -
  // isHost is intentionally left alone, since everyone should go straight
  // back to the Lobby rather than re-joining with the QR code/PIN.
  startNewRound: () =>
    set({
      selectedCategoryIds: [],
      songs: [],
      guesses: [],
      ratings: [],
      currentSongIndex: 0,
      categorySubmissions: {},
    }),
}))

// Grouped by category (in selection order) rather than raw insertion order,
// so the play queue always goes category-by-category even if a player
// happened to submit songs for multiple categories interleaved with
// everyone else's autofilled ones.
export function getCurrentRoundSongs(state: GameState): Song[] {
  if (state.selectedCategoryIds.length === 0) return []
  return state.selectedCategoryIds.flatMap((categoryId) =>
    state.songs.filter((s) => s.categoryId === categoryId)
  )
}
