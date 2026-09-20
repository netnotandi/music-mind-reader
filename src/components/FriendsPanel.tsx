import { get as dbGet, ref } from 'firebase/database'
import { useEffect, useState } from 'react'
import { db } from '../firebase'
import { findUidByNameAndDiscriminator, useFriendsStore } from '../state/friendsStore'
import { normalizeNameKey, useUserStore } from '../state/userStore'

const inputClasses =
  'w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm text-text placeholder:text-placeholder focus:border-primary focus:outline-none'

// One-off lookup per row rather than denormalizing name/discriminator into
// the friendship record itself - users/{uid}/name and .../discriminator are
// already public-read (from the accounts phase), so this always shows the
// friend's current name rather than a copy that could go stale. Reads those
// two fields individually rather than the whole users/{uid} node - lists/
// createdAt on that node are owner-only, and Firebase denies a parent-level
// read unless every descendant is readable, so fetching the whole node for
// someone else's uid was silently permission-denied (stuck "Loading…"
// forever, since nothing caught the rejected promise).
function useOtherProfile(uid: string) {
  const [profile, setProfile] = useState<{ name: string; discriminator: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    setProfile(null)
    Promise.all([dbGet(ref(db, `users/${uid}/name`)), dbGet(ref(db, `users/${uid}/discriminator`))])
      .then(([nameSnap, discSnap]) => {
        if (cancelled) return
        const name = nameSnap.val() as string | null
        const discriminator = discSnap.val() as string | null
        if (name && discriminator) setProfile({ name, discriminator })
      })
      .catch(() => {
        // Leave profile null - row keeps showing "Loading…" rather than crashing.
      })
    return () => {
      cancelled = true
    }
  }, [uid])

  return profile
}

function ProfileLabel({ uid }: { uid: string }) {
  const profile = useOtherProfile(uid)
  return (
    <span className="truncate">
      {profile ? (
        <>
          {profile.name} <span className="text-text-muted">#{profile.discriminator}</span>
        </>
      ) : (
        'Loading…'
      )}
    </span>
  )
}

// One combined "Friend requests" list covers both directions - incoming
// (someone asked you, you can Accept/Decline right here) and outgoing
// (you asked them, shown as a passive "Sent" badge since there's nothing to
// do but wait, plus a quiet Cancel in case you want to take it back).
function FriendRequestRow({
  uid,
  direction,
  onAccept,
  onDecline,
  onCancel,
}: {
  uid: string
  direction: 'incoming' | 'outgoing'
  onAccept?: () => void
  onDecline?: () => void
  onCancel?: () => void
}) {
  return (
    <li className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2">
      <span className="min-w-0 truncate text-sm text-text">
        <ProfileLabel uid={uid} />
      </span>
      {direction === 'incoming' ? (
        <div className="flex flex-shrink-0 gap-2">
          <button
            type="button"
            onClick={onAccept}
            className="rounded-md border border-success/40 px-2 py-1 text-xs font-semibold text-success transition hover:border-success"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={onDecline}
            className="rounded-md border border-danger/40 px-2 py-1 text-xs font-semibold text-danger transition hover:border-danger"
          >
            Decline
          </button>
        </div>
      ) : (
        <div className="flex flex-shrink-0 items-center gap-2">
          <span className="text-xs font-medium text-text-muted">Sent</span>
          <button type="button" onClick={onCancel} className="text-xs text-text-muted hover:text-text">
            Cancel
          </button>
        </div>
      )}
    </li>
  )
}

function FriendRow({ uid, online, onRemove }: { uid: string; online: boolean; onRemove: () => void }) {
  return (
    <li className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2">
      <span className="flex min-w-0 items-center gap-2 text-sm text-text">
        <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${online ? 'bg-success' : 'bg-text-muted/40'}`} />
        <ProfileLabel uid={uid} />
      </span>
      <button
        type="button"
        onClick={onRemove}
        className="flex-shrink-0 rounded-md border border-danger/40 px-2 py-1 text-xs font-semibold text-danger transition hover:border-danger"
      >
        Remove
      </button>
    </li>
  )
}

// Lives under Account -> Friends, alongside My Lists/Stats. Only ever
// rendered while status === 'ready' (signed in with a profile) - see
// AccountPanel.tsx.
export function FriendsPanel() {
  const myUid = useUserStore((s) => s.uid)
  const friendships = useFriendsStore((s) => s.friendships)
  const onlineUids = useFriendsStore((s) => s.onlineUids)
  const sendFriendRequest = useFriendsStore((s) => s.sendFriendRequest)
  const acceptFriendRequest = useFriendsStore((s) => s.acceptFriendRequest)
  const removeFriendship = useFriendsStore((s) => s.removeFriendship)

  const [name, setName] = useState('')
  const [discriminator, setDiscriminator] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const entries = Object.entries(friendships)
  const incoming = entries.filter(([, f]) => f.status === 'pending' && f.requestedBy !== myUid)
  const outgoing = entries.filter(([, f]) => f.status === 'pending' && f.requestedBy === myUid)
  const accepted = entries.filter(([, f]) => f.status === 'accepted')
  const onlineFriends = accepted.filter(([uid]) => onlineUids[uid])
  const offlineFriends = accepted.filter(([uid]) => !onlineUids[uid])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const trimmedDiscriminator = discriminator.trim()
    if (!name.trim() || trimmedDiscriminator.length !== 4) {
      setError('Enter a name and their 4-digit number.')
      return
    }
    setBusy(true)
    try {
      const nameKey = normalizeNameKey(name)
      const targetUid = await findUidByNameAndDiscriminator(nameKey, trimmedDiscriminator)
      if (!targetUid) {
        setError("Couldn't find anyone with that name and number.")
        return
      }
      if (targetUid === myUid) {
        setError("That's you!")
        return
      }
      const existing = friendships[targetUid]
      if (existing) {
        setError(existing.status === 'accepted' ? "You're already friends." : 'A request is already pending.')
        return
      }
      await sendFriendRequest(targetUid)
      setName('')
      setDiscriminator('')
    } catch {
      setError('Something went wrong — try again.')
    } finally {
      setBusy(false)
    }
  }

  const nothingYet = incoming.length === 0 && outgoing.length === 0 && accepted.length === 0

  return (
    <div>
      <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-success">Friends</h3>
      <p className="mb-3 text-xs text-text-muted">Find a friend by their name and the number next to it.</p>

      <form onSubmit={handleSend} className="mb-2 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className={`${inputClasses} sm:flex-1`}
          autoComplete="off"
        />
        <input
          type="text"
          inputMode="numeric"
          value={discriminator}
          onChange={(e) => setDiscriminator(e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder="1234"
          className={`${inputClasses} sm:w-20`}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={busy}
          className="flex-shrink-0 rounded-lg border border-primary bg-primary px-3 py-2 text-sm font-semibold text-text-on-primary transition hover:bg-primary-hover active:bg-primary-active disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? 'Sending…' : 'Send request'}
        </button>
      </form>
      {error && <p className="mb-3 text-sm text-danger">{error}</p>}

      {(incoming.length > 0 || outgoing.length > 0) && (
        <div className="mb-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-muted">Friend requests</p>
          <ul className="space-y-2">
            {incoming.map(([uid]) => (
              <FriendRequestRow
                key={uid}
                uid={uid}
                direction="incoming"
                onAccept={() => acceptFriendRequest(uid)}
                onDecline={() => removeFriendship(uid)}
              />
            ))}
            {outgoing.map(([uid]) => (
              <FriendRequestRow key={uid} uid={uid} direction="outgoing" onCancel={() => removeFriendship(uid)} />
            ))}
          </ul>
        </div>
      )}

      {nothingYet ? (
        <p className="text-sm text-text-muted">No friends yet — search for someone above.</p>
      ) : (
        <>
          {onlineFriends.length > 0 && (
            <div className="mb-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-muted">Online</p>
              <ul className="space-y-2">
                {onlineFriends.map(([uid]) => (
                  <FriendRow key={uid} uid={uid} online onRemove={() => removeFriendship(uid)} />
                ))}
              </ul>
            </div>
          )}
          {offlineFriends.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-muted">Offline</p>
              <ul className="space-y-2">
                {offlineFriends.map(([uid]) => (
                  <FriendRow key={uid} uid={uid} online={false} onRemove={() => removeFriendship(uid)} />
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  )
}
