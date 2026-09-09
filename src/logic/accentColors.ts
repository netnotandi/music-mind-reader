// Shared accent palette sampled from the logo's cyan -> blue -> violet ->
// pink gradient, cycled by index wherever a list of items benefits from
// reading as distinct-but-on-brand rather than one flat accent color.
//
// Dark and light get separate palettes, not just separate opacities: dark's
// bright 400-weight borders/300-weight text read fine against a near-black
// page, but that same pale text has too little contrast against a white or
// lavender card - light uses darker 500/700-weight shades of the same six
// hues instead, so the "different color per item" identity survives without
// becoming illegible.
export const ACCENT_COLORS_DARK = [
  { border: 'border-cyan-400', bg: 'bg-cyan-400/15', text: 'text-cyan-300' },
  { border: 'border-sky-400', bg: 'bg-sky-400/15', text: 'text-sky-300' },
  { border: 'border-blue-400', bg: 'bg-blue-400/15', text: 'text-blue-300' },
  { border: 'border-violet-400', bg: 'bg-violet-400/15', text: 'text-violet-300' },
  { border: 'border-fuchsia-400', bg: 'bg-fuchsia-400/15', text: 'text-fuchsia-300' },
  { border: 'border-pink-400', bg: 'bg-pink-400/15', text: 'text-pink-300' },
]

export const ACCENT_COLORS_LIGHT = [
  { border: 'border-cyan-500', bg: 'bg-cyan-500/10', text: 'text-cyan-700' },
  { border: 'border-sky-500', bg: 'bg-sky-500/10', text: 'text-sky-700' },
  { border: 'border-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-700' },
  { border: 'border-violet-500', bg: 'bg-violet-500/10', text: 'text-violet-700' },
  { border: 'border-fuchsia-500', bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-700' },
  { border: 'border-pink-500', bg: 'bg-pink-500/10', text: 'text-pink-700' },
]

export function accentColorFor(index: number, theme: 'light' | 'dark' = 'dark') {
  const palette = theme === 'light' ? ACCENT_COLORS_LIGHT : ACCENT_COLORS_DARK
  return palette[index % palette.length]
}
