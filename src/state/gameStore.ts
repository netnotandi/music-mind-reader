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

  setCurrentPlayer: (playerId: string) => void
  setIsHost: (isHost: boolean) => void
  toggleCategory: (categoryId: string) => void
  confirmCategories: () => void
  submitSong: (playerId: string, categoryId: string, title: string, artist: string) => void
  autofillRemainingSongs: () => void
  submitGuess: (songId: string, guesserId: string, guessedPlayerId: string) => void
  submitRating: (songId: string, raterId: string, value: number) => void
  nextSong: () => void
  prevSong: () => void
  resetGame: () => void
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
  confirmCategories: () => set({ songs: [], guesses: [], ratings: [], currentSongIndex: 0 }),

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

  nextSong: () =>
    set((state) => ({
      currentSongIndex: Math.min(state.currentSongIndex + 1, getCurrentRoundSongs(state).length - 1),
    })),

  prevSong: () => set((state) => ({ currentSongIndex: Math.max(state.currentSongIndex - 1, 0) })),

  resetGame: () =>
    set({
      isHost: false,
      selectedCategoryIds: [],
      songs: [],
      guesses: [],
      ratings: [],
      currentSongIndex: 0,
    }),
}))

export function getCurrentRoundSongs(state: GameState): Song[] {
  if (state.selectedCategoryIds.length === 0) return []
  return state.songs.filter((s) => state.selectedCategoryIds.includes(s.categoryId))
}
