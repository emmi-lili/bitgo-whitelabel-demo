import type { Transaction } from '../data/mock'
import { formatCurrency } from '../data/mock'
import { OutgoingArrowIcon, IncomingArrowIcon } from './icons'

export default function TransactionItem({ transaction }: { transaction: Transaction }) {
  const incoming = transaction.direction === 'in'

  return (
    <button
      type="button"
      className="w-full flex items-center justify-between py-2 px-2 -mx-2 rounded-2xl text-left hover:bg-black/[0.03] active:scale-[0.99] transition"
    >
      {/* Icon & Info */}
      <div className="flex items-center space-x-3.5">
        <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-sm border border-neutral-100">
          {incoming ? (
            <IncomingArrowIcon className="w-4 h-4 text-success stroke-[2.5]" />
          ) : (
            <OutgoingArrowIcon className="w-4 h-4 text-neutral-900 stroke-[2.5]" />
          )}
        </div>
        <div>
          <h4 className="text-[14px] font-bold text-neutral-900 tracking-tight leading-tight">
            {transaction.title}
          </h4>
          <p className="text-[12px] font-medium text-neutral-500 mt-0.5">{transaction.date}</p>
        </div>
      </div>

      {/* Amount */}
      <div className="text-right">
        <span
          className={`text-[15px] font-bold tracking-tight ${incoming ? 'text-success' : 'text-neutral-900'}`}
        >
          {incoming ? '+' : '-'}
          {formatCurrency(transaction.amount)}
        </span>
      </div>
    </button>
  )
}
