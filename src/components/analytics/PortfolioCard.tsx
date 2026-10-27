import { useState } from 'react'
import { portfolio, chartRanges, pointValue, formatCurrency } from '../../data/analytics'
import DotMatrixChart from './DotMatrixChart'

export default function PortfolioCard() {
  const [rangeId, setRangeId] = useState('1M')
  const [selected, setSelected] = useState<number | null>(null)

  const range = chartRanges.find((r) => r.id === rangeId) ?? chartRanges[0]
  const displayValue = selected !== null ? pointValue(range.dots[selected]) : range.value

  const changeRange = (id: string) => {
    setRangeId(id)
    setSelected(null)
  }

  return (
    <section className="bg-white rounded-3xl p-5 analytics-card relative overflow-hidden">
      {/* Header + range toggle */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <span className="text-neutral-400 font-medium text-[13.5px]">{portfolio.label}</span>
          <div className="text-[31px] font-extrabold tracking-tight text-neutral-900 mt-0.5 leading-none tabular-nums">
            {formatCurrency(displayValue)}
          </div>
          <div className="text-[13px] font-semibold text-[#1FAF53] mt-1.5 flex items-center">
            {selected !== null ? range.labels[selected] : range.change}
          </div>
        </div>

        {/* Range segmented control */}
        <div className="flex bg-neutral-100 rounded-full p-0.5 text-[11px] font-semibold shrink-0">
          {chartRanges.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => changeRange(r.id)}
              className={`px-2.5 py-1 rounded-full transition-colors ${
                r.id === rangeId ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-400 hover:text-neutral-600'
              }`}
            >
              {r.id}
            </button>
          ))}
        </div>
      </div>

      {/* Dot-matrix histogram */}
      <DotMatrixChart range={range} selected={selected} onSelect={setSelected} />

      {/* Date labels */}
      <div className="flex justify-between items-center text-[10.5px] font-semibold text-neutral-400 tracking-wider pt-1">
        <span>{range.rangeStart}</span>
        <span>{range.rangeEnd}</span>
      </div>
    </section>
  )
}
