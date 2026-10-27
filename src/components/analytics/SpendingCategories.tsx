import { useState } from 'react'
import { spendingCategories, formatCurrency } from '../../data/analytics'
import type { SpendingCategory } from '../../data/analytics'
import CardMenu from './CardMenu'
import { ChevronDownIcon } from './icons'

type SortMode = 'default' | 'high' | 'low'

function SegmentedBar({ filled, total, color }: { filled: number; total: number; color: string }) {
  return (
    <div className="flex items-center space-x-[2.2px] w-full overflow-hidden mt-1.5">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className="w-[3px] h-[14px] rounded-full shrink-0 transition-colors"
          style={{ backgroundColor: i < filled ? color : '#E5E5E5' }}
        />
      ))}
    </div>
  )
}

function CategoryRow({
  category,
  open,
  onToggle,
}: {
  category: SpendingCategory
  open: boolean
  onToggle: () => void
}) {
  const hasBar = category.filled != null && category.total != null && category.color != null

  return (
    <div className={hasBar ? '' : 'pb-1'}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex justify-between items-center text-[13px] font-medium group"
      >
        <span className="flex items-center gap-1 text-neutral-600 group-hover:text-neutral-900 transition-colors">
          {category.label}
          <ChevronDownIcon
            className={`w-3 h-3 text-neutral-400 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </span>
        <span className="text-neutral-900 font-bold text-[14px]">
          {formatCurrency(category.amount)}
        </span>
      </button>

      {hasBar && (
        <SegmentedBar filled={category.filled!} total={category.total!} color={category.color!} />
      )}

      {open && category.detail && (
        <p className="text-[11.5px] font-medium text-neutral-400 mt-2">{category.detail}</p>
      )}
    </div>
  )
}

export default function SpendingCategories() {
  const [sort, setSort] = useState<SortMode>('default')
  const [expanded, setExpanded] = useState<string | null>(null)

  const ordered = [...spendingCategories]
  if (sort === 'high') ordered.sort((a, b) => b.amount - a.amount)
  if (sort === 'low') ordered.sort((a, b) => a.amount - b.amount)

  return (
    <section className="bg-white rounded-3xl p-5 analytics-card">
      {/* Header */}
      <div className="flex justify-between items-center mb-3.5">
        <h2 className="text-[17px] font-bold text-neutral-900 tracking-tight">
          Spending categories
        </h2>
        <CardMenu
          options={[
            { label: 'Default order', onSelect: () => setSort('default'), active: sort === 'default' },
            { label: 'Highest first', onSelect: () => setSort('high'), active: sort === 'high' },
            { label: 'Lowest first', onSelect: () => setSort('low'), active: sort === 'low' },
          ]}
        />
      </div>

      {/* Items */}
      <div className="space-y-4">
        {ordered.map((category) => (
          <CategoryRow
            key={category.id}
            category={category}
            open={expanded === category.id}
            onToggle={() => setExpanded(expanded === category.id ? null : category.id)}
          />
        ))}
      </div>
    </section>
  )
}
