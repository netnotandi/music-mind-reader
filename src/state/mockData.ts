import type { Category, Player } from '../types'

export const GAME_CODE = '4271'

export const PLAYERS: Player[] = [
  { id: 'p1', name: 'Anna' },
  { id: 'p2', name: 'Björn' },
  { id: 'p3', name: 'Katla' },
  { id: 'p4', name: 'Dagur' },
]

export const CATEGORIES: Category[] = [
  { id: 'rokk', name: 'Rokk', group: 'tegund' },
  { id: 'popp', name: 'Popp', group: 'tegund' },
  { id: 'guilty-pleasure', name: 'Guilty pleasure', group: 'tegund' },
  { id: 'raektin', name: 'Lag fyrir ræktina', group: 'tegund' },
  { id: 'lok-kvoldsins', name: 'Lag fyrir lok kvöldsins', group: 'tegund' },
  { id: 'islenska', name: 'Besta íslenska lagið', group: 'tegund' },
  { id: 'stud', name: 'Lag sem kemur mér í stuð', group: 'um-mig' },
  { id: 'besta-allra-tima', name: 'Besta lag allra tíma', group: 'um-mig' },
  { id: '18-ara', name: 'Lag sem ég hlustaði á 18 ára', group: 'um-mig' },
  { id: 'enginn-byst-vid', name: 'Lag sem enginn býst við að ég fíli', group: 'um-mig' },
  { id: 'karaoke', name: 'Lag sem ég myndi velja í karaoke', group: 'um-mig' },
  { id: 'lysir-odrum', name: 'Lag sem lýsir einhverjum öðrum í hópnum', group: 'um-mig' },
  { id: 'funeral', name: 'My funeral song', group: 'um-mig' },
  { id: 'opolandi-gott', name: 'Óþolandi gott lag', group: 'um-mig' },
]

// Notað til að fylla sjálfkrafa út lög fyrir gervi-leikmenn sem "hafa ekki skilað" ennþá.
// Fyrstu tveir færslurnar eru vísvitandi eins til að hægt sé að prófa Great Minds bónusinn.
export const MOCK_SONG_POOL: { title: string; artist: string }[] = [
  { title: 'Dancing Queen', artist: 'ABBA' },
  { title: 'Dancing Queen', artist: 'ABBA' },
  { title: 'Ísland', artist: 'Bubbi Morthens' },
  { title: 'Blinding Lights', artist: 'The Weeknd' },
]
