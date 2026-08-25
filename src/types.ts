export interface Category {
  id: string
  name: string
}

export interface Player {
  id: string
  name: string
}

export interface Song {
  id: string
  playerId: string
  categoryId: string
  title: string
  artist: string
}

export interface Guess {
  songId: string
  guesserId: string
  guessedPlayerId: string
}

export interface Rating {
  songId: string
  raterId: string
  value: number // 0-5
}
