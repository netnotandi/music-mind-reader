import { ROOM_CODE_LENGTH } from '../state/gameStore'

// A scanned QR could be the full join URL or, in principle, just a bare
// code - either way, pull out the first run of alphanumeric characters
// after the last /join/ segment (or from the start if there isn't one).
export function extractRoomCode(scanned: string): string {
  const match = scanned.match(/\/join\/([A-Za-z0-9]+)/)
  const raw = match ? match[1] : scanned
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, ROOM_CODE_LENGTH)
}