import type { Category, Player } from '../types'

export const GAME_CODE = '4271'

export const PLAYERS: Player[] = [
  { id: 'p1', name: 'Jón Þór' },
  { id: 'p2', name: 'Eggert' },
  { id: 'p3', name: 'Haukur' },
  { id: 'p4', name: 'Elli' },
  { id: 'p5', name: 'Chris' },
]

export const CATEGORIES: Category[] = [
  { id: 'guilty-pleasure', name: 'My Guilty Pleasure' },
  { id: 'all-time-favourite', name: 'My All-Time Favourite' },
  { id: 'teenage-years', name: 'A Song From My Teenage Years' },
  { id: 'nobody-expects', name: 'A Song Nobody Expects Me to Like' },
  { id: 'karaoke-song', name: 'My Karaoke Song' },
  { id: 'describes-me', name: 'A Song That Describes Me' },
  { id: 'gets-me-going', name: 'A Song That Gets Me Going' },
  { id: 'party-starter', name: 'The Perfect Party Starter' },
  { id: 'road-trip', name: 'The Ultimate Road Trip Song' },
  { id: 'closing-song', name: 'The Perfect Closing Song' },
  { id: 'funeral-song', name: 'My Funeral Song' },
  { id: 'best-90s', name: 'The Best Song From the 90s' },
  { id: 'best-icelandic', name: 'The Best Icelandic Song' },
  { id: 'underrated', name: 'An Underrated Masterpiece' },
  { id: 'describes-someone', name: 'A Song That Describes Someone Here' },
  { id: 'main-character', name: 'My Main Character Song' },
]

// Notað til að fylla sjálfkrafa út lög fyrir gervi-leikmenn sem "hafa ekki skilað" ennþá.
// Fyrstu tveir færslurnar eru vísvitandi eins til að hægt sé að prófa Great Minds bónusinn.
export const MOCK_SONG_POOL: { title: string; artist: string }[] = [
  { title: 'Dancing Queen', artist: 'ABBA' },
  { title: 'Dancing Queen', artist: 'ABBA' },
  { title: 'Ísland', artist: 'Bubbi Morthens' },
  { title: 'Blinding Lights', artist: 'The Weeknd' },
]
