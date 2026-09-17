import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import {
  get as dbGet,
  ref,
  remove as dbRemove,
  runTransaction,
  serverTimestamp,
  update as dbUpdate,
} from 'firebase/database'
import { create } from 'zustand'
import { auth, db } from '../firebase'
import { MAX_NAME_LENGTH } from './gameStore'

export type AuthStatus = 'loading' | 'signed-out' | 'needs-profile' | 'ready' | 'profile-error'

export interface UserProfile {
  name: string
  nameKey: string
  discriminator: string
  createdAt: number
}

const MIN_NAME_LENGTH = 2
const DISCRIMINATOR_MAX = 9999
const CLAIM_ATTEMPTS = 8

// Case/whitespace-insensitive but NOT accent-insensitive ("Jón" and "Jon"
// are different names, kept in separate slot pools) - encodeURIComponent
// produces a legal RTDB key for any Unicode input; RTDB keys additionally
// forbid ".", hence the extra replace (encodeURIComponent leaves "." alone).
export function normalizeNameKey(name: string): string {
  const base = name.normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ')
  return encodeURIComponent(base).replace(/\./g, '%2E')
}

// Deliberately short - the handful of codes that actually happen in
// practice, generic fallback for the rest. null means "say nothing" (the
// user cancelled the action themselves; showing an "error" for that would
// just be noise).
function friendlyAuthError(err: unknown): string | null {
  const code = (err as { code?: string } | null)?.code ?? ''
  switch (code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return null
    case 'auth/invalid-email':
      return "That email address doesn't look right."
    case 'auth/missing-password':
      return 'Enter a password.'
    case 'auth/weak-password':
      return 'Pick a password with at least 6 characters.'
    case 'auth/email-already-in-use':
      return "There's already an account with that email — try signing in instead."
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return "That email and password don't match an account."
    case 'auth/too-many-requests':
      return 'Too many tries — wait a minute and try again.'
    case 'auth/popup-blocked':
      return 'Your browser blocked the sign-in window — allow popups for this site and try again.'
    case 'auth/network-request-failed':
      return 'No connection — check your network and try again.'
    case 'auth/operation-not-allowed':
      return "This sign-in method isn't switched on for this app yet."
    default:
      return 'Something went wrong — try again.'
  }
}

interface UserState {
  status: AuthStatus
  uid: string | null
  email: string | null
  profile: UserProfile | null
  busy: boolean
  error: string | null
  resetSent: boolean

  initAuth: () => void
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string) => Promise<void>
  sendResetEmail: (email: string) => Promise<void>
  claimDisplayName: (rawName: string) => Promise<void>
  retryProfileLoad: () => Promise<void>
  signOutUser: () => Promise<void>
  clearError: () => void
}

// Module-level, mirroring gameStore.ts's detachListener pattern - initAuth
// is called once from App.tsx's mount effect, but React 19 StrictMode
// double-invokes effects in dev, so this guard is doing real work.
let authInitialized = false
// Bumped on every auth-state change so a slow profile read that resolves
// after a sign-out (or a different sign-in) can be discarded instead of
// clobbering fresher state.
let authRequestId = 0

async function loadProfile(uid: string, requestId: number, set: (partial: Partial<UserState>) => void) {
  try {
    const snap = await dbGet(ref(db, `users/${uid}`))
    if (requestId !== authRequestId) return
    if (snap.exists()) {
      set({ status: 'ready', profile: snap.val() as UserProfile, error: null })
    } else {
      // Brand-new account - true for both a first-time Google sign-in and a
      // fresh email/password sign-up, neither of which hands us a
      // collision-checked display name.
      set({ status: 'needs-profile', profile: null, error: null })
    }
  } catch {
    if (requestId !== authRequestId) return
    // Unlike songSearchCache, this must not fail silently - a permission
    // error almost certainly means the RTDB rules step was skipped, and the
    // signed-in user needs to know rather than being dropped into a
    // needs-profile form that would then also fail.
    set({
      status: 'profile-error',
      error: "Couldn't load your profile. Check your connection and try again.",
    })
  }
}

export const useUserStore = create<UserState>((set, get) => ({
  status: 'loading',
  uid: null,
  email: null,
  profile: null,
  busy: false,
  error: null,
  resetSent: false,

  initAuth: () => {
    if (authInitialized) return
    authInitialized = true

    onAuthStateChanged(auth, (user) => {
      const requestId = ++authRequestId

      if (!user) {
        set({ status: 'signed-out', uid: null, email: null, profile: null, error: null, resetSent: false })
        return
      }

      set({ uid: user.uid, email: user.email, status: 'loading' })
      loadProfile(user.uid, requestId, set)
    })
  },

  signInWithGoogle: async () => {
    set({ busy: true, error: null })
    try {
      await signInWithPopup(auth, new GoogleAuthProvider())
    } catch (err) {
      set({ error: friendlyAuthError(err) })
    } finally {
      set({ busy: false })
    }
  },

  signInWithEmail: async (email, password) => {
    set({ busy: true, error: null })
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password)
    } catch (err) {
      set({ error: friendlyAuthError(err) })
    } finally {
      set({ busy: false })
    }
  },

  signUpWithEmail: async (email, password) => {
    set({ busy: true, error: null })
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password)
    } catch (err) {
      set({ error: friendlyAuthError(err) })
    } finally {
      set({ busy: false })
    }
  },

  sendResetEmail: async (email) => {
    const trimmed = email.trim()
    if (!trimmed) {
      set({ error: 'Enter your email first.' })
      return
    }
    set({ busy: true, error: null })
    try {
      await sendPasswordResetEmail(auth, trimmed)
      set({ resetSent: true })
    } catch (err) {
      set({ error: friendlyAuthError(err) })
    } finally {
      set({ busy: false })
    }
  },

  claimDisplayName: async (rawName) => {
    const uid = get().uid
    if (!uid) return

    const trimmed = rawName.normalize('NFKC').trim().replace(/\s+/g, ' ')
    if (trimmed.length < MIN_NAME_LENGTH || trimmed.length > MAX_NAME_LENGTH) {
      set({ error: `Name must be ${MIN_NAME_LENGTH}-${MAX_NAME_LENGTH} characters.` })
      return
    }

    const nameKey = normalizeNameKey(trimmed)
    set({ busy: true, error: null })

    let claimed: string | null = null
    let slotRef: ReturnType<typeof ref> | null = null
    try {
      for (let attempt = 0; attempt < CLAIM_ATTEMPTS && !claimed; attempt++) {
        const disc = String(Math.floor(Math.random() * DISCRIMINATOR_MAX) + 1).padStart(4, '0')
        const candidateRef = ref(db, `usernames/${nameKey}/${disc}`)
        // Returning undefined aborts the transaction - "this slot is
        // already somebody else's", never overwrites an existing claim.
        const result = await runTransaction(candidateRef, (current) => (current === null ? uid : undefined))
        if (result.committed) {
          claimed = disc
          slotRef = candidateRef
        }
      }

      if (!claimed) {
        set({ error: 'That name is very popular right now — try a slightly different one.' })
        return
      }

      const profile: UserProfile = { name: trimmed, nameKey, discriminator: claimed, createdAt: Date.now() }
      // update, not set - later phases (friends/lists/stats) hang data off
      // this same node, and a rename must never wipe them.
      await dbUpdate(ref(db, `users/${uid}`), { ...profile, createdAt: serverTimestamp() })
      set({ status: 'ready', profile })
    } catch {
      // Release the slot we just took so it isn't orphaned forever.
      if (slotRef) dbRemove(slotRef).catch(() => {})
      set({ error: "Couldn't save your name — check your connection and try again." })
    } finally {
      set({ busy: false })
    }
  },

  retryProfileLoad: async () => {
    const uid = get().uid
    if (!uid) return
    const requestId = ++authRequestId
    set({ status: 'loading', error: null })
    await loadProfile(uid, requestId, set)
  },

  signOutUser: async () => {
    await signOut(auth)
  },

  clearError: () => set({ error: null }),
}))
