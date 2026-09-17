import { create } from 'zustand'

// Lets a button anywhere (e.g. the "Sign in" link or the account promo card
// on CreateJoin) open MenuOverlay straight to a specific panel, without
// MenuOverlay needing to expose its open/panel state as props - it stays
// the sole owner of that state, just also watches this one-shot request.
interface UiState {
  pendingMenuPanel: 'account' | null
  requestMenuPanel: (panel: 'account') => void
  clearPendingMenuPanel: () => void
}

export const useUiStore = create<UiState>((set) => ({
  pendingMenuPanel: null,
  requestMenuPanel: (panel) => set({ pendingMenuPanel: panel }),
  clearPendingMenuPanel: () => set({ pendingMenuPanel: null }),
}))
