import type { ReactNode } from 'react'
import { formatCurrency } from '../../data/mock'
import type { SendAsset, Recipient } from '../../data/send'

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-[13px] font-medium text-neutral-500">{label}</span>
      <div className="text-[13px] font-semibold text-neutral-900 flex items-center gap-1.5 min-w-0">
        {children}
      </div>
    </div>
  )
}

export default function ReviewSummary({
  asset,
  amount,
  recipient,
  address,
}: {
  asset: SendAsset
  amount: number
  recipient: Recipient | null
  address: string
}) {
  const crypto = (amount / asset.price).toLocaleString('en-US', { maximumFractionDigits: 6 })
  const total = amount + asset.fee

  return (
    <div className="px-5 pt-2 pb-4">
      {/* Headline */}
      <div className="text-center mb-5">
        <p className="text-[13px] font-medium text-neutral-400">Estás enviando</p>
        <div className="text-[40px] font-extrabold text-neutral-900 tracking-tight mt-1 tabular-nums">
          {formatCurrency(amount)}
        </div>
        <p className="text-[13px] font-semibold text-neutral-500 mt-1">
          ≈ {crypto} {asset.symbol}
        </p>
      </div>

      {/* Details */}
      <div className="bg-white rounded-3xl px-4 analytics-card border border-gray-100 divide-y divide-gray-100">
        <Row label="Para">
          {recipient && (
            <img
              src={recipient.avatar}
              alt=""
              className="w-5 h-5 rounded-full object-cover"
            />
          )}
          <span className="truncate">{recipient ? recipient.name : 'Dirección'}</span>
        </Row>
        <Row label="Dirección">
          <span className="font-mono text-[12.5px] text-neutral-700">{address}</span>
        </Row>
        <Row label="Activo">
          <span
            className={`w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0 ${asset.badgeClass} ${asset.glyphClass ?? ''}`}
          >
            {asset.glyph}
          </span>
          <span>{asset.symbol}</span>
          <span className="text-[10.5px] font-semibold text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded-full">
            {asset.network}
          </span>
        </Row>
        <Row label="Red">{asset.networkLabel}</Row>
        <Row label="Comisión de red">{formatCurrency(asset.fee)}</Row>
        <Row label="Llegada">{asset.arrival}</Row>
      </div>

      {/* Total */}
      <div className="flex items-center justify-between px-1 mt-4">
        <span className="text-[14px] font-bold text-neutral-900">Total</span>
        <span className="text-[16px] font-extrabold text-neutral-900 tabular-nums">
          {formatCurrency(total)}
        </span>
      </div>
    </div>
  )
}
