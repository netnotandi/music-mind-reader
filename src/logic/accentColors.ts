// Shared accent palette sampled from the logo's cyan -> blue -> violet ->
// pink gradient, cycled by index wherever a list of items benefits from
// reading as distinct-but-on-brand rather than one flat accent color.
export const ACCENT_COLORS = [
  { border: 'border-cyan-400', bg: 'bg-cyan-400/15', text: 'text-cyan-300' },
  { border: 'border-sky-400', bg: 'bg-sky-400/15', text: 'text-sky-300' },
  { border: 'border-blue-400', bg: 'bg-blue-400/15', text: 'text-blue-300' },
  { border: 'border-violet-400', bg: 'bg-violet-400/15', text: 'text-violet-300' },
  { border: 'border-fuchsia-400', bg: 'bg-fuchsia-400/15', text: 'text-fuchsia-300' },
  { border: 'border-pink-400', bg: 'bg-pink-400/15', text: 'text-pink-300' },
]

export function accentColorFor(index: number) {
  return ACCENT_COLORS[index % ACCENT_COLORS.length]
}
