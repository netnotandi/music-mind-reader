import { create } from 'zustand'

const STORAGE_KEY = 'mmr_music_muted'

function loadStoredMuted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

interface MusicState {
  muted: boolean
  setMuted: (muted: boolean) => void
}

// Mirrors themeStore.ts exactly - a personal, device-local preference, not
// game state, so it lives in its own tiny store rather than gameStore.ts or
// Firebase. Read by backgroundMusic.ts to decide whether to actually play.
export const useMusicStore = create<MusicState>((set) => ({
  muted: loadStoredMuted(),

  setMuted: (muted) => {
    try {
      localStorage.setItem(STORAGE_KEY, String(muted))
    } catch {
      // localStorage unavailable (private browsing etc.) - just won't persist.
    }
    set({ muted })
  },
}))
