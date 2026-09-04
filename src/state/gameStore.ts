import {
  get as dbGet,
  onValue,
  ref,
  remove as dbRemove,
  serverTimestamp,
  set as dbSet,
  update as dbUpdate,
} from 'firebase/database'
import { create } from 'zustand'
import { db } from '../firebase'
import type { Category, Guess, Player, Rating, Song } from '../types'
import { CATEGORIES } from './mockData'

export const MAX_SELECTED_CATEGORIES = 3

export const ROOM_CODE_LENGTH = 5
// No I/O/0/1 - easy to misread out loud or on a small screen.
const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

const SESSION_KEY = 'mmr_session'

type Phase = 'lobby' | 'submit' | 'guess' | 'results'
type JoinResult = 'ok' | 'not-found' | 'full'

interface GameState {
  roomCode: string | null
  localPlayerId: string | null
  hostId: string | null
  maxPlayers: number | null
  phase: Phase
  players: Player[]
  categories: Category[]
  selectedCategoryIds: string[]
  songs: Song[]
  guesses: Guess[]
  ratings: Rating[]
  currentSongIndex: number
  songOrder: string[]
  confirmedPlayerIds: string[]

  createGame: (hostName: string, maxPlayers: number, selectedCategoryIds: string[]) => Promise<string>
  joinGame: (roomCode: string, playerName: string) => Promise<JoinResult>
  resumeSession: () => Promise<boolean>
  leaveGame: () => void
  startSubmitting: () => void
  submitSong: (categoryId: string, title: string, artist: string) => void
  shuffleSongOrder: () => void
  submitGuess: (songId: string, guessedPlayerId: string) => void
  clearGuess: (songId: string) => void
  submitRating: (songId: string, value: number) => void
  nextSong: () => void
  prevSong: () => void
  // Only these two can end the guess phase - nextSong() alone never does,
  // so the group can never be swept into Results by one impatient click.
  confirmFinalAnswers: () => void
  finishRound: () => void

  // Dev-only: write on behalf of an arbitrary player, bypassing the normal
  // "always write as yourself" rule. Backs the "test the flow solo" buttons
  // in SubmitSong/GuessAndRate, which are themselves hidden outside of
  // `import.meta.env.DEV` - a real player's device should never be able to
  // submit answers for someone else.
  devSubmitSongAs: (playerId: string, categoryId: string, title: string, artist: string) => void
  devSubmitGuessAs: (playerId: string, songId: string, guessedPlayerId: string) => void
  devSubmitRatingAs: (playerId: string, songId: string, value: number) => void
}

function loadSession(): { roomCode: string; playerId: string } | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveSession(roomCode: string, playerId: string) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ roomCode, playerId }))
  } catch {
    // localStorage unavailable (private browsing etc.) - session just won't persist.
  }
}

function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    // ignore
  }
}

function generateRoomCode(): string {
  let code = ''
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)]
  }
  return code
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

interface RoomRecord {
  hostId?: string
  maxPlayers?: number
  phase?: Phase
  selectedCategoryIds?: string[]
  currentSongIndex?: number
  songOrder?: string[]
  players?: Record<string, { name: string; joinedAt: number }>
  songs?: Record<string, { playerId: string; categoryId: string; title: string; artist: string }>
  guesses?: Record<string, Guess>
  ratings?: Record<string, Rating>
  finalConfirmations?: Record<string, true>
}

// Firebase stores children as objects keyed by id, not arrays - converted
// back to the array shapes the rest of the app already expects, so
// scoring.ts and every screen need zero changes beyond where data comes from.
function parseRoom(data: RoomRecord) {
  const players: Player[] = Object.entries(data.players ?? {})
    .sort(([, a], [, b]) => (a.joinedAt ?? 0) - (b.joinedAt ?? 0))
    .map(([id, p]) => ({ id, name: p.name }))

  const songs: Song[] = Object.entries(data.songs ?? {}).map(([id, s]) => ({ id, ...s }))
  const guesses: Guess[] = Object.values(data.guesses ?? {})
  const ratings: Rating[] = Object.values(data.ratings ?? {})

  return {
    hostId: data.hostId ?? null,
    maxPlayers: data.maxPlayers ?? null,
    phase: data.phase ?? 'lobby',
    players,
    selectedCategoryIds: data.selectedCategoryIds ?? [],
    songs,
    guesses,
    ratings,
    currentSongIndex: data.currentSongIndex ?? 0,
    songOrder: data.songOrder ?? [],
    confirmedPlayerIds: Object.keys(data.finalConfirmations ?? {}),
  }
}

// Held outside the store (not reactive state) - just needs to survive across
// actions so leaveGame/resumeSession can detach the previous listener.
let detachListener: (() => void) | null = null

export const useGameStore = create<GameState>((set, get) => {
  function attachListener(roomCode: string, playerId: string) {
    detachListener?.()
    const unsubscribe = onValue(ref(db, `games/${roomCode}`), (snapshot) => {
      const data = snapshot.val() as RoomRecord | null
      if (!data) return
      set({ roomCode, localPlayerId: playerId, ...parseRoom(data) })
    })
    detachListener = unsubscribe
  }

  return {
    roomCode: null,
    localPlayerId: null,
    hostId: null,
    maxPlayers: null,
    phase: 'lobby',
    players: [],
    categories: CATEGORIES,
    selectedCategoryIds: [],
    songs: [],
    guesses: [],
    ratings: [],
    currentSongIndex: 0,
    songOrder: [],
    confirmedPlayerIds: [],

    createGame: async (hostName, maxPlayers, selectedCategoryIds) => {
      const playerId = crypto.randomUUID()
      let roomCode = generateRoomCode()
      while ((await dbGet(ref(db, `games/${roomCode}`))).exists()) {
        roomCode = generateRoomCode()
      }
      await dbSet(ref(db, `games/${roomCode}`), {
        createdAt: serverTimestamp(),
        hostId: playerId,
        maxPlayers,
        phase: 'lobby',
        selectedCategoryIds,
        currentSongIndex: 0,
        songOrder: [],
        players: { [playerId]: { name: hostName, joinedAt: serverTimestamp() } },
      })
      saveSession(roomCode, playerId)
      attachListener(roomCode, playerId)
      return roomCode
    },

    joinGame: async (roomCode, playerName) => {
      const snap = await dbGet(ref(db, `games/${roomCode}`))
      if (!snap.exists()) return 'not-found'
      const data = snap.val() as RoomRecord
      const currentCount = Object.keys(data.players ?? {}).length
      if (data.maxPlayers !== undefined && currentCount >= data.maxPlayers) return 'full'

      const playerId = crypto.randomUUID()
      await dbSet(ref(db, `games/${roomCode}/players/${playerId}`), {
        name: playerName,
        joinedAt: serverTimestamp(),
      })
      saveSession(roomCode, playerId)
      attachListener(roomCode, playerId)
      return 'ok'
    },

    resumeSession: async () => {
      const session = loadSession()
      if (!session) return false
      const snap = await dbGet(ref(db, `games/${session.roomCode}`))
      if (!snap.exists()) {
        clearSession()
        return false
      }
      attachListener(session.roomCode, session.playerId)
      return true
    },

    leaveGame: () => {
      const { roomCode, localPlayerId } = get()
      if (roomCode && localPlayerId) {
        dbRemove(ref(db, `games/${roomCode}/players/${localPlayerId}`)).catch(() => {})
      }
      detachListener?.()
      detachListener = null
      clearSession()
      set({
        roomCode: null,
        localPlayerId: null,
        hostId: null,
        maxPlayers: null,
        phase: 'lobby',
        players: [],
        selectedCategoryIds: [],
        songs: [],
        guesses: [],
        ratings: [],
        currentSongIndex: 0,
        songOrder: [],
        confirmedPlayerIds: [],
      })
    },

    startSubmitting: () => {
      const { roomCode } = get()
      if (!roomCode) return
      dbUpdate(ref(db, `games/${roomCode}`), { phase: 'submit' })
    },

    submitSong: (categoryId, title, artist) => {
      const { roomCode, localPlayerId } = get()
      if (!roomCode || !localPlayerId) return
      const songId = `${localPlayerId}__${categoryId}`
      dbSet(ref(db, `games/${roomCode}/songs/${songId}`), {
        playerId: localPlayerId,
        categoryId,
        title,
        artist,
      })
    },

    // Songs would otherwise always play back in submission order, which is
    // just the order players happened to submit in - an easy tell for whose
    // song is up next. Shuffled once here, and this is also the moment
    // guessing actually starts for everyone.
    shuffleSongOrder: () => {
      const { roomCode, selectedCategoryIds, songs } = get()
      if (!roomCode) return
      const songOrder = selectedCategoryIds.flatMap((categoryId) =>
        shuffle(songs.filter((s) => s.categoryId === categoryId)).map((s) => s.id)
      )
      dbUpdate(ref(db, `games/${roomCode}`), { songOrder, phase: 'guess', finalConfirmations: null })
    },

    // Also clears this player's own final confirmation, if they'd already
    // given one - "final" has to mean final, so changing an answer after
    // confirming has to ask them to confirm again.
    submitGuess: (songId, guessedPlayerId) => {
      const { roomCode, localPlayerId } = get()
      if (!roomCode || !localPlayerId) return
      const guessId = `${songId}__${localPlayerId}`
      dbUpdate(ref(db, `games/${roomCode}`), {
        [`guesses/${guessId}`]: { songId, guesserId: localPlayerId, guessedPlayerId },
        [`finalConfirmations/${localPlayerId}`]: null,
      })
    },

    clearGuess: (songId) => {
      const { roomCode, localPlayerId } = get()
      if (!roomCode || !localPlayerId) return
      dbRemove(ref(db, `games/${roomCode}/guesses/${songId}__${localPlayerId}`))
    },

    submitRating: (songId, value) => {
      const { roomCode, localPlayerId } = get()
      if (!roomCode || !localPlayerId) return
      const ratingId = `${songId}__${localPlayerId}`
      dbUpdate(ref(db, `games/${roomCode}`), {
        [`ratings/${ratingId}`]: { songId, raterId: localPlayerId, value },
        [`finalConfirmations/${localPlayerId}`]: null,
      })
    },

    // Only ever advances to another song - never ends the round itself
    // (see finishRound), so nobody can be swept into Results by someone
    // else clicking through the last song.
    nextSong: () => {
      const { roomCode, currentSongIndex, songOrder } = get()
      if (!roomCode || currentSongIndex >= songOrder.length - 1) return
      dbUpdate(ref(db, `games/${roomCode}`), { currentSongIndex: currentSongIndex + 1 })
    },

    prevSong: () => {
      const { roomCode, currentSongIndex } = get()
      if (!roomCode) return
      dbUpdate(ref(db, `games/${roomCode}`), { currentSongIndex: Math.max(currentSongIndex - 1, 0) })
    },

    confirmFinalAnswers: () => {
      const { roomCode, localPlayerId } = get()
      if (!roomCode || !localPlayerId) return
      dbUpdate(ref(db, `games/${roomCode}`), { [`finalConfirmations/${localPlayerId}`]: true })
    },

    // The only action that ends the guess phase - only reachable once
    // every player has confirmed (enforced in the UI, not here), so the
    // group only ever moves to Results once everyone has explicitly agreed.
    finishRound: () => {
      const { roomCode } = get()
      if (!roomCode) return
      dbUpdate(ref(db, `games/${roomCode}`), { phase: 'results' })
    },

    devSubmitSongAs: (playerId, categoryId, title, artist) => {
      const { roomCode } = get()
      if (!roomCode) return
      const songId = `${playerId}__${categoryId}`
      dbSet(ref(db, `games/${roomCode}/songs/${songId}`), { playerId, categoryId, title, artist })
    },

    devSubmitGuessAs: (playerId, songId, guessedPlayerId) => {
      const { roomCode } = get()
      if (!roomCode) return
      const guessId = `${songId}__${playerId}`
      dbSet(ref(db, `games/${roomCode}/guesses/${guessId}`), {
        songId,
        guesserId: playerId,
        guessedPlayerId,
      })
    },

    devSubmitRatingAs: (playerId, songId, value) => {
      const { roomCode } = get()
      if (!roomCode) return
      const ratingId = `${songId}__${playerId}`
      dbSet(ref(db, `games/${roomCode}/ratings/${ratingId}`), { songId, raterId: playerId, value })
    },
  }
})

// Grouped by category (in selection order), and within each category in
// songOrder (shuffled once via shuffleSongOrder) rather than raw submission
// order - otherwise the play queue always went in the order players happened
// to submit in, an easy tell for whose song was up next. Falls back to
// submission order if songOrder hasn't been populated yet (e.g. mid-submission).
export function getCurrentRoundSongs(state: {
  selectedCategoryIds: string[]
  songs: Song[]
  songOrder: string[]
}): Song[] {
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