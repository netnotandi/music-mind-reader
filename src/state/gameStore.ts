import {
  get as dbGet,
  onValue,
  ref,
  remove as dbRemove,
  runTransaction,
  serverTimestamp,
  set as dbSet,
  update as dbUpdate,
} from 'firebase/database'
import { create } from 'zustand'
import { trackEvent } from '../analytics'
import { db } from '../firebase'
import { computeCascade } from '../logic/ratingCascade'
import {
  computeCumulativeTitles,
  computeFinalScores,
  computeOverallWinners,
  correctGuessesByTargetThisRound,
  countCorrectGuesses,
  countGuessAttempts,
  countGuessedByOthers,
  guessSequenceForPlayer,
  ownSongRatingStats,
  ratingsGivenByTargetThisRound,
  ratingsGivenStats,
} from '../logic/scoring'
import type { Category, ChatMessage, Guess, Player, Rating, Song } from '../types'
import { CATEGORIES } from './mockData'
import type { CareerStats } from './userStore'
import { useUserStore } from './userStore'

export const MAX_SELECTED_CATEGORIES = 1

// Kept short and forgiving rather than strictly enforced server-side (no
// auth to enforce anything against anyway) - just enough to stop one
// message from dominating the small floating chat panel.
export const MAX_CHAT_MESSAGE_LENGTH = 500

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
// Fresh values rather than reusing the old 'short'/'long' strings - a room
// already mid-game at deploy time might have 'short' stored under the OLD
// meaning (fixed timer), and reusing it for the new auto-advance mode would
// silently change that room's behavior mid-round. See normalizeRoundMode
// below for how legacy values map onto these.
export type RoundMode = 'auto' | 'timer' | 'full'

// Timer mode: the group picks exactly how long each song plays before the
// host's device advances the group - regardless of who has or hasn't
// finished answering. A shorter video's natural end, or the host skipping,
// can still cut it off sooner.
export const SHORT_MODE_CAP_OPTIONS = [60, 90, 120] as const
export type ShortModeCapSeconds = (typeof SHORT_MODE_CAP_OPTIONS)[number]
export const DEFAULT_SHORT_MODE_CAP_SECONDS: ShortModeCapSeconds = 90

// Chosen once, at the very first Game Setup, alongside roundMode/category -
// not re-askable on later rounds (see chooseTotalRounds). Persists across
// rounds the same way roundMode does; unset/older games default to 1 (a
// single-round game, which was already the game's default length).
export const TOTAL_ROUNDS_OPTIONS = [1, 2, 3, 4] as const
export type TotalRounds = (typeof TOTAL_ROUNDS_OPTIONS)[number]
export const DEFAULT_TOTAL_ROUNDS: TotalRounds = 1

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
  // Chosen once at the first Game Setup - how many rounds this game runs
  // for in total, not how many have been played (see roundsCompleted).
  totalRounds: TotalRounds
  // Toggleable on Game Setup by ANYONE (not host-gated, unlike every other
  // setting there) on any round - not a one-time choice, since who's
  // playing remotely can change round to round. Governs whether the
  // floating chat button exists in the room at all.
  remotePlayEnabled: boolean
  chatMessages: ChatMessage[]
  // playerId -> the timestamp of the last message that player has opened
  // the chat panel to see - compared against the latest message's
  // timestamp to decide whose chat button should show red.
  chatLastRead: Record<string, number>
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
  // Guards applyRoundScoresIfNeeded so this round's points are folded into
  // totalScore exactly once, whether that happens the moment the first
  // player heads back to the Lobby or later as finalizeRoundIfReady's
  // fallback. Cleared (null) once finalizeRoundIfReady resets for the next
  // round.
  roundScoresApplied: boolean

  createGame: (hostName: string) => Promise<string>
  joinGame: (roomCode: string, playerName: string) => Promise<JoinResult>
  resumeSession: () => Promise<boolean>
  leaveGame: (removeFromRoom?: boolean) => void
  // Host only, from anywhere in the game (the hamburger menu's Players
  // panel) - for a stray/duplicate row or someone who's genuinely gone and
  // isn't coming back. Applies the exact same "safe to fully delete" vs.
  // "keep the row, just don't let them block the group" rule leaveGame
  // already uses for a self-initiated quiet leave.
  kickPlayer: (playerId: string) => void
  // Client-side only cleanup for a device that discovers its own player row
  // is gone from the room (kicked, or removed some other way) - same local
  // reset leaveGame does, but never writes anything back to a room this
  // device no longer belongs to. See the watcher in App.tsx.
  handleRemovedFromRoom: () => void
  chooseCategories: (categoryIds: string[]) => void
  // Host only: Lobby ("is everyone here?") -> Game Setup (round config).
  startRoundSetup: () => void
  // Host only, shown in the Lobby once the pre-committed round count has
  // been fully played: wipes totalScore and every cumulative counter back
  // to 0 for every player and resets roundsCompleted, so the SAME room
  // (same code, same players) can play an entirely fresh game rather than
  // everyone having to leave and re-join a new one.
  startNewGame: () => void
  // Host only: back out of Game Setup to the Lobby - reopens joining (the
  // join gate is `phase === 'lobby'`); a picked category is left as-is.
  backToLobby: () => void
  // Host only, from Game Setup: short vs long round, live-synced.
  chooseRoundMode: (mode: RoundMode) => void
  // Host only, from Game Setup: short-mode per-song cap, live-synced.
  chooseShortModeCap: (seconds: ShortModeCapSeconds) => void
  // Host only, and only meaningful before the first round (roundsCompleted
  // === 0) - how many rounds this game will run for. Live-synced like the
  // other Game Setup pickers.
  chooseTotalRounds: (rounds: TotalRounds) => void
  // From Game Setup, but deliberately NOT gated to the host - anyone can
  // flip this on/off on any round, since who's joining remotely can change
  // round to round and the host might not always be the one to notice.
  setRemotePlayEnabled: (enabled: boolean) => void
  // Only meaningful while remotePlayEnabled is on. Trimmed/length-capped
  // client-side; empty messages are dropped rather than sent.
  sendChatMessage: (text: string) => void
  // Marks every message sent so far as read by this player - called when
  // they open the chat panel.
  markChatRead: () => void
  // Adds this player's reaction to a message, or removes it if they'd
  // already reacted with that same emoji - a toggle, same as clicking it
  // again to undo, the way every other reaction picker works.
  toggleChatReaction: (messageId: string, emoji: string) => void
  startSubmitting: () => void
  submitSong: (
    categoryId: string,
    title: string,
    artist: string,
    youtubeVideoId: string | null,
    youtubeTitle: string | null
  ) => void
  // Undoes a submission so the progress table's checkmark honestly reflects
  // "nothing picked yet" while the player is mid-way through choosing a
  // replacement - called from "Choose new song", not exposed as its own
  // button.
  clearSong: (categoryId: string) => void
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
  // For the pre-committed last round's "Final Scoretable" flow: folds this
  // round's score in early (same idempotent operation returnToLobby below
  // triggers, just called sooner) so the cumulative award cards about to
  // be shown already reflect this round's contribution, instead of only
  // picking it up later once the player actually continues past the cards.
  applyFinalRoundScores: () => Promise<void>
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
  // string, not RoundMode - a room from before this type's values were
  // renamed could still have the legacy 'short'/'long' strings stored; see
  // normalizeRoundMode.
  roundMode?: string
  shortModeCapSeconds?: number
  totalRounds?: number
  remotePlayEnabled?: boolean
  chat?: Record<
    string,
    {
      senderId: string
      senderName: string
      text: string
      timestamp: number
      reactions?: Record<string, Record<string, true>>
    }
  >
  chatLastRead?: Record<string, number>
  currentSongIndex?: number
  songOrder?: string[]
  roundPlaythroughDone?: boolean
  roundsCompleted?: number
  lobbyReady?: Record<string, true>
  roundScoresApplied?: boolean
  players?: Record<
    string,
    {
      name: string
      uid?: string
      joinedAt: number
      totalScore?: number
      cumulativeCorrectGuesses?: number
      cumulativeRatingSum?: number
      cumulativeOwnedSongCount?: number
      cumulativeGuessedByOthersCount?: number
      cumulativeCorrectGuessesByTarget?: Record<string, number>
      cumulativeRatingGivenByTarget?: Record<string, { sum: number; count: number }>
    }
  >
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

// Maps whatever's actually stored onto the current RoundMode union - a room
// created before this rename might still have the legacy 'short' (fixed
// timer) or 'long' (full song) values sitting in Firebase, and those need to
// keep behaving exactly as they did before rather than silently picking up
// the new 'auto' meaning just because the string 'short' used to mean that.
function normalizeRoundMode(raw: unknown): RoundMode {
  if (raw === 'auto' || raw === 'timer' || raw === 'full') return raw
  if (raw === 'long') return 'full'
  return 'timer'
}

// Firebase stores children as objects keyed by id, not arrays - converted
// back to the array shapes the rest of the app already expects, so
// scoring.ts and every screen need zero changes beyond where data comes from.
function parseRoom(data: RoomRecord) {
  const players: Player[] = Object.entries(data.players ?? {})
    .sort(([, a], [, b]) => (a.joinedAt ?? 0) - (b.joinedAt ?? 0))
    .map(([id, p]) => ({
      id,
      name: p.name,
      uid: p.uid,
      totalScore: p.totalScore ?? 0,
      cumulativeCorrectGuesses: p.cumulativeCorrectGuesses ?? 0,
      cumulativeRatingSum: p.cumulativeRatingSum ?? 0,
      cumulativeOwnedSongCount: p.cumulativeOwnedSongCount ?? 0,
      cumulativeGuessedByOthersCount: p.cumulativeGuessedByOthersCount ?? 0,
      cumulativeCorrectGuessesByTarget: p.cumulativeCorrectGuessesByTarget ?? {},
      cumulativeRatingGivenByTarget: p.cumulativeRatingGivenByTarget ?? {},
    }))

  const songs: Song[] = Object.entries(data.songs ?? {}).map(([id, s]) => ({ id, ...s }))
  const guesses: Guess[] = Object.values(data.guesses ?? {})
  const ratings: Rating[] = Object.values(data.ratings ?? {})
  const chatMessages: ChatMessage[] = Object.entries(data.chat ?? {})
    .map(([id, m]) => ({ id, ...m }))
    .sort((a, b) => a.timestamp - b.timestamp)

  return {
    hostId: data.hostId ?? null,
    phase: data.phase ?? 'lobby',
    players,
    selectedCategoryIds: data.selectedCategoryIds ?? [],
    roundMode: normalizeRoundMode(data.roundMode),
    shortModeCapSeconds: (SHORT_MODE_CAP_OPTIONS as readonly number[]).includes(
      data.shortModeCapSeconds ?? -1
    )
      ? (data.shortModeCapSeconds as ShortModeCapSeconds)
      : DEFAULT_SHORT_MODE_CAP_SECONDS,
    totalRounds: (TOTAL_ROUNDS_OPTIONS as readonly number[]).includes(data.totalRounds ?? -1)
      ? (data.totalRounds as TotalRounds)
      : DEFAULT_TOTAL_ROUNDS,
    remotePlayEnabled: data.remotePlayEnabled ?? false,
    chatMessages,
    chatLastRead: data.chatLastRead ?? {},
    songs,
    guesses,
    ratings,
    currentSongIndex: data.currentSongIndex ?? 0,
    songOrder: data.songOrder ?? [],
    roundPlaythroughDone: data.roundPlaythroughDone ?? false,
    confirmedPlayerIds: Object.keys(data.finalConfirmations ?? {}),
    roundsCompleted: data.roundsCompleted ?? 0,
    lobbyReadyPlayerIds: Object.keys(data.lobbyReady ?? {}),
    roundScoresApplied: data.roundScoresApplied ?? false,
  }
}

// Held outside the store (not reactive state) - just needs to survive across
// actions so leaveGame/resumeSession can detach the previous listener.
let detachListener: (() => void) | null = null

export const useGameStore = create<GameState>((set, get) => {
  // Folds this round's scores into each player's totalScore exactly once -
  // called both the moment the first player heads back to the Lobby (so the
  // leaderboard is already correct for them, instead of everyone having to
  // wait for the last straggler) and again, as a fallback, from
  // finalizeRoundIfReady once every player is ready. Several players can
  // trigger this within the same instant (everyone clicking "Go to Lobby"
  // at once), so a plain "read roundScoresApplied, then write" guard isn't
  // enough - two calls can both read it as false before either's write
  // lands, double- or triple-applying the round's points (seen for real:
  // three players landed on 3x their actual score). A transaction on the
  // flag itself makes the claim atomic - only the caller that actually
  // flips it from falsy to true goes on to compute and write the scores.
  async function applyRoundScoresIfNeeded() {
    const { roomCode } = get()
    if (!roomCode) return
    let wonClaim = false
    await runTransaction(ref(db, `games/${roomCode}/roundScoresApplied`), (current) => {
      if (current) return current
      wonClaim = true
      return true
    })
    if (!wonClaim) return
    const { players, guesses, ratings } = get()
    const round = { songs: getCurrentRoundSongs(get()), guesses, ratings }
    const roundScores = computeFinalScores(round)
    const updates: Record<string, unknown> = {}
    for (const player of players) {
      const roundScore = roundScores[player.id] ?? 0
      if (roundScore !== 0) {
        updates[`players/${player.id}/totalScore`] = (player.totalScore ?? 0) + roundScore
      }
      // Folded in alongside totalScore, never reset between rounds - the
      // running totals computeCumulativeTitles reads to build the Final
      // Scoretable award cards once every pre-committed round is done.
      const { sum: ratingSum, count: ownedSongCount } = ownSongRatingStats(round, player.id)
      updates[`players/${player.id}/cumulativeCorrectGuesses`] =
        (player.cumulativeCorrectGuesses ?? 0) + countCorrectGuesses(round, player.id)
      updates[`players/${player.id}/cumulativeRatingSum`] = (player.cumulativeRatingSum ?? 0) + ratingSum
      updates[`players/${player.id}/cumulativeOwnedSongCount`] =
        (player.cumulativeOwnedSongCount ?? 0) + ownedSongCount
      updates[`players/${player.id}/cumulativeGuessedByOthersCount`] =
        (player.cumulativeGuessedByOthersCount ?? 0) + countGuessedByOthers(round, player.id)

      // Pairwise - feeds computeGameStatsForViewer's personal lines at
      // game-end (who guessed YOUR songs most, who YOU guessed most, most
      // in sync), since raw guesses/ratings don't survive past this round.
      const guessesByTarget = correctGuessesByTargetThisRound(round, player.id)
      for (const [targetId, count] of Object.entries(guessesByTarget)) {
        updates[`players/${player.id}/cumulativeCorrectGuessesByTarget/${targetId}`] =
          (player.cumulativeCorrectGuessesByTarget?.[targetId] ?? 0) + count
      }
      const ratingsByTarget = ratingsGivenByTargetThisRound(round, player.id)
      for (const [targetId, { sum, count }] of Object.entries(ratingsByTarget)) {
        const existing = player.cumulativeRatingGivenByTarget?.[targetId] ?? { sum: 0, count: 0 }
        updates[`players/${player.id}/cumulativeRatingGivenByTarget/${targetId}/sum`] = existing.sum + sum
        updates[`players/${player.id}/cumulativeRatingGivenByTarget/${targetId}/count`] = existing.count + count
      }
    }
    if (Object.keys(updates).length > 0) {
      // Awaited (not fire-and-forget) so a caller that awaits
      // applyRoundScoresIfNeeded() - see finalizeRoundIfReady below - can
      // rely on the score computation having actually finished reading
      // songs/guesses/ratings before doing anything that might clear them.
      await dbUpdate(ref(db, `games/${roomCode}`), updates)
    }
  }

  // Folds THIS device's own signed-in account's career stats into
  // users/{uid}/careerStats - a permanent, account-scoped tally across every
  // room this account ever plays, separate from the room-scoped cumulative
  // fields on Player that applyRoundScoresIfNeeded folds above (those are
  // wiped per room by startNewGame).
  //
  // Unlike applyRoundScoresIfNeeded, this can NOT be done once by whichever
  // device wins a shared claim: there are no Cloud Functions in this project
  // (client-direct Firebase), and RTDB rules can only authorize a write by
  // whoever is actually signed in on the device making it - a device can
  // write users/{its own uid}/careerStats, never anyone else's. So every
  // signed-in player's own device calls this itself, from returnToLobby()
  // below, which already runs once per round on every player's own device.
  async function applyCareerStatsIfNeeded() {
    const { roomCode, localPlayerId, players, guesses, ratings, roundsCompleted, totalRounds, phase } = get()
    if (!roomCode || !localPlayerId) return
    // A legitimate call always happens while THIS round's Results screen is
    // still up - finalizeRoundIfReady (which flips phase away from
    // 'results') can't have run yet, since it requires every player
    // INCLUDING this one to already be lobbyReady, and this call fires
    // before this player's own readiness write below. A stale replay (e.g.
    // browser back button to an already-finalized Results screen) always
    // finds phase already moved on, and must bail here rather than re-fold
    // roundsPlayed/gamesPlayed/titleCounts a second time - unlike the
    // room-scoped fold above, those aren't naturally zero on a repeat call
    // (players' cumulative fields don't get wiped between rounds).
    if (phase !== 'results') return
    const uid = useUserStore.getState().uid
    if (!uid) return
    // Only fold stats for the account that was actually signed in when this
    // room's player record was created - a device that's since signed into
    // a different account (or signed out) must not attribute this player's
    // round to the wrong (or no) account.
    const localPlayer = players.find((p) => p.id === localPlayerId)
    if (!localPlayer || localPlayer.uid !== uid) return

    // Same transaction-claim shape as roundScoresApplied above, just scoped
    // under this account's own permanent tree instead of the room's
    // ephemeral one - guards React StrictMode's dev-mode double-invoke and
    // any accidental repeat call for the same round.
    const claimKey = `${roomCode}_${roundsCompleted}`
    let wonClaim = false
    await runTransaction(ref(db, `users/${uid}/careerStats/_appliedRounds/${claimKey}`), (current) => {
      if (current) return current
      wonClaim = true
      return true
    })
    if (!wonClaim) return

    // Round data is still untouched here - the reset only happens later, in
    // finalizeRoundIfReady, once every player has called returnToLobby.
    const round = { songs: getCurrentRoundSongs(get()), guesses, ratings }

    const statsSnap = await dbGet(ref(db, `users/${uid}/careerStats`))
    const stats = (statsSnap.val() ?? {}) as CareerStats

    const { sum: receivedSum, count: receivedCount } = ownSongRatingStats(round, localPlayerId)
    const { sum: givenSum, count: givenCount } = ratingsGivenStats(round, localPlayerId)

    let streak = stats.currentGuessStreak ?? 0
    let longestStreak = stats.longestGuessStreak ?? 0
    for (const correct of guessSequenceForPlayer(round, localPlayerId)) {
      streak = correct ? streak + 1 : 0
      if (streak > longestStreak) longestStreak = streak
    }

    const updates: Record<string, unknown> = {
      [`users/${uid}/careerStats/roundsPlayed`]: (stats.roundsPlayed ?? 0) + 1,
      [`users/${uid}/careerStats/totalCorrectGuesses`]:
        (stats.totalCorrectGuesses ?? 0) + countCorrectGuesses(round, localPlayerId),
      [`users/${uid}/careerStats/totalGuessAttempts`]:
        (stats.totalGuessAttempts ?? 0) + countGuessAttempts(round, localPlayerId),
      [`users/${uid}/careerStats/totalOwnedSongCount`]: (stats.totalOwnedSongCount ?? 0) + receivedCount,
      [`users/${uid}/careerStats/totalGuessedByOthersCount`]:
        (stats.totalGuessedByOthersCount ?? 0) + countGuessedByOthers(round, localPlayerId),
      [`users/${uid}/careerStats/ratingReceivedSum`]: (stats.ratingReceivedSum ?? 0) + receivedSum,
      [`users/${uid}/careerStats/ratingReceivedCount`]: (stats.ratingReceivedCount ?? 0) + receivedCount,
      [`users/${uid}/careerStats/ratingGivenSum`]: (stats.ratingGivenSum ?? 0) + givenSum,
      [`users/${uid}/careerStats/ratingGivenCount`]: (stats.ratingGivenCount ?? 0) + givenCount,
      [`users/${uid}/careerStats/currentGuessStreak`]: streak,
      [`users/${uid}/careerStats/longestGuessStreak`]: longestStreak,
    }

    // Only true once per whole GAME (not every round) - titles/game count are
    // a game-wide verdict, computed from the by-now-settled players array
    // (fresh here: this fires only after the user has clicked through the
    // Winner reveal, nominations and stats card, long past the same-tick
    // race applyRoundScoresIfNeeded's own comment warns about above).
    if (roundsCompleted + 1 >= totalRounds) {
      const titleCounts = { ...(stats.titleCounts ?? {}) }
      for (const { name, playerId } of computeCumulativeTitles(players)) {
        if (playerId === localPlayerId) titleCounts[name] = (titleCounts[name] ?? 0) + 1
      }
      if (computeOverallWinners(players).includes(localPlayerId)) {
        titleCounts['Game Winner'] = (titleCounts['Game Winner'] ?? 0) + 1
      }
      updates[`users/${uid}/careerStats/gamesPlayed`] = (stats.gamesPlayed ?? 0) + 1
      updates[`users/${uid}/careerStats/titleCounts`] = titleCounts
    }

    await dbUpdate(ref(db), updates)
  }

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
    roundMode: 'timer',
    shortModeCapSeconds: DEFAULT_SHORT_MODE_CAP_SECONDS,
    totalRounds: DEFAULT_TOTAL_ROUNDS,
    remotePlayEnabled: false,
    chatMessages: [],
    chatLastRead: {},
    songs: [],
    guesses: [],
    ratings: [],
    currentSongIndex: 0,
    songOrder: [],
    roundPlaythroughDone: false,
    confirmedPlayerIds: [],
    roundsCompleted: 0,
    lobbyReadyPlayerIds: [],
    roundScoresApplied: false,

    createGame: async (hostName) => {
      const playerId = crypto.randomUUID()
      let roomCode = generateRoomCode()
      while ((await dbGet(ref(db, `games/${roomCode}`))).exists()) {
        roomCode = generateRoomCode()
      }
      // Only attached if signed in at this exact moment - anonymous hosts
      // get no uid field at all, never retroactively added (see PlayersPanel
      // in MenuOverlay.tsx, which uses this to offer "Add friend").
      const hostUid = useUserStore.getState().uid
      // No category yet - the host picks it in the Lobby, the same way
      // every round after the first already works.
      await dbSet(ref(db, `games/${roomCode}`), {
        createdAt: serverTimestamp(),
        hostId: playerId,
        phase: 'lobby',
        selectedCategoryIds: [],
        currentSongIndex: 0,
        songOrder: [],
        players: {
          [playerId]: { name: hostName, joinedAt: serverTimestamp(), ...(hostUid ? { uid: hostUid } : {}) },
        },
      })
      saveSession(roomCode, playerId)
      attachListener(roomCode, playerId)
      trackEvent('game_created')
      return roomCode
    },

    joinGame: async (roomCode, playerName) => {
      const snap = await dbGet(ref(db, `games/${roomCode}`))
      if (!snap.exists()) return 'not-found'
      const data = snap.val() as RoomRecord
      const phase = data.phase ?? 'lobby'

      // Reclaim an existing seat by name instead of creating a duplicate,
      // whenever a name match can only mean "this is that player coming
      // back" rather than two different people who happen to share a
      // name: always true once a round is under way (a genuinely new
      // person can't join mid-round at all, so any match there IS a
      // reconnect - closed the app, cleared storage, switched device,
      // can't just resumeSession() back in), and also once the room has
      // completed at least one round, since a "quiet" leave (Results'
      // Leave Game, or leaving mid-round - see leaveGame) deliberately
      // keeps a scored row sitting in `players` for exactly this. A
      // brand-new lobby (no rounds played yet) is left alone - two
      // different friends both typing "Alex" there should get two
      // separate seats, not one contested one. There's no presence system
      // to tell a truly-departed player from one active on another tab,
      // so this trusts the name the way the rest of the game already
      // trusts the room code alone - fine for a friends-only room, not a
      // security boundary. Reclaiming picks the SAME playerId back up, so
      // whatever's keyed on it (song, guesses, ratings, totalScore) comes
      // right back.
      const reclaimEligible = phase !== 'lobby' || (data.roundsCompleted ?? 0) > 0
      if (reclaimEligible) {
        const existing = Object.entries(data.players ?? {}).find(
          ([, p]) => p.name.trim().toLowerCase() === playerName.trim().toLowerCase()
        )
        if (existing) {
          const [existingPlayerId] = existing
          // leaveGame marks a departing player lobbyReady/finalConfirmed so
          // their absence can't block the group (see leaveGame) - but that
          // means reconnecting while the room is still on Results would
          // otherwise route straight past it into the Lobby (usePhaseNavigation
          // treats lobbyReady as "already clicked Go to lobby"), skipping the
          // scoreboard for this round entirely. Clear both on the way back in
          // so they land wherever the phase actually says: Results if it's
          // still there to see and confirm, the confirm screen if a round's
          // wrap-up is still going. Harmless to clear when neither applies -
          // nothing reads them outside those two phases anyway.
          dbUpdate(ref(db, `games/${roomCode}`), {
            [`lobbyReady/${existingPlayerId}`]: null,
            [`finalConfirmations/${existingPlayerId}`]: null,
          }).catch(() => {})
          saveSession(roomCode, existingPlayerId)
          attachListener(roomCode, existingPlayerId)
          trackEvent('game_joined')
          return 'ok'
        }
      }

      // Slots are open only while the room is in the lobby - once a round is
      // underway, a genuinely new joiner waits for it to finish (phase
      // returns to 'lobby' between rounds, so joining then still works).
      if (phase !== 'lobby') return 'in-progress'

      const playerId = crypto.randomUUID()
      const joinerUid = useUserStore.getState().uid
      await dbSet(ref(db, `games/${roomCode}/players/${playerId}`), {
        name: playerName,
        joinedAt: serverTimestamp(),
        ...(joinerUid ? { uid: joinerUid } : {}),
      })
      saveSession(roomCode, playerId)
      attachListener(roomCode, playerId)
      trackEvent('game_joined')
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

    // removeFromRoom (default true) asks to free this player's seat - only
    // actually honoured in the very first Lobby, before any round has
    // played (roundsCompleted === 0), where nothing depends on them yet.
    // Once a round has started, other players' guesses, this player's own
    // song/answers, and the confirm/lobbyReady gates below all reference
    // them by id - deleting the row would orphan that data or leave a gate
    // no one can ever satisfy. And once at least one round has completed,
    // deleting the row would also throw away their totalScore, which lives
    // on that same row - a returning Lobby between rounds is NOT the same
    // as the fresh one, even though `phase` reads 'lobby' in both. Every
    // other case keeps the row in place instead (previously only the
    // Results "Leave Game" did this) - it's also what lets joinGame's
    // name-based reconnect find them again later and pick up exactly where
    // they left off, score included.
    leaveGame: (removeFromRoom = true) => {
      const { roomCode, localPlayerId, hostId, players, phase, roundsCompleted } = get()
      if (roomCode && localPlayerId) {
        const updates: Record<string, unknown> = {}
        if (removeFromRoom && phase === 'lobby' && roundsCompleted === 0) {
          updates[`players/${localPlayerId}`] = null
        } else {
          // Don't let their absence permanently block either "everyone
          // must acknowledge" gate: returning from Results to the Lobby
          // (finalizeRoundIfReady waits on lobbyReady from every current
          // player), and confirming final answers at the end of a round
          // (the "See Results" button waits on finalConfirmations the same
          // way) - someone who has left is never going to click either
          // button. Both get wiped clean at the start of the next round
          // regardless, and reconnecting mid-round to actually submit an
          // answer clears finalConfirmations again automatically (see
          // submitGuess/submitRating), so this can't paper over a real
          // answer with a stale "confirmed".
          updates[`lobbyReady/${localPlayerId}`] = true
          updates[`finalConfirmations/${localPlayerId}`] = true
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
        roundMode: 'timer',
        shortModeCapSeconds: DEFAULT_SHORT_MODE_CAP_SECONDS,
        totalRounds: DEFAULT_TOTAL_ROUNDS,
        remotePlayEnabled: false,
        chatMessages: [],
        chatLastRead: {},
        songs: [],
        guesses: [],
        ratings: [],
        currentSongIndex: 0,
        songOrder: [],
        roundPlaythroughDone: false,
        confirmedPlayerIds: [],
        roundsCompleted: 0,
        lobbyReadyPlayerIds: [],
        roundScoresApplied: false,
      })
    },

    handleRemovedFromRoom: () => {
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
        roundMode: 'timer',
        shortModeCapSeconds: DEFAULT_SHORT_MODE_CAP_SECONDS,
        totalRounds: DEFAULT_TOTAL_ROUNDS,
        remotePlayEnabled: false,
        chatMessages: [],
        chatLastRead: {},
        songs: [],
        guesses: [],
        ratings: [],
        currentSongIndex: 0,
        songOrder: [],
        roundPlaythroughDone: false,
        confirmedPlayerIds: [],
        roundsCompleted: 0,
        lobbyReadyPlayerIds: [],
        roundScoresApplied: false,
      })
    },

    // Deliberately always a full removal, unlike leaveGame's own quiet
    // (row-preserving) mid-game path - a few gates elsewhere (e.g.
    // SubmitSong's "has everyone submitted?" count) are computed straight
    // from `players.length`, so just marking someone lobbyReady/confirmed
    // doesn't unblock those: only actually shrinking the player list does.
    // This is also exactly why kicking exists (a deliberate host action for
    // "this person isn't part of this game"), unlike a graceful self-leave
    // where preserving their row's history for the rest of the group
    // matters more than it does here.
    kickPlayer: (playerId) => {
      const { roomCode, localPlayerId, hostId } = get()
      if (!roomCode || localPlayerId !== hostId || playerId === hostId) return
      dbUpdate(ref(db, `games/${roomCode}`), { [`players/${playerId}`]: null }).catch(() => {})
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

    startNewGame: () => {
      const { roomCode, players } = get()
      if (!roomCode) return
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
        roundScoresApplied: null,
        roundsCompleted: 0,
        // roundMode/shortModeCapSeconds/totalRounds are left as-is - same
        // "persists as the group's preference" treatment as between
        // ordinary rounds; the host can still change totalRounds since
        // Game Setup only locks it once roundsCompleted > 0.
      }
      for (const player of players) {
        updates[`players/${player.id}/totalScore`] = 0
        updates[`players/${player.id}/cumulativeCorrectGuesses`] = 0
        updates[`players/${player.id}/cumulativeRatingSum`] = 0
        updates[`players/${player.id}/cumulativeOwnedSongCount`] = 0
        updates[`players/${player.id}/cumulativeGuessedByOthersCount`] = 0
        updates[`players/${player.id}/cumulativeCorrectGuessesByTarget`] = null
        updates[`players/${player.id}/cumulativeRatingGivenByTarget`] = null
      }
      dbUpdate(ref(db, `games/${roomCode}`), updates)
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

    chooseTotalRounds: (rounds) => {
      const { roomCode } = get()
      if (!roomCode) return
      dbUpdate(ref(db, `games/${roomCode}`), { totalRounds: rounds })
    },

    setRemotePlayEnabled: (enabled) => {
      const { roomCode } = get()
      if (!roomCode) return
      dbUpdate(ref(db, `games/${roomCode}`), { remotePlayEnabled: enabled })
    },

    sendChatMessage: (text) => {
      const { roomCode, localPlayerId, players } = get()
      if (!roomCode || !localPlayerId) return
      const trimmed = text.trim().slice(0, MAX_CHAT_MESSAGE_LENGTH)
      if (!trimmed) return
      const sender = players.find((p) => p.id === localPlayerId)
      const messageId = crypto.randomUUID()
      dbUpdate(ref(db, `games/${roomCode}`), {
        [`chat/${messageId}`]: {
          senderId: localPlayerId,
          senderName: sender?.name ?? 'Unknown',
          text: trimmed,
          timestamp: Date.now(),
        },
        [`chatLastRead/${localPlayerId}`]: Date.now(),
      })
    },

    markChatRead: () => {
      const { roomCode, localPlayerId } = get()
      if (!roomCode || !localPlayerId) return
      dbUpdate(ref(db, `games/${roomCode}`), { [`chatLastRead/${localPlayerId}`]: Date.now() })
    },

    toggleChatReaction: (messageId, emoji) => {
      const { roomCode, localPlayerId, chatMessages } = get()
      if (!roomCode || !localPlayerId) return
      const message = chatMessages.find((m) => m.id === messageId)
      const alreadyReacted = !!message?.reactions?.[emoji]?.[localPlayerId]
      const path = `chat/${messageId}/reactions/${emoji}/${localPlayerId}`
      dbUpdate(ref(db, `games/${roomCode}`), { [path]: alreadyReacted ? null : true })
    },

    startSubmitting: () => {
      const { roomCode } = get()
      if (!roomCode) return
      dbUpdate(ref(db, `games/${roomCode}`), { phase: 'submit' })
      trackEvent('round_started')
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

    clearSong: (categoryId) => {
      const { roomCode, localPlayerId } = get()
      if (!roomCode || !localPlayerId) return
      const songId = `${localPlayerId}__${categoryId}`
      dbRemove(ref(db, `games/${roomCode}/songs/${songId}`))
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

    // "Triple Down" (see CLAUDE.md): picking a value one of this rater's
    // other songs in the same category already holds cascades that song -
    // and any more, contiguously, below it - down by one each instead of
    // being rejected. Computed here (not just in the UI) so it holds
    // regardless of caller.
    submitRating: (songId, value) => {
      const { roomCode, localPlayerId, songs, ratings } = get()
      if (!roomCode || !localPlayerId) return
      const song = songs.find((s) => s.id === songId)
      const updates: Record<string, unknown> = {
        [`finalConfirmations/${localPlayerId}`]: null,
      }

      if (song) {
        const categorySongIds = new Set(
          songs.filter((s) => s.categoryId === song.categoryId).map((s) => s.id)
        )
        const valueToSongId = new Map<number, string>()
        for (const r of ratings) {
          if (r.raterId !== localPlayerId || r.songId === songId) continue
          if (!categorySongIds.has(r.songId)) continue
          valueToSongId.set(r.value, r.songId)
        }
        const cascade = computeCascade(valueToSongId, value)
        // No room to cascade into (the UI doesn't offer this value in that
        // case, but never write a colliding rating if it somehow gets here
        // anyway) - refuse instead of creating a duplicate value.
        if (cascade === null) return
        for (const move of cascade) {
          updates[`ratings/${move.songId}__${localPlayerId}/value`] = move.newValue
        }
      }

      updates[`ratings/${songId}__${localPlayerId}`] = { songId, raterId: localPlayerId, value }
      dbUpdate(ref(db, `games/${roomCode}`), updates)
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
      trackEvent('round_completed')
    },

    applyFinalRoundScores: () => applyRoundScoresIfNeeded(),

    returnToLobby: () => {
      const { roomCode, localPlayerId } = get()
      if (!roomCode || !localPlayerId) return
      // Applied here (as soon as the FIRST player heads back), not just in
      // finalizeRoundIfReady below - so the leaderboard is already correct
      // the moment this player lands on the Lobby, instead of everyone
      // having to wait for the last straggler to click through before
      // anyone's total updates.
      applyRoundScoresIfNeeded()
      // Independent of the room-scoped fold above - see that function's own
      // comment for why this has to run separately, per signed-in account,
      // on that account's own device.
      applyCareerStatsIfNeeded()
      dbUpdate(ref(db, `games/${roomCode}`), { [`lobbyReady/${localPlayerId}`]: true })
    },

    // Deliberately re-derives "are we ready" from state rather than trusting
    // a caller's judgment, and writes the exact same result no matter which
    // device's watcher happens to fire it or how many fire it at once - the
    // round reset only ever depends on the (by now frozen) round data, not
    // on each other, so redundant calls converge to one outcome instead of
    // double-applying anything. Scores themselves are normally already
    // applied by returnToLobby's early call - applyRoundScoresIfNeeded here
    // is just a no-op-if-already-done fallback. MUST be awaited before the
    // reset below: with a single player (or whenever the last player to
    // click "Go to Lobby" is also the one completing the ready-set), this
    // fires in the very same tick as returnToLobby's own early call - if
    // the reset's songs/guesses/ratings: null landed first, the score
    // computation would read already-emptied round data and compute
    // everyone at 0, silently skipping the totalScore write entirely
    // (reproduced live: Results showed +5, the Lobby right after showed
    // the total unchanged at 0).
    finalizeRoundIfReady: async () => {
      const { roomCode, phase, players, roundsCompleted, lobbyReadyPlayerIds } = get()
      if (!roomCode || phase !== 'results' || players.length === 0) return
      if (lobbyReadyPlayerIds.length < players.length) return
      await applyRoundScoresIfNeeded()
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
        roundScoresApplied: null,
        roundsCompleted: roundsCompleted + 1,
        // roundMode is left as-is - it persists as the group's preference.
      }
      // Every player's device calls this once it sees readyCount reach
      // playerCount (see useFinalizeRoundWatcher in App.tsx), so several of
      // these writes to the same games/{roomCode} path can land within the
      // same instant - Firebase's client SDK then rejects whichever one it
      // locally supersedes with Error("set"), even though one of the
      // redundant writes still lands and the room ends up in the right
      // state either way. Caught here for the same reason leaveGame/
      // kickPlayer already catch their own best-effort writes below -
      // otherwise it surfaces as an unhandled rejection (seen for real in
      // Sentry, JAVASCRIPT-REACT-2).
      dbUpdate(ref(db, `games/${roomCode}`), updates).catch(() => {})
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