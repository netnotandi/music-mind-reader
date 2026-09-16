import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../state/gameStore'

// Only exists at all while the host (or anyone - not host-gated, see Game
// Setup) has turned on "remote play" for this room, per the "Textaspjall
// fyrir fjarspilun" spec: if everyone's in the same room they just talk out
// loud, so the icon would only be clutter. Mounted globally (App.tsx),
// same pattern as MenuOverlay/RoomCodeBadge, so it's available on every
// screen while a remote-play game is active - not just gameplay screens.
export function ChatOverlay() {
  const roomCode = useGameStore((s) => s.roomCode)
  const remotePlayEnabled = useGameStore((s) => s.remotePlayEnabled)
  const localPlayerId = useGameStore((s) => s.localPlayerId)
  const chatMessages = useGameStore((s) => s.chatMessages)
  const chatLastRead = useGameStore((s) => s.chatLastRead)
  const sendChatMessage = useGameStore((s) => s.sendChatMessage)
  const markChatRead = useGameStore((s) => s.markChatRead)

  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const listRef = useRef<HTMLDivElement | null>(null)

  const lastMessage = chatMessages[chatMessages.length - 1]
  const lastReadAt = localPlayerId ? (chatLastRead[localPlayerId] ?? 0) : 0
  const hasUnread = !isOpen && !!lastMessage && lastMessage.timestamp > lastReadAt

  useEffect(() => {
    if (isOpen && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [isOpen, chatMessages.length])

  if (!roomCode || !remotePlayEnabled) return null

  function toggleOpen() {
    const next = !isOpen
    setIsOpen(next)
    if (next) markChatRead()
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.trim()) return
    sendChatMessage(draft)
    setDraft('')
  }

  return (
    <>
      <button
        type="button"
        onClick={toggleOpen}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
        className={`fixed bottom-4 right-4 z-40 grid h-12 w-12 place-items-center rounded-full border text-xl backdrop-blur transition ${
          hasUnread
            ? 'border-danger bg-danger text-white'
            : 'border-border bg-surface/80 text-text hover:border-border-strong'
        }`}
      >
        💬
      </button>

      {isOpen && (
        <div className="fixed bottom-20 right-4 z-40 flex h-96 w-80 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-bg shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <span className="text-sm font-semibold uppercase tracking-wide text-success">Chat</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close"
              className="grid h-7 w-7 place-items-center rounded-lg text-lg text-text-muted transition hover:text-text"
            >
              ✕
            </button>
          </div>

          <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
            {chatMessages.length === 0 ? (
              <p className="text-sm text-text-muted">No messages yet - say hello.</p>
            ) : (
              chatMessages.map((msg) => {
                const isMine = msg.senderId === localPlayerId
                return (
                  <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                    {!isMine && <span className="mb-0.5 text-[11px] text-text-muted">{msg.senderName}</span>}
                    <span
                      className={`max-w-[85%] break-words rounded-xl px-3 py-1.5 text-sm ${
                        isMine ? 'bg-primary text-text-on-primary' : 'bg-surface text-text'
                      }`}
                    >
                      {msg.text}
                    </span>
                  </div>
                )
              })
            )}
          </div>

          <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-border p-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Message..."
              className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-border-strong focus:outline-none"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              className="flex-shrink-0 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-text-on-primary transition disabled:opacity-40"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  )
}
