import { useId } from 'react'
import { balance, formatCurrency } from '../data/mock'

export default function BalanceHero() {
  const gradientId = useId()

  return (
    <section className="px-6 pt-2 pb-4">
      <div className="relative overflow-hidden pt-2">
        {/* Background Chart Wave Graphic */}
        <svg
          className="absolute right-0 bottom-1 w-3/5 h-16 opacity-30 text-neutral-300 pointer-events-none"
          fill="none"
          viewBox="0 0 200 80"
        >
          <path
            d="M0,65 Q30,60 55,40 T110,35 T160,15 T200,5"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2.5"
          />
          <path
            d="M0,65 Q30,60 55,40 T110,35 T160,15 T200,5 L200,80 L0,80 Z"
            fill={`url(#${gradientId})`}
            opacity="0.4"
          />
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="currentColor" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
        </svg>
        <p className="text-[13px] font-medium text-[#7C8089] tracking-tight">Total Balance</p>
        <h1 className="text-[38px] leading-tight font-extrabold text-[#111315] tracking-tight mt-0.5 tabular-nums">
          {formatCurrency(balance)}
        </h1>
        <p className="text-[13px] font-semibold text-success mt-1">+$128.40 (2.1%) today</p>
      </div>
    </section>
  )
}
