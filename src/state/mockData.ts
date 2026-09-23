import type { Category } from '../types'

// Curated down from an earlier 50-category list (2026-09-17) - cut anything
// that was really just "what's your favorite/the best X" trivia with no
// personal angle (My All-Time Favourite, The Best Song From the 90s, My
// Favourite Song by a Solo Artist, ...), and consolidated a few pairs that
// asked near-identical questions (e.g. "Questionable Decisions" folded into
// "Minor Crime", "Wake Me From a Coma" folded into "Gets Me Going"/"Party
// Starter"). A handful of the "favorite X" prompts were kept but reworded to
// force an opinion/twist instead of a flat favorite, which is what actually
// makes a category interesting for this game (see "Everyone Hates but I
// Love" for the pattern) - e.g. "My Favourite Song From a Movie" became "A
// Song That's Better Than the Movie It's From".
export const CATEGORIES: Category[] = [
  { id: 'guilty-pleasure', name: 'My Guilty Pleasure' },
  { id: 'teenage-years', name: 'A Song From My Teenage Years' },
  { id: 'nobody-expects', name: 'A Song Nobody Expects Me to Like' },
  { id: 'karaoke-song', name: 'My Karaoke Song' },
  { id: 'describes-me', name: 'A Song That Describes Me' },
  { id: 'gets-me-going', name: 'A Song That Gets Me Going' },
  { id: 'party-starter', name: 'The Perfect Party Starter' },
  { id: 'road-trip', name: 'The Ultimate Road Trip Song' },
  { id: 'closing-song', name: 'The Perfect Closing Song' },
  { id: 'defend-icelandic-song', name: "The Icelandic Song You'd Defend to the Death" },
  { id: 'underrated', name: 'An Underrated Masterpiece' },
  { id: 'describes-someone', name: 'A Song That Describes Someone Here' },
  { id: 'main-character', name: 'My Main Character Song' },
  { id: 'impossible-to-escape', name: 'A Song That Was Impossible to Escape' },
  { id: 'defines-this-generation', name: 'A Song That Defines This Generation' },
  { id: 'rent-free', name: 'A Song That Lives Rent-Free in My Head' },
  { id: 'actually-overrated', name: 'A Song That Is Actually Overrated' },
  { id: 'everyone-hates-i-love', name: 'A Song Everyone Hates but I Love' },
  { id: 'everyone-loves-i-hate', name: 'A Song Everyone Loves but I Hate' },
  { id: 'artist-ill-defend', name: "An Artist I'll Defend Forever" },
  { id: 'aged-well', name: 'A Song That Aged Surprisingly Well' },
  { id: 'aged-badly', name: 'A Song That Aged Badly' },
  { id: 'embarrassed-every-word', name: "A Song I'm Embarrassed to Know Every Word To" },
  { id: 'hear-first-time-again', name: 'A Song I Wish I Could Hear Again for the First Time' },
  { id: 'no-right-being-this-good', name: 'A Song That Has No Right Being This Good' },
  { id: 'recently-rediscovered', name: 'A Song I Recently Rediscovered' },
  { id: 'took-time-to-grow', name: 'A Song That Took Time to Grow on Me' },
  { id: 'never-get-tired-of', name: 'A Song I Never Get Tired Of' },
  { id: 'during-the-apocalypse', name: 'A Song to Play During the Apocalypse' },
  { id: 'confuse-everyone-party', name: 'A Song to Confuse Everyone at a Party' },
  { id: 'worst-wedding-song', name: 'The Worst Possible Wedding Song' },
  { id: 'minor-crime-soundtrack', name: 'A Song to Play While Committing a Minor Crime' },
  { id: 'matches-my-delusion', name: 'A Song That Matches My Delusion' },
  { id: 'describes-friend-group', name: 'A Song That Describes This Friend Group' },
  { id: 'biggest-red-flag', name: 'My Biggest Red-Flag Song' },
  { id: 'celebrity-song', name: 'A Surprisingly Good Celebrity Song' },
  { id: 'love-in-unknown-language', name: "A Song I Love in a Language I Don't Speak" },
  { id: 'better-than-the-movie', name: "A Song That's Better Than the Movie It's From" },
  { id: 'great-cover-song', name: 'A Great Cover Song' },
  { id: 'who-am-i', name: 'Who Am I' },
]

// Notað til að fylla sjálfkrafa út lög fyrir gervi-leikmenn sem "hafa ekki skilað" ennþá.
// Fyrstu tveir færslurnar eru vísvitandi eins til að hægt sé að prófa Great Minds bónusinn.
export const MOCK_SONG_POOL: { title: string; artist: string }[] = [
  { title: 'Dancing Queen', artist: 'ABBA' },
  { title: 'Dancing Queen', artist: 'ABBA' },
  { title: 'Ísland', artist: 'Bubbi Morthens' },
  { title: 'Blinding Lights', artist: 'The Weeknd' },
]
