import type { SendAsset } from '../../data/send'
import { BoltIcon, ClockIcon, ChevronRightIcon } from './icons'

export default function NetworkCard({ asset }: { asset: SendAsset }) {
  return (
    <section className="bg-white rounded-3xl p-4 analytics-card border border-gray-100 space-y-3">
      {/* Network */}
      <button
        type="button"
        className="w-full flex items-center justify-between text-xs active:scale-[0.99] transition"
      >
        <span className="flex items-center space-x-2 text-neutral-500">
          <BoltIcon className="w-4 h-4 text-neutral-400" />
          <span className="font-medium text-neutral-500">Network</span>
        </span>
        <span className="flex items-center space-x-1 font-bold text-neutral-800">
          <span>{asset.networkLabel}</span>
          <ChevronRightIcon className="w-3.5 h-3.5 text-neutral-400" />
        </span>
      </button>

      <div className="h-px bg-gray-100 w-full" />

      {/* Estimated arrival */}
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center space-x-2 text-neutral-500">
          <ClockIcon className="w-4 h-4 text-neutral-400" />
          <span className="font-medium text-neutral-500">Estimated Arrival</span>
        </span>
        <span className="flex items-center space-x-1.5 font-bold text-neutral-800">
          <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
          <span>{asset.arrival}</span>
        </span>
      </div>
    </section>
  )
}
