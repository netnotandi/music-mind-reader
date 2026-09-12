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
import { computeFinalScores } from '../logic/scoring'
import type { Category, Guess, Player, Rating, Song } from '../types'
import { CATEGORIES } from './mockData'

export const MAX_SELECTED_CATEGORIES = 1

// Slots in the lobby are organic - the host is never asked a player count,
// the room just grows as people join. This is the only gate on starting a
// round: with 1 it's effectively just "a category is picked", but it's a
// named constant so raising it later (e.g. back to 3-4 for real play) is a
// one-line change.
export const MIN_PLAYERS_TO_START = 1

// Enforced via the input's own maxLength, but names are still rendered in a
// lot of fixed-width places (player lists, guess buttons, tables) - keeping
// this a shared constant so any future input validating a name can match it.
export const MAX_NAME_LENGTH = 20

// Single-select while MAX_SELECTED_CATEGORIES is 1 - picking a different
// category swaps it in immediately instead of requiring the current one to
// be deselected first (which would otherwise just look like the other
// buttons had gone dead).
export function toggleCategorySelection(current: string[], categoryId: string): string[] {
  if (current.includes(categoryId)) return current.filter((id) => id !== categoryId)
  if (MAX_SELECTED_CATEGORIES === 1) return [categoryId]
  if (current.length >= MAX_SELECTED_CATEGORIES) return current
  return [...current, categoryId]
}

export const ROOM_CODE_LENGTH = 5
// No I/O/0/1 - easy to misread out loud or on a small screen.
const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

const SESSION_KEY = 'mmr_session'

type Phase = 'lobby' | 'setup' | 'submit' | 'guess' | 'results'
type JoinResult = 'ok' | 'not-found' | 'in-progress'
export type RoundMode = 'short' | 'long'

// Short mode: the group picks exactly how long each song plays before the
// host's device advances the group - regardless of who has or hasn't
// finished answering. A shorter video's natural end, or the host skipping,
// can still cut it off sooner.
export const SHORT_MODE_CAP_OPTIONS = [60, 90, 120] as const
export type ShortModeCapSeconds = (typeof SHORT_MODE_CAP_OPTIONS)[number]
export const DEFAULT_SHORT_MODE_CAP_SECONDS: ShortModeCapSeconds = 90

interface GameState {
  roomCode: string | null
  localPlayerId: string | null
  hostId: string | null
  phase: Phase
  players: Player[]
  categories: Category[]
  selectedCategoryIds: string[]
  roundMode: RoundMode
  // Short mode: how long a song may play before it advances no matter what.
  shortModeCapSeconds: ShortModeCapSeconds
  songs: Song[]
  guesses: Guess[]
  ratings: Rating[]
  currentSongIndex: number
  songOrder: string[]
  // Set once the group's music has played through the last song - the
  // guess screen switches to the wrap-up / confirm-final-answers state.
  roundPlaythroughDone: boolean
  confirmedPlayerIds: string[]
  roundsCompleted: number
  lobbyReadyPlayerIds: string[]

  createGame: (hostName: string) => Promise<string>
  joinGame: (roomCode: string, playerName: string) => Promise<JoinResult>
  resumeSession: () => Promise<boolean>
  leaveGame: (removeFromRoom?: boolean) => void
  chooseCategories: (categoryIds: string[]) => void
  // Host only: Lobby ("is everyone here?") -> Game Setup (round config).
  startRoundSetup: () => void
  // Host only: back out of Game Setup to the Lobby - reopens joining (the
  // join gate is `phase === 'lobby'`); a picked category is left as-is.
  backToLobby: () => void
  // Host only, from Game Setup: short vs long round, live-synced.
  chooseRoundMode: (mode: RoundMode) => void
  // Host only, from Game Setup: short-mode per-song cap, live-synced.
  chooseShortModeCap: (seconds: ShortModeCapSeconds) => void
  startSubmitting: () => void
  submitSong: (
    categoryId: string,
    title: string,
    artist: string,
    youtubeVideoId: string | null,
    youtubeTitle: string | null
  ) => void
  shuffleSongOrder: () => void
  submitGuess: (songId: string, guessedPlayerId: string) => void
  clearGuess: (songId: string) => void
  submitRating: (songId: string, value: number) => void
  // The single writer for group song progression - only ever called from
  // the host's device (its driver effect / skip button). Advances the
  // shared position, or flips roundPlaythroughDone once past the last song.
  // Group progression is deliberately independent of whether individuals
  // have finished answering - the music never waits.
  advanceGroup: () => void
  confirmFinalAnswers: () => void
  finishRound: () => void
  // Per-device, like leaveGame - marks this player ready and lets THIS
  // device head to Lobby right away, without waiting for or disturbing
  // anyone still reviewing Results.
  returnToLobby: () => void
  // Folds this round's scores into each player's totalScore and wipes the
  // round-specific fields (songs, guesses, ratings, songOrder,
  // currentSongIndex, selectedCategoryIds, confirmations) - but only once
  // EVERY player has called returnToLobby, so nobody's Results view can be
  // pulled out from under them while they're still looking at it. Safe to
  // call speculatively (e.g. from a watcher) - it's a no-op until ready.
  finalizeRoundIfReady: () => void

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
  phase?: Phase
  selectedCategoryIds?: string[]
  roundMode?: RoundMode
  shortModeCapSeconds?: number
  currentSongIndex?: number
  songOrder?: string[]
  roundPlaythroughDone?: boolean
  roundsCompleted?: number
  lobbyReady?: Record<string, true>
  players?: Record<string, { name: string; joinedAt: number; totalScore?: number }>
  songs?: Record<
    string,
    {
      playerId: string
      categoryId: string
      title: string
      artist: string
      youtubeVideoId?: string
      youtubeTitle?: string
    }
  >
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
    .map(([id, p]) => ({ id, name: p.name, totalScore: p.totalScore ?? 0 }))

  const songs: Song[] = Object.entries(data.songs ?? {}).map(([id, s]) => ({ id, ...s }))
  const guesses: Guess[] = Object.values(data.guesses ?? {})
  const ratings: Rating[] = Object.values(data.ratings ?? {})

  return {
    hostId: data.hostId ?? null,
    phase: data.phase ?? 'lobby',
    players,
    selectedCategoryIds: data.selectedCategoryIds ?? [],
    roundMode: data.roundMode ?? 'short',
    shortModeCapSeconds: (SHORT_MODE_CAP_OPTIONS as readonly number[]).includes(
      data.shortModeCapSeconds ?? -1
    )
      ? (data.shortModeCapSeconds as ShortModeCapSeconds)
      : DEFAULT_SHORT_MODE_CAP_SECONDS,
    songs,
    guesses,
    ratings,
    currentSongIndex: data.currentSongIndex ?? 0,
    songOrder: data.songOrder ?? [],
    roundPlaythroughDone: data.roundPlaythroughDone ?? false,
    confirmedPlayerIds: Object.keys(data.finalConfirmations ?? {}),
    roundsCompleted: data.roundsCompleted ?? 0,
    lobbyReadyPlayerIds: Object.keys(data.lobbyReady ?? {}),
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
    phase: 'lobby',
    players: [],
    categories: CATEGORIES,
    selectedCategoryIds: [],
    roundMode: 'short',
    shortModeCapSeconds: DEFAULT_SHORT_MODE_CAP_SECONDS,
    songs: [],
    guesses: [],
    ratings: [],
    currentSongIndex: 0,
    songOrder: [],
    roundPlaythroughDone: false,
    confirmedPlayerIds: [],
    roundsCompleted: 0,
    lobbyReadyPlayerIds: [],

    createGame: async (hostName) => {
      const playerId = crypto.randomUUID()
      let roomCode = generateRoomCode()
      while ((await dbGet(ref(db, `games/${roomCode}`))).exists()) {
        roomCode = generateRoomCode()
      }
      // No category yet - the host picks it in the Lobby, the same way
      // every round after the first already works.
      await dbSet(ref(db, `games/${roomCode}`), {
        createdAt: serverTimestamp(),
        hostId: playerId,
        phase: 'lobby',
        selectedCategoryIds: [],
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
      // Slots are open only while the room is in the lobby - once a round is
      // underway, would-be joiners wait for it to finish (phase returns to
      // 'lobby' between rounds, so joining then still works).
      if ((data.phase ?? 'lobby') !== 'lobby') {
        // The one exception: reclaiming an existing seat by name, for
        // someone whose session was lost mid-round (closed the app,
        // cleared storage, switched device) and can't just resumeSession()
        // their way back in. There's no presence system to tell a
        // genuinely-missing player from one who's simply active on another
        // tab, so this trusts the name the same way the rest of the game
        // already trusts the room code alone - fine for a friends-only
        // room, not a security boundary. A brand new name is still turned
        // away; reconnecting picks the SAME playerId back up, so their
        // earlier song/guesses/ratings (all keyed on it) come right back.
        const existing = Object.entries(data.players ?? {}).find(
          ([, p]) => p.name.trim().toLowerCase() === playerName.trim().toLowerCase()
        )
        if (!existing) return 'in-progress'
        const [existingPlayerId] = existing
        saveSession(roomCode, existingPlayerId)
        attachListener(roomCode, existingPlayerId)
        return 'ok'
      }

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

    // removeFromRoom (default true) frees this player's seat, which is
    // right for leaving mid-lobby/mid-game - but on Results, the round is
    // already over and everyone's row (songs, scores, titles) should stay
    // visible on everyone else's scoreboard, so that case passes false to
    // just quietly stop syncing without deleting anything from `players`.
    leaveGame: (removeFromRoom = true) => {
      const { roomCode, localPlayerId, hostId, players } = get()
      if (roomCode && localPlayerId) {
        const updates: Record<string, unknown> = {}
        if (removeFromRoom) {
          updates[`players/${localPlayerId}`] = null
        } else {
          // Leaving quietly from Results (kept in the roster): don't let
          // their absence permanently block finalizeRoundIfReady, which
          // waits for every current player to call returnToLobby - someone
          // who has left is never going to click that, so without this the
          // whole group gets stuck forever on "Waiting for everyone to
          // head back to the Lobby...".
          updates[`lobbyReady/${localPlayerId}`] = true
        }
        // Handing off hostId happens in the same multi-path update as the
        // rest, either way, so the room is never briefly hostless for other
        // clients' listeners. The successor is whoever else has been in
        // the room longest (players is joinedAt-ascending) - a simple,
        // deterministic "next in line" rather than picking at random.
        if (localPlayerId === hostId) {
          const successor = players.find((p) => p.id !== localPlayerId)
          updates.hostId = successor?.id ?? null
        }
        dbUpdate(ref(db, `games/${roomCode}`), updates).catch(() => {})
      }
      detachListener?.()
      detachListener = null
      clearSession()
      set({
        roomCode: null,
        localPlayerId: null,
        hostId: null,
        phase: 'lobby',
        players: [],
        selectedCategoryIds: [],
        roundMode: 'short',
        shortModeCapSeconds: DEFAULT_SHORT_MODE_CAP_SECONDS,
        songs: [],
        guesses: [],
        ratings: [],
        currentSongIndex: 0,
        songOrder: [],
        roundPlaythroughDone: false,
        confirmedPlayerIds: [],
        roundsCompleted: 0,
        lobbyReadyPlayerIds: [],
      })
    },

    // Live-synced so the whole group watches the host pick categories for
    // the next round in real time, the same way the player list already
    // updates live - no separate "confirm" step needed.
    chooseCategories: (categoryIds) => {
      const { roomCode } = get()
      if (!roomCode) return
      dbUpdate(ref(db, `games/${roomCode}`), { selectedCategoryIds: categoryIds })
    },

    startRoundSetup: () => {
      const { roomCode } = get()
      if (!roomCode) return
      dbUpdate(ref(db, `games/${roomCode}`), { phase: 'setup' })
    },

    backToLobby: () => {
      const { roomCode } = get()
      if (!roomCode) return
      dbUpdate(ref(db, `games/${roomCode}`), { phase: 'lobby' })
    },

    chooseRoundMode: (mode) => {
      const { roomCode } = get()
      if (!roomCode) return
      dbUpdate(ref(db, `games/${roomCode}`), { roundMode: mode })
    },

    chooseShortModeCap: (seconds) => {
      const { roomCode } = get()
      if (!roomCode) return
      dbUpdate(ref(db, `games/${roomCode}`), { shortModeCapSeconds: seconds })
    },

    startSubmitting: () => {
      const { roomCode } = get()
      if (!roomCode) return
      dbUpdate(ref(db, `games/${roomCode}`), { phase: 'submit' })
    },

    submitSong: (categoryId, title, artist, youtubeVideoId, youtubeTitle) => {
      const { roomCode, localPlayerId } = get()
      if (!roomCode || !localPlayerId) return
      const songId = `${localPlayerId}__${categoryId}`
      dbSet(ref(db, `games/${roomCode}/songs/${songId}`), {
        playerId: localPlayerId,
        categoryId,
        title,
        artist,
        // Firebase rejects `undefined` values outright, so these keys are
        // only included at all once there's an actual value to store.
        ...(youtubeVideoId ? { youtubeVideoId } : {}),
        ...(youtubeTitle ? { youtubeTitle } : {}),
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
      dbUpdate(ref(db, `games/${roomCode}`), {
        songOrder,
        phase: 'guess',
        currentSongIndex: 0,
        roundPlaythroughDone: null,
        finalConfirmations: null,
      })
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

    // Single writer for group progression. Never ends the round itself
    // (finishRound does that, after everyone confirms) - it just moves the
    // shared position along, or, once past the last song, flips
    // roundPlaythroughDone so the guess screen enters wrap-up.
    advanceGroup: () => {
      const { roomCode, currentSongIndex, songOrder, roundPlaythroughDone } = get()
      if (!roomCode || roundPlaythroughDone) return
      if (currentSongIndex < songOrder.length - 1) {
        dbUpdate(ref(db, `games/${roomCode}`), { currentSongIndex: currentSongIndex + 1 })
      } else {
        dbUpdate(ref(db, `games/${roomCode}`), { roundPlaythroughDone: true })
      }
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

    returnToLobby: () => {
      const { roomCode, localPlayerId } = get()
      if (!roomCode || !localPlayerId) return
      dbUpdate(ref(db, `games/${roomCode}`), { [`lobbyReady/${localPlayerId}`]: true })
    },

    // Deliberately re-derives "are we ready" from state rather than trusting
    // a caller's judgment, and writes the exact same result no matter which
    // device's watcher happens to fire it or how many fire it at once - the
    // computed scores/resets only ever depend on the (by now frozen) round
    // data, not on each other, so redundant calls converge to one outcome
    // instead of double-applying anything.
    finalizeRoundIfReady: () => {
      const { roomCode, phase, players, guesses, ratings, roundsCompleted, lobbyReadyPlayerIds } = get()
      if (!roomCode || phase !== 'results' || players.length === 0) return
      if (lobbyReadyPlayerIds.length < players.length) return
      const round = { songs: getCurrentRoundSongs(get()), guesses, ratings }
      const roundScores = computeFinalScores(round)
      const updates: Record<string, unknown> = {
        phase: 'lobby',
        songs: null,
        guesses: null,
        ratings: null,
        songOrder: null,
        currentSongIndex: 0,
        roundPlaythroughDone: null,
        selectedCategoryIds: null,
        finalConfirmations: null,
        lobbyReady: null,
        roundsCompleted: roundsCompleted + 1,
        // roundMode is left as-is - it persists as the group's preference.
      }
      for (const player of players) {
        const roundScore = roundScores[player.id] ?? 0
        if (roundScore !== 0) {
          updates[`players/${player.id}/totalScore`] = (player.totalScore ?? 0) + roundScore
        }
      }
      dbUpdate(ref(db, `games/${roomCode}`), updates)
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