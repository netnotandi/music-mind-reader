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
  songOrder: string[]

  setCurrentPlayer: (playerId: string) => void
  setIsHost: (isHost: boolean) => void
  toggleCategory: (categoryId: string) => void
  confirmCategories: () => void
  submitSong: (playerId: string, categoryId: string, title: string, artist: string) => void
  autofillRemainingSongs: () => void
  shuffleSongOrder: () => void
  submitGuess: (songId: string, guesserId: string, guessedPlayerId: string) => void
  clearGuess: (songId: string, guesserId: string) => void
  submitRating: (songId: string, raterId: string, value: number) => void
  nextSong: () => void
  prevSong: () => void
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
  songOrder: [],

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
  // over songs, guesses, or ratings from a previous selection would let a
  // category look already-submitted or corrupt scoring for the new one.
  confirmCategories: () =>
    set({ songs: [], guesses: [], ratings: [], currentSongIndex: 0, songOrder: [] }),

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

  // Songs would otherwise always play back in submission order, which is
  // just the order players happened to pick their name/category in - an
  // easy tell for whose song is up next. Shuffled once here (not derived on
  // every read) so the order stays stable while guessing is in progress.
  shuffleSongOrder: () =>
    set((state) => ({
      songOrder: state.selectedCategoryIds.flatMap((categoryId) =>
        shuffle(state.songs.filter((s) => s.categoryId === categoryId)).map((s) => s.id)
      ),
    })),

  submitGuess: (songId, guesserId, guessedPlayerId) =>
    set((state) => ({
      guesses: [
        ...state.guesses.filter((g) => !(g.songId === songId && g.guesserId === guesserId)),
        { songId, guesserId, guessedPlayerId },
      ],
    })),

  clearGuess: (songId, guesserId) =>
    set((state) => ({
      guesses: state.guesses.filter((g) => !(g.songId === songId && g.guesserId === guesserId)),
    })),

  submitRating: (songId, raterId, value) =>
    set((state) => ({
      ratings: [
        ...state.ratings.filter((r) => !(r.songId === songId && r.raterId === raterId)),
        { songId, raterId, value },
      ],
    })),

  nextSong: () =>
    set((state) => ({
      currentSongIndex: Math.min(state.currentSongIndex + 1, getCurrentRoundSongs(state).length - 1),
    })),

  prevSong: () => set((state) => ({ currentSongIndex: Math.max(state.currentSongIndex - 1, 0) })),

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
      songOrder: [],
    }),
}))

function shuffle<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// Grouped by category (in selection order), and within each category in
// songOrder (shuffled once via shuffleSongOrder) rather than raw submission
// order - otherwise the play queue always went in the order players happened
// to submit in, an easy tell for whose song was up next. Falls back to
// submission order if songOrder hasn't been populated yet (e.g. mid-submission).
export function getCurrentRoundSongs(state: GameState): Song[] {
  if (state.selectedCategoryIds.length === 0) return []
  if (state.songOrder.length > 0) {
    const byId = new Map(state.songs.map((s) => [s.id, s]))
    const ordered = state.songOrder.map((id) => byId.get(id)).filter((s): s is Song => s !== undefined)
    if (ordered.length === state.songs.length) return ordered
  }
  return state.selectedCategoryIds.flatMap((categoryId) =>
    state.songs.filter((s) => s.categoryId === categoryId)
  )
}
