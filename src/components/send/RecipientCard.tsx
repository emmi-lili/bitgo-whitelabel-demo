import { useState } from 'react'
import { recipients, truncateAddress } from '../../data/send'
import type { Recipient } from '../../data/send'
import { PlusIcon, CheckIcon } from './icons'

const PASTED_ADDRESS = '0x9aE4f2Cd71B0a83F5e6D4c2B1a0F9e8D7c6B5a40'

function SendAvatar({
  recipient,
  selected,
  onSelect,
}: {
  recipient: Recipient
  selected: boolean
  onSelect: () => void
}) {
  const [failed, setFailed] = useState(false)

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className="flex flex-col items-center space-y-1.5 group"
    >
      <div className="relative">
        <div
          className={`w-12 h-12 rounded-full overflow-hidden transition-transform group-hover:scale-105 group-active:scale-95 ${
            selected ? 'border-2 border-neutral-900 p-0.5' : 'border border-gray-200'
          }`}
        >
          {failed ? (
            <div className="w-full h-full rounded-full bg-neutral-200 flex items-center justify-center text-neutral-600 font-semibold text-sm">
              {recipient.name.charAt(0)}
            </div>
          ) : (
            <img
              alt={recipient.name}
              src={recipient.avatar}
              onError={() => setFailed(true)}
              className={`w-full h-full rounded-full object-cover${selected ? ' grayscale' : ''}`}
            />
          )}
        </div>
        {selected && (
          <span className="absolute bottom-0 right-0 w-4 h-4 bg-neutral-900 border-2 border-white rounded-full flex items-center justify-center">
            <CheckIcon className="w-2 h-2 text-white" />
          </span>
        )}
      </div>
      <span
        className={`text-[12px] tracking-tight ${selected ? 'font-bold text-neutral-900' : 'font-medium text-neutral-500'}`}
      >
        {recipient.name}
      </span>
    </button>
  )
}

export default function RecipientCard({
  recipient,
  address,
  onSelect,
  onAddressChange,
}: {
  recipient: Recipient | null
  address: string
  onSelect: (recipient: Recipient) => void
  onAddressChange: (value: string) => void
}) {
  return (
    <section className="bg-white rounded-3xl p-4 analytics-card border border-gray-100">
      <label
        className="block text-[12px] font-bold text-neutral-400 uppercase tracking-wider mb-2"
        htmlFor="walletAddress"
      >
        Send To
      </label>
      <div className="relative flex items-center">
        <input
          id="walletAddress"
          type="text"
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          placeholder="ENS, phone or wallet address…"
          className="w-full bg-[#F6F7FA] text-neutral-900 font-medium text-[14px] rounded-2xl py-3 pl-3.5 pr-20 border border-transparent focus:border-neutral-400 focus:bg-white focus:outline-none transition"
        />
        <button
          type="button"
          onClick={() => onAddressChange(truncateAddress(PASTED_ADDRESS))}
          className="absolute right-2 bg-white hover:bg-neutral-100 text-neutral-800 text-[11px] font-bold px-2.5 py-1.5 rounded-xl border border-gray-200/80 active:scale-95 transition"
        >
          PASTE
        </button>
      </div>

      {/* Quick Send */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[12px] font-bold text-neutral-400 uppercase tracking-wider">
            Quick Send
          </span>
          <button
            type="button"
            aria-label="Add recipient"
            className="w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center active:scale-90 transition"
          >
            <PlusIcon className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-start justify-between px-1">
          {recipients.map((r) => (
            <SendAvatar
              key={r.id}
              recipient={r}
              selected={recipient?.id === r.id}
              onSelect={() => onSelect(r)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
