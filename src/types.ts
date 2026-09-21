export interface Category {
  id: string
  name: string
}

export interface Player {
  id: string
  name: string
  // Set only if this player was signed in (Firebase Auth uid) at the moment
  // they created/joined the room - lets other clients in the same room
  // offer "Add friend" on their row (see PlayersPanel in MenuOverlay.tsx).
  // Absent entirely for anonymous players, never retroactively backfilled.
  uid?: string
  totalScore?: number
  // Folded in alongside totalScore (see applyRoundScoresIfNeeded in
  // gameStore.ts) - never reset between rounds, used to compute the
  // cumulative "Final Scoretable" award titles across every round played.
  cumulativeCorrectGuesses?: number
  cumulativeRatingSum?: number
  cumulativeOwnedSongCount?: number
  cumulativeGuessedByOthersCount?: number
  // Pairwise, keyed by the OTHER player's id - both from THIS player's own
  // perspective as the acting party (guesser / rater). Folded in alongside
  // the scalars above; feeds computeGameStatsForViewer's personal lines
  // ("X read you like a book", "most in sync") at game-end, which raw
  // per-round guesses/ratings can't answer once they're wiped each round.
  cumulativeCorrectGuessesByTarget?: Record<string, number>
  cumulativeRatingGivenByTarget?: Record<string, { sum: number; count: number }>
}

export interface Song {
  id: string
  playerId: string
  categoryId: string
  title: string
  artist: string
  youtubeVideoId?: string
  // The title of the YouTube video the player picked in search - kept so a
  // song with a sparse or empty title/artist still has a real name to show.
  youtubeTitle?: string
}

export interface Guess {
  songId: string
  guesserId: string
  guessedPlayerId: string
}

export interface Rating {
  songId: string
  raterId: string
  value: number // 0 to (songs in the category - 2), set per round
}

// Only exists in the room at all while remotePlayEnabled is on (see the
// "Textaspjall fyrir fjarspilun" spec) - scoped to the whole lobby
// (`games/{roomCode}/chat`), not per-round, so history survives round
// resets and only disappears when the room itself does.
export interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  text: string
  timestamp: number
  // emoji -> set of playerIds who reacted with it (value is always `true`,
  // just a presence marker - same shape RTDB uses for sets elsewhere in this
  // app, e.g. lobbyReady/finalConfirmations). Absent entirely on messages
  // nobody has reacted to yet.
  reactions?: Record<string, Record<string, true>>
}
