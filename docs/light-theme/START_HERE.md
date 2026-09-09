# Music Mind Reader — Light Theme Handoff

This package is intended to be copied into the app repository and given directly to Claude in VS Code.

## Recommended workflow

1. Copy this folder into the repository, preferably as `docs/light-theme/`.
2. Open Claude Code from the repository root.
3. Paste the contents of `CLAUDE_PROMPT.md` into Claude.
4. Tell Claude to read `LIGHT_THEME_SPEC.md` and inspect the screenshots under `references/` before editing.
5. Let Claude first report the files/components it found and its implementation plan.
6. Approve the plan, then have Claude implement and test the theme.

## Package contents

- `LIGHT_THEME_SPEC.md` — authoritative design and behavior specification.
- `CLAUDE_PROMPT.md` — ready-to-paste task prompt.
- `references/dark/` — current screens, named in game-flow order.
- `references/light/category-selection-reference.png` — visual direction for the light palette and surfaces.

The light screenshot is a visual direction, not a pixel-perfect mandate. Existing app structure, real logo assets, text and game behavior remain authoritative.

