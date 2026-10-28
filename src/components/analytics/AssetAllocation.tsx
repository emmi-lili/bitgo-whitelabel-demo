import { useEffect, useState } from 'react'
import { assets } from '../../data/analytics'
import CardMenu from './CardMenu'

type SortMode = 'default' | 'holdings' | 'name'

const MAX_PERCENT = Math.max(...assets.map((a) => a.percent))

export default function AssetAllocation() {
  const [sort, setSort] = useState<SortMode>('default')
  const [selected, setSelected] = useState<string | null>(null)
  const [shown, setShown] = useState(false)

  // Grow the bars from 0 once mounted.
  useEffect(() => setShown(true), [])

  const ordered = [...assets]
  if (sort === 'holdings') ordered.sort((a, b) => b.percent - a.percent)
  if (sort === 'name') ordered.sort((a, b) => a.name.localeCompare(b.name))

  return (
    <section className="bg-white rounded-3xl p-5 analytics-card">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-[17px] font-bold text-neutral-900 tracking-tight">Mis Activos</h2>
          <p className="text-[11.5px] font-medium text-neutral-500 mt-0.5">% de la cartera</p>
        </div>
        <CardMenu
          options={[
            { label: 'Orden predeterminado', onSelect: () => setSort('default'), active: sort === 'default' },
            { label: 'Ordenar por tenencia', onSelect: () => setSort('holdings'), active: sort === 'holdings' },
            { label: 'Ordenar por nombre', onSelect: () => setSort('name'), active: sort === 'name' },
          ]}
        />
      </div>

      {/* 3-column assets grid */}
      <div className="grid grid-cols-3 gap-x-2.5 gap-y-4">
        {ordered.map((asset) => {
          const active = selected === asset.id
          return (
            <button
              key={asset.id}
              type="button"
              onClick={() => setSelected(active ? null : asset.id)}
              aria-pressed={active}
              className={`space-y-1.5 text-left rounded-xl p-1.5 -m-1.5 transition-colors active:scale-[0.98] ${
                active ? 'bg-neutral-100' : 'hover:bg-neutral-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1 overflow-hidden">
                  <div
                    className={`w-4 h-4 rounded-full text-white flex items-center justify-center font-bold shrink-0 ${asset.badgeClass} ${asset.glyphClass ?? 'text-[10px]'}`}
                  >
                    {asset.glyph}
                  </div>
                  <span className="text-[11.5px] font-semibold text-neutral-800 truncate">
                    {asset.name}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-neutral-800 shrink-0">
                  {asset.percent}%
                </span>
              </div>
              <div className="w-full bg-neutral-200 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-neutral-900 h-full rounded-full transition-[width] duration-700 ease-out"
                  style={{ width: shown ? `${(asset.percent / MAX_PERCENT) * 100}%` : '0%' }}
                />
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
