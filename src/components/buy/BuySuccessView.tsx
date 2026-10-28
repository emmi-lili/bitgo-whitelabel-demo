import { formatCurrency } from '../../data/mock'
import type { SendAsset } from '../../data/send'
import { CheckIcon } from '../send/icons'

export default function BuySuccessView({
  asset,
  amount,
  play,
}: {
  asset: SendAsset
  amount: number
  play: boolean
}) {
  const receive = (amount / asset.price).toLocaleString('en-US', { maximumFractionDigits: 6 })

  return (
    <div className="flex flex-col items-center text-center px-6 pt-20">
      <div
        className={`w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-6 ${play ? 'success-pop' : ''}`}
      >
        <div className="w-14 h-14 rounded-full bg-success flex items-center justify-center shadow-lg shadow-success/30">
          <CheckIcon className="w-7 h-7 text-white" />
        </div>
      </div>

      <h2 className="text-[24px] font-extrabold text-neutral-900 tracking-tight">¡Compra realizada!</h2>
      <p className="text-[14px] text-neutral-500 mt-2">
        Compraste{' '}
        <span className="font-bold text-neutral-900">
          {receive} {asset.symbol}
        </span>
      </p>
      <p className="text-[12.5px] text-neutral-400 mt-1.5">
        Pagaste {formatCurrency(amount)} · {asset.network}
      </p>
    </div>
  )
}
