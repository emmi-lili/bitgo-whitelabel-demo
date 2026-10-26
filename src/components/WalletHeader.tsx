import { walletName } from '../data/mock'
import { ChevronDownIcon } from './icons'

export default function WalletHeader() {
  return (
    <header className="pt-12 px-6 pb-2 flex items-center justify-between">
      {/* Wallet Switcher Dropdown */}
      <button
        aria-label="Select Wallet"
        className="inline-flex items-center space-x-1.5 text-base font-semibold text-neutral-800 tracking-tight hover:opacity-80 transition"
        type="button"
      >
        <span className="text-[17px] font-bold text-[#1A1C1E]">{walletName}</span>
        <ChevronDownIcon className="w-4 h-4 text-neutral-400 stroke-[2.5]" />
      </button>
      {/* Subtle Top-Right Indicator */}
      <div className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
    </header>
  )
}
