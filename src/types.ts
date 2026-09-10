export interface Category {
  id: string
  name: string
}

export interface Player {
  id: string
  name: string
  totalScore?: number
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
