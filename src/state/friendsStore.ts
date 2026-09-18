import {
  get as dbGet,
  onDisconnect,
  onValue,
  push,
  ref,
  remove as dbRemove,
  serverTimestamp,
  set as dbSet,
  update as dbUpdate,
} from 'firebase/database'
import { create } from 'zustand'
import { db } from '../firebase'
import { useUserStore } from './userStore'

export interface Friendship {
  status: 'pending' | 'accepted'
  requestedBy: string
  createdAt: number
}

interface FriendsState {
  // otherUid -> Friendship. A single flat read of friendships/{myUid} - see
  // gameStore.ts-style module comment below for why this needs no queries.
  friendships: Record<string, Friendship>
  onlineUids: Record<string, boolean>
  initFriends: () => void
  sendFriendRequest: (targetUid: string) => Promise<void>
  acceptFriendRequest: (otherUid: string) => Promise<void>
  // Declining an incoming request, cancelling one you sent, and unfriending
  // an accepted one are all the same action - deleting both mirrored copies
  // - so there's just one function for all three.
  removeFriendship: (otherUid: string) => Promise<void>
}

// Module-level, mirroring userStore.ts's authInitialized/gameStore.ts's
// detachListener pattern.
let friendsInitialized = false
let detachFriendshipsListener: (() => void) | null = null
let detachConnectedListener: (() => void) | null = null
let myPresenceRef: ReturnType<typeof ref> | null = null
const presenceListeners: Record<string, () => void> = {}

function stopPresenceTracking(set: (partial: Partial<FriendsState>) => void) {
  for (const uid of Object.keys(presenceListeners)) {
    presenceListeners[uid]()
    delete presenceListeners[uid]
  }
  set({ onlineUids: {} })
}

// Adds a presence listener for each newly-accepted friend, removes one for
// any friend that's no longer in the accepted list (unfriended, or a
// request that's still only pending) - never a full teardown/rebuild, so an
// already-online friend doesn't flicker every time the friendships object
// changes for an unrelated reason.
function syncPresenceListeners(
  acceptedUids: string[],
  set: (partial: Partial<FriendsState>) => void,
  get: () => FriendsState
) {
  for (const uid of acceptedUids) {
    if (presenceListeners[uid]) continue
    const presenceRef = ref(db, `presence/${uid}`)
    presenceListeners[uid] = onValue(presenceRef, (snap) => {
      set({ onlineUids: { ...get().onlineUids, [uid]: snap.exists() } })
    })
  }
  for (const uid of Object.keys(presenceListeners)) {
    if (acceptedUids.includes(uid)) continue
    presenceListeners[uid]()
    delete presenceListeners[uid]
    const rest = { ...get().onlineUids }
    delete rest[uid]
    set({ onlineUids: rest })
  }
}

// Standard Firebase "I'm online" pattern: a push()-keyed child per
// connection (not a single boolean) so having the game open in two tabs/
// devices doesn't mark you offline the moment just one of them closes -
// online = the presence/{uid} node has any child at all. Re-registers on
// every reconnect, since onDisconnect() is consumed once it fires.
function registerMyPresence(uid: string) {
  detachConnectedListener = onValue(ref(db, '.info/connected'), (snap) => {
    if (snap.val() !== true) return
    const connRef = push(ref(db, `presence/${uid}`))
    myPresenceRef = connRef
    onDisconnect(connRef)
      .remove()
      .then(() => dbSet(connRef, true))
  })
}

async function stopMyPresence() {
  if (myPresenceRef) {
    const refToClear = myPresenceRef
    myPresenceRef = null
    try {
      await onDisconnect(refToClear).cancel()
    } catch {
      // best effort - the connection may already be gone
    }
    dbRemove(refToClear).catch(() => {})
  }
  if (detachConnectedListener) {
    detachConnectedListener()
    detachConnectedListener = null
  }
}

export const useFriendsStore = create<FriendsState>((set, get) => ({
  friendships: {},
  onlineUids: {},

  initFriends: () => {
    if (friendsInitialized) return
    friendsInitialized = true

    function handleUidChange(uid: string | null) {
      if (detachFriendshipsListener) {
        detachFriendshipsListener()
        detachFriendshipsListener = null
      }
      stopMyPresence()
      stopPresenceTracking(set)
      set({ friendships: {} })

      if (!uid) return

      detachFriendshipsListener = onValue(ref(db, `friendships/${uid}`), (snap) => {
        const friendships = (snap.val() ?? {}) as Record<string, Friendship>
        set({ friendships })
        const acceptedUids = Object.entries(friendships)
          .filter(([, f]) => f.status === 'accepted')
          .map(([otherUid]) => otherUid)
        syncPresenceListeners(acceptedUids, set, get)
      })
      registerMyPresence(uid)
    }

    handleUidChange(useUserStore.getState().uid)
    useUserStore.subscribe((state, prevState) => {
      if (state.uid !== prevState.uid) handleUidChange(state.uid)
    })
  },

  sendFriendRequest: async (targetUid) => {
    const myUid = useUserStore.getState().uid
    if (!myUid || myUid === targetUid) return
    // Both mirrored copies are written in one atomic multi-path update, so
    // they can never partially apply - see friendsStore.ts's module doc in
    // the plan/CLAUDE.md for why mirroring (not a shared doc) was chosen.
    const entry = { status: 'pending', requestedBy: myUid, createdAt: serverTimestamp() }
    await dbUpdate(ref(db), {
      [`friendships/${myUid}/${targetUid}`]: entry,
      [`friendships/${targetUid}/${myUid}`]: entry,
    })
  },

  acceptFriendRequest: async (otherUid) => {
    const myUid = useUserStore.getState().uid
    if (!myUid) return
    await dbUpdate(ref(db), {
      [`friendships/${myUid}/${otherUid}/status`]: 'accepted',
      [`friendships/${otherUid}/${myUid}/status`]: 'accepted',
    })
  },

  removeFriendship: async (otherUid) => {
    const myUid = useUserStore.getState().uid
    if (!myUid) return
    await dbUpdate(ref(db), {
      [`friendships/${myUid}/${otherUid}`]: null,
      [`friendships/${otherUid}/${myUid}`]: null,
    })
  },
}))

// Resolves a "name#discriminator" pair to that user's uid via the existing
// public uniqueness index (userStore.ts's normalizeNameKey), or null if no
// such account exists. Exported standalone (not a store action) since it's
// a pure lookup with no state to update.
export async function findUidByNameAndDiscriminator(nameKey: string, discriminator: string): Promise<string | null> {
  const snap = await dbGet(ref(db, `usernames/${nameKey}/${discriminator}`))
  return snap.exists() ? (snap.val() as string) : null
}
