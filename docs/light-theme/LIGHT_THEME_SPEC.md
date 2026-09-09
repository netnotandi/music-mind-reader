# Music Mind Reader — Light Theme Specification

## 1. Goal

Add a coherent light theme that feels like the same playful music game as the current dark interface. This is a theme implementation, not a gameplay redesign. Keep the cyan–blue–violet–pink identity, teal primary actions and midnight-navy typography.

The light theme should feel airy and energetic rather than corporate. Use a cool off-white/lavender canvas instead of pure white, crisp white surfaces, restrained shadows and saturated brand accents only where they communicate hierarchy or state.

## 2. Theme behavior

Support three user-facing modes:

- **Light** — always uses light tokens.
- **Dark** — always uses existing dark tokens.
- **System** — follows `prefers-color-scheme` and updates if the OS setting changes.

Persist explicit selection. Avoid a flash of the wrong theme on reload. Apply theme at the document/root level, for example with `data-theme="light|dark"`, while adapting to the project's existing architecture.

## 3. Semantic tokens

Use semantic names. Values may be adjusted slightly during accessibility testing, but relationships must remain consistent.

```css
:root,
[data-theme="light"] {
  color-scheme: light;

  --color-bg: #F6F6FC;
  --color-bg-subtle: #EFF1FA;
  --color-surface: #FFFFFF;
  --color-surface-raised: #FFFFFF;
  --color-surface-muted: #F1F3FA;
  --color-surface-tinted: #EEF7FC;

  --color-text: #09154A;
  --color-text-secondary: #56638E;
  --color-text-muted: #747FA3;
  --color-text-on-accent: #061238;

  --color-border: #D9DEF1;
  --color-border-strong: #B8C1DF;
  --color-divider: #DDE2F2;

  --color-cyan: #00D9F5;
  --color-blue: #2389FF;
  --color-violet: #8057F5;
  --color-pink: #F83CAF;
  --color-primary: #08C99A;
  --color-primary-hover: #00B98C;
  --color-success: #00AD82;
  --color-danger: #D93668;

  --color-disabled-bg: #E3E7F1;
  --color-disabled-text: #929CB8;
  --color-disabled-border: #D5DAE8;

  --gradient-brand: linear-gradient(90deg, #00D9F5 0%, #347EF4 34%, #9857F3 68%, #F83CAF 100%);
  --gradient-selected-soft: linear-gradient(135deg, rgba(0,217,245,.10), rgba(248,60,175,.08));

  --shadow-card: 0 6px 18px rgba(34, 45, 100, .08);
  --shadow-control: 0 3px 10px rgba(34, 45, 100, .07);
  --focus-ring: 0 0 0 3px rgba(0, 169, 220, .25);
}
```

Map the current dark values to the same semantic names instead of replacing or visually changing the established dark theme.

## 4. Global component rules

### Page canvas

- Background: `--color-bg`.
- Primary text: `--color-text`.
- Helper text: `--color-text-secondary`; never use very pale gray on white.
- Preserve current mobile widths, padding and responsive breakpoints.

### Cards and panels

- Default: white surface, 1–2 px `--color-border`, subtle `--shadow-card`.
- Nested or informational surface: `--color-surface-muted` or `--color-surface-tinted`.
- Avoid heavy gray fills and large diffuse glow.

### Inputs and selects

- White fill, deep navy input text, muted placeholder.
- Default border `--color-border-strong`.
- Focus uses cyan/blue border plus `--focus-ring`.
- Browser/native select indicators must remain visible in both themes.

### Primary actions

- Teal/mint fill with deep navy text, matching the existing action identity.
- Brand gradient may be used for the Home screen's `CREATE GAME` emphasis.
- Hover darkens slightly; pressed state reduces brightness and/or translates by 1 px.
- Disabled state must look clearly unavailable while keeping the label readable.

### Secondary actions

- White or transparent surface, `--color-border-strong`, deep navy text.
- Destructive/exit actions remain secondary unless confirmation is required; do not make `Leave Game` look like the primary action.

### Selected state

- Use a thin brand-gradient border, a very light cyan/lavender tinted fill and a compact check badge.
- Never communicate selection using color alone; preserve the checkmark.

### Tables and status rows

- Header: white or muted surface with secondary navy/slate text.
- Body: `--color-surface-tinted` only where current rows need separation.
- Use dividers instead of dark blocks.
- Success/connected/confirmed text uses `--color-success` with sufficient contrast.

### Badges

- Keep purple/pink title badges recognizable.
- In light mode use a slightly deeper badge fill or dark plum text on a pale tinted badge; verify contrast at small sizes.

### Pagination

- White circular arrow buttons with slate border and small shadow.
- Active dot cyan; inactive dots medium cool gray.
- Maintain keyboard focus and disabled first/last-page states.

## 5. Screen-by-screen mapping

### 01–02 Home: empty and ready

References: `01-home-empty.png`, `02-home-ready.png`

- Use the real four-peak MMR logo unchanged; it must not be regenerated or simplified.
- Canvas uses cool off-white/lavender.
- Input is white with a gradient or strong slate border; placeholder remains readable.
- Empty state: `CREATE GAME` is disabled using disabled tokens.
- Ready state: `CREATE GAME` uses the brand gradient with a high-contrast label.
- `JOIN GAME` remains a gradient-outline secondary action.
- Divider lines become `--color-divider`; `OR` uses secondary text.
- Any decorative bottom arc should become a very pale lavender/brand tint, not disappear into white.

### 03–04 Game setup: empty and selected

References: `03-game-setup-empty.png`, `04-game-setup-selected.png`

- Select uses white surface, navy value text and clear focus border.
- Category cards use white surfaces with cool borders and mild shadows.
- Selected card follows the global gradient-border + tint + check pattern.
- Empty state `NEXT` is disabled; selected state `NEXT` is teal primary.
- Pagination follows the global pagination pattern.
- Preserve six cards per page and the no-scroll goal on supported mobile heights.

### 05 Lobby

Reference: `05-lobby.png`

- QR code remains black on white with a white quiet zone.
- Game-code panel becomes white with border/shadow; code remains green/teal and prominent.
- Player rows become white cards. Connected state uses green text plus its textual label.
- Waiting rows use muted lavender text and a restrained animated shimmer/pulse that respects `prefers-reduced-motion`.
- Category pill uses pale teal fill and dark teal text.
- `Start Submitting Songs` remains teal primary.

### 06 Song search result

Reference: `06-song-search-result.png`

- Category panel: white with light border; category value remains teal/dark-teal.
- Search-result row: white or tinted surface with visible border and shadow.
- Circular plus button remains saturated teal with dark icon.
- Link/help copy must use an accessible blue-violet rather than pale blue.
- Submission table uses white header, tinted body and light dividers.
- `Start Guessing` disabled state uses disabled tokens.

### 07 Song selected

Reference: `07-song-selected.png`

- Selected song row follows the search-result light treatment.
- `Choose new song` may remain a teal secondary/medium-emphasis action, while `Start Guessing` is the strongest primary action.
- Confirmed check in the player table remains visible through icon and color.

### 08 Guessing: own song

Reference: `08-guessing-own-song.png`

- Do not modify the media/embed content itself.
- Song-information card: very pale blue surface, cyan border, navy title, slate artist.
- Own-song notice: white or pale lavender card with a clear border and navy text.
- Answer count uses secondary text.
- Confirmation table follows global table rules.

### 09 Confirmed / waiting

Reference: `09-waiting-confirmed.png`

- Preserve the confirmed state wording and hierarchy.
- Waiting button uses disabled tokens and retains the check icon.
- `See Results →` becomes the active teal primary action only when available.

### 10–11 Results: collapsed and expanded

References: `10-results-collapsed.png`, `11-results-expanded.png`

- Scoreboard card becomes white with a cool border and subtle shadow.
- Player name/title uses deep navy; score remains saturated teal/dark teal.
- Accordion chevron must remain clearly visible.
- Expanded scoring breakdown uses `--color-surface-muted`, light divider lines and aligned teal point values.
- Preserve badge color and readability.
- `Go to Lobby` remains primary teal; `Leave Game` remains outlined secondary.

## 6. Accessibility and interaction acceptance criteria

- Normal text aims for at least 4.5:1 contrast; large text and meaningful controls at least 3:1.
- Keyboard focus is clearly visible on every interactive element.
- Selected, success, waiting and disabled states are not communicated by color alone.
- Touch targets remain approximately 44 × 44 CSS px or larger.
- Theme control has an accessible label and exposes the active choice.
- Reduced-motion users do not receive looping shimmer/pulse animation.
- Light theme contains no white text inherited onto white cards and no dark-theme border values that become invisible.

## 7. Technical implementation guidance

- Prefer one theme/token layer plus shared components over per-page overrides.
- Reuse the project's current CSS approach (CSS variables, modules, styled components, Tailwind or equivalent); do not introduce a second styling framework.
- Replace visual literals with semantic tokens incrementally and keep gameplay values untouched.
- If Tailwind is used, map semantic CSS variables into the Tailwind theme rather than duplicating hex values.
- Theme state should be independent of game/session state.
- Avoid hydration mismatch if the app renders on the server.

## 8. Definition of done

- All eleven reference states render correctly in Light and Dark.
- Light, Dark and System modes work and persist correctly.
- Existing dark appearance has no material regression.
- No gameplay, routing, scoring, lobby or multiplayer behavior changes.
- Lint, type-check and existing tests pass.
- Manual viewport check includes at least one narrow/small phone size.
- Claude reports any remaining third-party surfaces it cannot theme.

