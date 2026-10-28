/**
 * Decorative but deterministic QR-style code. It draws the three finder
 * patterns and fills the data area from a hash of `value`, so it looks like a
 * real QR and is stable per address. (Not a scannable encoder — this is a
 * mockup; swap for a real library like `qrcode.react` for production.)
 */
const MODULES = 25

function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function inFinderZone(r: number, c: number): boolean {
  const tl = r < 8 && c < 8
  const tr = r < 8 && c >= MODULES - 8
  const bl = r >= MODULES - 8 && c < 8
  return tl || tr || bl
}

function finderDark(r: number, c: number): boolean {
  let fr = MODULES - 7
  let fc = 0
  if (r < 8 && c < 8) {
    fr = 0
    fc = 0
  } else if (r < 8 && c >= MODULES - 8) {
    fr = 0
    fc = MODULES - 7
  }
  const rr = r - fr
  const cc = c - fc
  if (rr < 0 || rr > 6 || cc < 0 || cc > 6) return false
  const border = rr === 0 || rr === 6 || cc === 0 || cc === 6
  const core = rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4
  return border || core
}

export default function QRCode({ value, size = 196 }: { value: string; size?: number }) {
  const cell = size / MODULES
  const rects = []

  for (let r = 0; r < MODULES; r++) {
    for (let c = 0; c < MODULES; c++) {
      const dark = inFinderZone(r, c)
        ? finderDark(r, c)
        : hash(`${value}:${r}:${c}`) % 100 < 46
      if (dark) {
        rects.push(
          <rect
            key={`${r}-${c}`}
            x={c * cell}
            y={r * cell}
            width={cell}
            height={cell}
            rx={cell * 0.18}
          />,
        )
      }
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="Código QR de la dirección"
      className="text-neutral-900"
    >
      <g fill="currentColor">{rects}</g>
    </svg>
  )
}
