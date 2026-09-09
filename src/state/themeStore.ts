import { create } from 'zustand'

export type ThemeMode = 'light' | 'dark'

const STORAGE_KEY = 'mmr_theme_mode'

function loadStoredMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'light' || stored === 'dark' ? stored : 'dark'
  } catch {
    return 'dark'
  }
}

function applyToDocument(mode: ThemeMode) {
  document.documentElement.setAttribute('data-theme', mode)
}

interface ThemeState {
  mode: ThemeMode
  resolvedTheme: ThemeMode
  setMode: (mode: ThemeMode) => void
}

// A synchronous inline script in index.html already applies the right
// data-theme attribute before first paint (this store can't run early
// enough on its own for that) - this just brings React-side state in sync
// with whatever that script already decided, and takes over from there.
// resolvedTheme is kept alongside mode (rather than dropped) so components
// that read it don't need to change if a "follow the OS" option ever comes
// back.
export const useThemeStore = create<ThemeState>((set) => {
  const initialMode = loadStoredMode()

  return {
    mode: initialMode,
    resolvedTheme: initialMode,

    setMode: (mode) => {
      applyToDocument(mode)
      try {
        localStorage.setItem(STORAGE_KEY, mode)
      } catch {
        // localStorage unavailable (private browsing etc.) - just won't persist.
      }
      set({ mode, resolvedTheme: mode })
    },
  }
})
