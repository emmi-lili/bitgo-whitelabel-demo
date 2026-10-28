import { useState } from 'react'
import { assets, availUsd, formatUnits } from '../../data/send'
import type { SendAsset } from '../../data/send'
import { formatCurrency } from '../../data/mock'
import AssetBadge from './AssetBadge'
import { ChevronDownIcon, CheckIcon } from './icons'

export default function AssetSelector({
  asset,
  onSelect,
}: {
  asset: SendAsset
  onSelect: (asset: SendAsset) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <section className="bg-white rounded-2xl analytics-card border border-gray-100/90 overflow-hidden">
      {/* Selected asset */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full p-3.5 flex items-center justify-between text-left active:scale-[0.99] transition"
      >
        <div className="flex items-center space-x-3">
          <div className="relative">
            <AssetBadge asset={asset} />
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-success border-2 border-white rounded-full" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-[16px] text-neutral-900 leading-tight">
                {asset.name}
              </span>
              <span className="text-[12px] font-semibold text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded">
                {asset.symbol}
              </span>
            </div>
            <p className="text-[12.5px] text-neutral-400 font-medium mt-0.5">
              Disp.: {formatUnits(asset.avail)} {asset.symbol}{' '}
              <span className="text-neutral-500 font-semibold">(~{formatCurrency(availUsd(asset))})</span>
            </p>
          </div>
        </div>
        <span className="w-8 h-8 rounded-full bg-neutral-100/80 flex items-center justify-center text-neutral-600 shrink-0">
          <ChevronDownIcon className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {/* Asset list */}
      {open && (
        <div className="border-t border-gray-100 max-h-72 overflow-y-auto no-scrollbar">
          {assets.map((a) => {
            const selected = a.id === asset.id
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => {
                  onSelect(a)
                  setOpen(false)
                }}
                aria-pressed={selected}
                className={`w-full px-3.5 py-2.5 flex items-center justify-between text-left transition-colors ${
                  selected ? 'bg-neutral-50' : 'hover:bg-neutral-50'
                }`}
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <AssetBadge asset={a} size="sm" />
                  <div className="overflow-hidden">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-semibold text-[14px] text-neutral-900 truncate">
                        {a.name}
                      </span>
                      <span className="text-[10.5px] font-semibold text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded-full shrink-0">
                        {a.network}
                      </span>
                    </div>
                    <p className="text-[12px] text-neutral-400 font-medium mt-0.5">
                      {formatUnits(a.avail)} {a.symbol}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <span className="text-[12.5px] font-semibold text-neutral-700">
                    {formatCurrency(availUsd(a))}
                  </span>
                  {selected && (
                    <span className="w-4 h-4 rounded-full bg-neutral-900 text-white flex items-center justify-center">
                      <CheckIcon className="w-2 h-2" />
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}
