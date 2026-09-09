# Prompt for Claude Code

Implement a complete light theme for Music Mind Reader.

Before changing code:

1. Read `docs/light-theme/LIGHT_THEME_SPEC.md` completely.
2. Inspect every screenshot in `docs/light-theme/references/dark/` and the light reference in `docs/light-theme/references/light/`.
3. Inspect the current repository and identify the global styles, theme setup, shared UI components and all routes/screens represented by the screenshots.
4. Report the root theme/style files and components you plan to change.

Implementation requirements:

- Add semantic design tokens for both dark and light themes. Do not scatter new hard-coded light colors through individual pages.
- Preserve the current dark theme visually and keep it as the fallback unless the existing product already has another default.
- Add Light, Dark and System theme modes.
- Resolve System with `prefers-color-scheme` and respond when the operating-system preference changes.
- Persist an explicit Light or Dark selection in local storage. System mode should continue following the OS.
- Apply the selected theme before first paint where the current architecture permits, to prevent a light/dark flash.
- Convert every screen and every state shown in the references, including selected, disabled, waiting, confirmed, collapsed and expanded states.
- Preserve the real MMR logo asset, layout, wording, routes and game logic.
- Do not redesign gameplay or change data flow as part of this task.
- Do not alter YouTube/media artwork. Only theme the app-owned container around it.
- Ensure readable focus, hover, active, selected, disabled and keyboard-focus states in both themes.
- Use accessible contrast, especially for small helper text, disabled controls, badges and table headers.
- Keep mobile layouts within their current intended viewport behavior.

After implementation:

1. Run the existing lint, type-check and test commands.
2. Test all referenced screens in Light, Dark and System modes.
3. Verify persistence after refresh and System response to OS theme changes.
4. Search for remaining raw dark-theme color values and replace those that should use semantic tokens.
5. Summarize changed files, tests run and any unresolved visual exceptions.

Use `LIGHT_THEME_SPEC.md` as the source of truth when making visual decisions.

