export interface Category {
  id: string
  name: string
}

export interface Player {
  id: string
  name: string
  totalScore?: number
  // Folded in alongside totalScore (see applyRoundScoresIfNeeded in
  // gameStore.ts) - never reset between rounds, used to compute the
  // cumulative "Final Scoretable" award titles across every round played.
  cumulativeCorrectGuesses?: number
  cumulativeRatingSum?: number
  cumulativeOwnedSongCount?: number
  cumulativeGuessedByOthersCount?: number
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
}
