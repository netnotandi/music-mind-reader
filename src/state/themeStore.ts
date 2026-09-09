import { create } from 'zustand'

export type ThemeMode = 'light' | 'dark' | 'system'
type ResolvedTheme = 'light' | 'dark'

const STORAGE_KEY = 'mmr_theme_mode'

function prefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function resolve(mode: ThemeMode): ResolvedTheme {
  return mode === 'system' ? (prefersDark() ? 'dark' : 'light') : mode
}

function loadStoredMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system'
  } catch {
    return 'system'
  }
}

function applyToDocument(resolved: ResolvedTheme) {
  document.documentElement.setAttribute('data-theme', resolved)
}

interface ThemeState {
  mode: ThemeMode
  resolvedTheme: ResolvedTheme
  setMode: (mode: ThemeMode) => void
}

// A synchronous inline script in index.html already applies the right
// data-theme attribute before first paint (this store can't run early
// enough on its own for that) - this just brings React-side state in sync
// with whatever that script already decided, and takes over from there.
export const useThemeStore = create<ThemeState>((set, get) => {
  const initialMode = loadStoredMode()

  let mediaQuery: MediaQueryList | null = null
  function handleSystemChange() {
    if (get().mode !== 'system') return
    const resolved = resolve('system')
    applyToDocument(resolved)
    set({ resolvedTheme: resolved })
  }

  function syncSystemListener(mode: ThemeMode) {
    mediaQuery?.removeEventListener('change', handleSystemChange)
    mediaQuery = null
    if (mode === 'system') {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addEventListener('change', handleSystemChange)
    }
  }

  syncSystemListener(initialMode)

  return {
    mode: initialMode,
    resolvedTheme: resolve(initialMode),

    setMode: (mode) => {
      const resolved = resolve(mode)
      applyToDocument(resolved)
      try {
        localStorage.setItem(STORAGE_KEY, mode)
      } catch {
        // localStorage unavailable (private browsing etc.) - just won't persist.
      }
      syncSystemListener(mode)
      set({ mode, resolvedTheme: resolved })
    },
  }
})
