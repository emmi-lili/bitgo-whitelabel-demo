import { formatCurrency } from './mock'

export { formatCurrency }

/* ---- Portfolio value card ---- */

export const portfolio = {
  label: 'Valor de cartera',
}

export interface ChartRange {
  id: string
  /** One entry per column = number of stacked dots */
  dots: number[]
  /** Columns from this index onward render in the dark accent colour */
  darkFrom: number
  /** Headline value for the range */
  value: number
  /** Change caption shown under the value */
  change: string
  rangeStart: string
  rangeEnd: string
  /** Per-column label shown in the selection tooltip */
  labels: string[]
}

const jun = (d: number) => `${String(d).padStart(2, '0')} JUN`

export const chartRanges: ChartRange[] = [
  {
    id: '1W',
    dots: [4, 6, 5, 8, 7, 10, 12],
    darkFrom: 3,
    value: 1630.21,
    change: '+$54.10 (3.4%) esta semana',
    rangeStart: '24 JUN 2026',
    rangeEnd: '30 JUN 2026',
    labels: [24, 25, 26, 27, 28, 29, 30].map(jun),
  },
  {
    id: '1M',
    dots: [1, 2, 3, 8, 4, 2, 4, 6, 3, 2, 2, 3, 2, 8, 12, 14, 10, 9, 6, 8, 6, 5, 8, 6, 4, 7, 6],
    darkFrom: 13,
    value: 1630.21,
    change: '+$128.40 (2.1%) hoy',
    rangeStart: '01 JUN 2026',
    rangeEnd: '30 JUN 2026',
    labels: Array.from({ length: 27 }, (_, i) => jun(Math.round((i / 26) * 29) + 1)),
  },
  {
    id: '1Y',
    dots: [3, 5, 4, 6, 5, 7, 6, 8, 7, 9, 11, 14],
    darkFrom: 6,
    value: 1630.21,
    change: '+$612.00 (60.2%) este año',
    rangeStart: 'ENE 2026',
    rangeEnd: 'DIC 2026',
    labels: ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'],
  },
]

/** Synthetic value for a column, derived from its dot height. */
export const pointValue = (dots: number): number => Math.round((1180 + dots * 32) * 100) / 100

/* ---- Asset allocation card ---- */

export interface Asset {
  id: string
  name: string
  /** Single-character glyph shown inside the coin badge */
  glyph: string
  /** Tailwind classes for the badge background */
  badgeClass: string
  /** Optional glyph sizing override (defaults to text-[10px]) */
  glyphClass?: string
  percent: number
}

/**
 * Allocations are a true share of the portfolio and sum to 100%.
 * The bar fill is scaled to the largest holding (see AssetAllocation) so the
 * biggest position fills its track while the % label stays the real share.
 */
export const assets: Asset[] = [
  { id: 'btc', name: 'Bitcoin', glyph: '₿', badgeClass: 'bg-[#F7931A]', percent: 42 },
  { id: 'ltc', name: 'Litecoin', glyph: 'Ł', badgeClass: 'bg-[#345D9D]', percent: 8 },
  { id: 'bnb', name: 'BNB', glyph: '◆', badgeClass: 'bg-[#F3BA2F]', glyphClass: 'text-[8px]', percent: 12 },
  { id: 'usdt', name: 'Tether', glyph: '₮', badgeClass: 'bg-[#26A17B]', percent: 20 },
  {
    id: 'sol',
    name: 'Solana',
    glyph: '≡',
    badgeClass: 'bg-gradient-to-tr from-[#9945FF] to-[#14F195]',
    glyphClass: 'text-[8px]',
    percent: 14,
  },
  { id: 'trx', name: 'TRON', glyph: '▼', badgeClass: 'bg-[#EB0029]', glyphClass: 'text-[8px]', percent: 4 },
]

/* ---- Spending categories card ---- */

export interface SpendingCategory {
  id: string
  label: string
  amount: number
  /** Number of filled segments (omitted categories render no bar) */
  filled?: number
  /** Total number of segments in the bar */
  total?: number
  /** Fill colour for the active segments */
  color?: string
  /** Detail line revealed when the row is expanded */
  detail?: string
}

export const spendingCategories: SpendingCategory[] = [
  {
    id: 'shopping',
    label: 'Compras',
    amount: 1240,
    filled: 28,
    total: 39,
    color: '#E5B80B',
    detail: '32 compras · prom. $38.75',
  },
  {
    id: 'food',
    label: 'Comida',
    amount: 760,
    filled: 19,
    total: 39,
    color: '#525CEB',
    detail: '21 pedidos · prom. $36.19',
  },
  {
    id: 'transport',
    label: 'Transporte',
    amount: 148,
    filled: 5,
    total: 39,
    color: '#14B8A6',
    detail: '12 viajes · prom. $12.33',
  },
]
