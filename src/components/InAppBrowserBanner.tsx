import { useState } from 'react'

// Signatures found in the user-agent string of well-known in-app browsers
// (Discord, Facebook, Messenger, Instagram, etc.) - these WebViews are
// where "the game won't stay connected" / "the video won't play" reports
// actually come from, since they can restrict localStorage, WebSockets
// (Firebase's realtime connection) and third-party embeds (the YouTube
// IFrame Player) more than a real browser does.
const IN_APP_BROWSER_PATTERNS: { name: string; pattern: RegExp }[] = [
  { name: 'Discord', pattern: /\bDiscord\b/i },
  { name: 'Messenger', pattern: /\bFBAN\b|\bFBAV\b|\bFB_IAB\b/i },
  { name: 'Instagram', pattern: /\bInstagram\b/i },
  { name: 'Snapchat', pattern: /\bSnapchat\b/i },
  { name: 'TikTok', pattern: /\bBytedanceWebview\b|\bTikTok\b/i },
  { name: 'Line', pattern: /\bLine\//i },
]

function detectInAppBrowser(userAgent: string): string | null {
  for (const { name, pattern } of IN_APP_BROWSER_PATTERNS) {
    if (pattern.test(userAgent)) return name
  }
  return null
}

function isAndroid(userAgent: string): boolean {
  return /Android/i.test(userAgent)
}

// Best-effort only, and Android-specific: most in-app browsers respect an
// `intent://` URL by handing off to a real browser (usually Chrome), but
// some block it outright - there's no equivalent trick on iOS, where
// Apple's WebKit restrictions make it effectively impossible for a page to
// open itself in Safari on the user's behalf.
function tryOpenInAndroidBrowser() {
  const url = `${window.location.origin}${window.location.pathname}`
  const withoutScheme = url.replace(/^https?:\/\//, '')
  window.location.href = `intent://${withoutScheme}#Intent;scheme=https;action=android.intent.action.VIEW;end`
}

export function InAppBrowserBanner() {
  const [dismissed, setDismissed] = useState(false)
  const userAgent = navigator.userAgent
  const appName = detectInAppBrowser(userAgent)

  if (!appName || dismissed) return null

  const androidDevice = isAndroid(userAgent)

  return (
    // z-30: below the hamburger menu button and room code badge (both
    // z-40, fixed top-4) so they still float visibly on top of this banner
    // instead of being hidden behind it while it's showing.
    <div className="fixed inset-x-0 top-0 z-30 border-b border-border-strong bg-surface py-3 pl-16 pr-16 text-sm text-text shadow-lg">
      <div className="mx-auto flex max-w-md items-start gap-3">
        <span className="mt-0.5 flex-shrink-0 text-lg">⚠️</span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">You're viewing this inside {appName}</p>
          <p className="mt-1 text-text-secondary">
            {androidDevice
              ? 'For the game to work properly (staying connected, playing videos), open it in your regular browser instead.'
              : `Tap the ••• menu (usually top-right) and choose "Open in Browser" or "Open in Safari" - otherwise the game may lose your connection or fail to play videos.`}
          </p>
          {androidDevice && (
            <button
              type="button"
              onClick={tryOpenInAndroidBrowser}
              className="mt-2 rounded-lg border border-primary bg-primary px-3 py-1.5 text-xs font-semibold text-text-on-primary transition hover:bg-primary-hover active:bg-primary-active"
            >
              Open in Browser
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="flex-shrink-0 text-lg text-text-muted transition hover:text-text"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
