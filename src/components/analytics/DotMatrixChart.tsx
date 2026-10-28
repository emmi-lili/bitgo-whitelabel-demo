import { pointValue, formatCurrency } from '../../data/analytics'
import type { ChartRange } from '../../data/analytics'

interface DotMatrixChartProps {
  range: ChartRange
  selected: number | null
  onSelect: (column: number | null) => void
}

export default function DotMatrixChart({ range, selected, onSelect }: DotMatrixChartProps) {
  return (
    <div className="relative mt-4 mb-2 h-[105px] px-1 select-none">
      {/* Selection tooltip */}
      {selected !== null && (
        <div className="absolute -top-2 left-0 right-0 flex justify-center pointer-events-none z-10">
          <div className="bg-neutral-900 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg shadow-lg">
            {range.labels[selected]} · {formatCurrency(pointValue(range.dots[selected]))}
          </div>
        </div>
      )}

      <div className="flex items-end justify-between h-full">
        {range.dots.map((count, col) => {
          const dark = col >= range.darkFrom
          const isSelected = selected === col
          return (
            <button
              key={col}
              type="button"
              aria-label={`${range.labels[col]}: ${formatCurrency(pointValue(count))}`}
              aria-pressed={isSelected}
              onClick={() => onSelect(isSelected ? null : col)}
              className="flex flex-col-reverse items-center gap-[3.5px] group cursor-pointer py-3 -my-3 px-[1px]"
            >
              {Array.from({ length: count }, (_, dot) => (
                <span
                  key={dot}
                  className={`w-[4.5px] h-[4.5px] rounded-full transition-colors group-hover:opacity-60 ${
                    isSelected ? 'bg-success' : dark ? 'bg-neutral-900' : 'bg-neutral-300'
                  }`}
                />
              ))}
            </button>
          )
        })}
      </div>
    </div>
  )
}
