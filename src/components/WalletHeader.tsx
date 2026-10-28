import { walletName } from '../data/mock'
import { ChevronDownIcon } from './icons'

export default function WalletHeader() {
  return (
    <header className="pt-1 px-6 pb-2 flex items-center justify-between">
      {/* Wallet Switcher Dropdown */}
      <button
        aria-label="Seleccionar cartera"
        className="inline-flex items-center space-x-1.5 text-base font-semibold text-neutral-800 tracking-tight rounded-xl px-1 -mx-1 py-0.5 hover:opacity-80 active:scale-[0.98] transition"
        type="button"
      >
        <span className="text-[28px] font-bold text-[#1A1C1E] tracking-tight">{walletName}</span>
        <ChevronDownIcon className="w-4 h-4 text-neutral-400 stroke-[2.5] mt-1" />
      </button>
      {/* Subtle Top-Right Indicator */}
      <div className="w-2 h-2 rounded-full bg-success ring-4 ring-success/15" />
    </header>
  )
}
