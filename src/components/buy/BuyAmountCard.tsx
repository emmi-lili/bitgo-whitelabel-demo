import { useState } from 'react'
import { formatCurrency } from '../../data/mock'
import type { SendAsset } from '../../data/send'

const PERCENTS = [25, 50, 75] as const

/** Keep only digits and a single decimal point, capped at 2 decimals. */
function sanitizeAmount(raw: string): string {
  let v = raw.replace(/[^0-9.]/g, '')
  const parts = v.split('.')
  if (parts.length > 2) v = `${parts[0]}.${parts.slice(1).join('')}`
  const [whole, dec] = v.split('.')
  if (dec !== undefined) v = `${whole}.${dec.slice(0, 2)}`
  return v
}

export default function BuyAmountCard({
  asset,
  value,
  onChange,
  cashBalance,
  insufficient,
}: {
  asset: SendAsset
  value: string
  onChange: (value: string) => void
  cashBalance: number
  insufficient: boolean
}) {
  const [activePct, setActivePct] = useState<number | null>(null)

  const amount = parseFloat(value) || 0
  const receive = (amount / asset.price).toLocaleString('en-US', { maximumFractionDigits: 6 })

  const onInput = (raw: string) => {
    onChange(sanitizeAmount(raw))
    setActivePct(null)
  }

  const setByPercent = (pct: number) => {
    setActivePct(pct)
    onChange((Math.round(cashBalance * (pct / 100) * 100) / 100).toFixed(2))
  }

  return (
    <section className="bg-white rounded-3xl p-5 analytics-card border border-gray-100 flex flex-col items-center text-center">
      <label htmlFor="buyAmount" className="text-[12px] font-bold text-neutral-400 tracking-wider uppercase">
        Pagas
      </label>

      {/* Editable amount */}
      <div className="my-2.5 flex items-baseline justify-center tabular-nums">
        <span
          className={`text-3xl font-extrabold tracking-tight mr-1 ${insufficient ? 'text-red-500' : 'text-neutral-900'}`}
        >
          $
        </span>
        <input
          id="buyAmount"
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => onInput(e.target.value)}
          onFocus={(e) => e.target.select()}
          placeholder="0.00"
          aria-label="Monto a pagar en dólares"
          className={`text-5xl font-extrabold tracking-tight text-center bg-transparent border-0 p-0 focus:outline-none focus:ring-0 placeholder:text-neutral-300 ${
            insufficient ? 'text-red-500 caret-red-500' : 'text-neutral-900 caret-neutral-900'
          }`}
          style={{ width: `${Math.max(value.length || 4, 1)}ch` }}
        />
      </div>

      {/* You receive */}
      <div className="inline-flex items-center space-x-1.5 bg-[#F6F7FA] px-3 py-1 rounded-full text-xs font-semibold text-neutral-600">
        <span>
          Recibes ≈ {receive} {asset.symbol}
        </span>
      </div>

      {/* Balance / insufficient funds */}
      {insufficient ? (
        <p className="text-[12.5px] font-semibold text-red-500 mt-3">
          Fondos insuficientes · Saldo {formatCurrency(cashBalance)}
        </p>
      ) : (
        <p className="text-[12.5px] font-medium text-neutral-500 mt-3">
          Saldo disponible{' '}
          <span className="font-semibold text-neutral-800">{formatCurrency(cashBalance)}</span>
        </p>
      )}

      {/* Quick percent pills */}
      <div className="grid grid-cols-4 gap-2.5 w-full mt-4">
        {PERCENTS.map((pct) => (
          <button
            key={pct}
            type="button"
            onClick={() => setByPercent(pct)}
            className={`py-2 rounded-xl text-xs font-bold active:scale-95 transition ${
              activePct === pct
                ? 'bg-neutral-900 text-white shadow-sm'
                : 'bg-[#F6F7FA] text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            {pct}%
          </button>
        ))}
        <button
          type="button"
          onClick={() => setByPercent(100)}
          className={`py-2 rounded-xl text-xs font-bold active:scale-95 transition ${
            activePct === 100
              ? 'bg-neutral-900 text-white shadow-sm ring-2 ring-neutral-900/20'
              : 'bg-neutral-900 text-white shadow-sm hover:bg-neutral-800'
          }`}
        >
          MAX
        </button>
      </div>
    </section>
  )
}
