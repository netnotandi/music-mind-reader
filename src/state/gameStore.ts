import { create } from 'zustand'
import type { Category, Guess, Player, Rating, Song } from '../types'
import { CATEGORIES, MOCK_SONG_POOL, PLAYERS } from './mockData'

interface GameState {
  players: Player[]
  categories: Category[]
  currentPlayerId: string
  isHost: boolean
  selectedCategoryId: string | null
  songs: Song[]
  guesses: Guess[]
  ratings: Rating[]
  currentSongIndex: number

  setCurrentPlayer: (playerId: string) => void
  setIsHost: (isHost: boolean) => void
  selectCategory: (categoryId: string) => void
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
  selectedCategoryId: null,
  songs: [],
  guesses: [],
  ratings: [],
  currentSongIndex: 0,

  setCurrentPlayer: (playerId) => set({ currentPlayerId: playerId }),

  setIsHost: (isHost) => set({ isHost }),

  selectCategory: (categoryId) =>
    set((state) => {
      if (state.selectedCategoryId === categoryId) return state
      // Switching categories starts a fresh round - carrying over songs,
      // guesses, or ratings from a previous selection would let a category
      // look already-submitted or corrupt scoring for the new round.
      return { selectedCategoryId: categoryId, songs: [], guesses: [], ratings: [], currentSongIndex: 0 }
    }),

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
      const categoryId = state.selectedCategoryId
      if (!categoryId) return state
      const missingPlayers = state.players.filter(
        (p) => !state.songs.some((s) => s.playerId === p.id && s.categoryId === categoryId)
      )
      const newSongs = missingPlayers.map((player, i) => {
        const pick = MOCK_SONG_POOL[i % MOCK_SONG_POOL.length]
        const song: Song = {
          id: `${player.id}:${categoryId}`,
          playerId: player.id,
          categoryId,
          title: pick.title,
          artist: pick.artist,
        }
        return song
      })
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
      selectedCategoryId: null,
      songs: [],
      guesses: [],
      ratings: [],
      currentSongIndex: 0,
    }),
}))

export function getCurrentRoundSongs(state: GameState): Song[] {
  if (!state.selectedCategoryId) return []
  return state.songs.filter((s) => s.categoryId === state.selectedCategoryId)
}
