import type { Transaction } from '../data/mock'
import { formatCurrency } from '../data/mock'
import { OutgoingArrowIcon } from './icons'

export default function TransactionItem({ transaction }: { transaction: Transaction }) {
  return (
    <div className="flex items-center justify-between py-2">
      {/* Icon & Info */}
      <div className="flex items-center space-x-3.5">
        {/* Outgoing Arrow Icon Pill */}
        <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-sm border border-neutral-100">
          <OutgoingArrowIcon className="w-4 h-4 text-neutral-900 stroke-[2.5]" />
        </div>
        <div>
          <h4 className="text-[14px] font-bold text-neutral-900 tracking-tight leading-tight">
            {transaction.title}
          </h4>
          <p className="text-[12px] font-medium text-neutral-400 mt-0.5">{transaction.date}</p>
        </div>
      </div>
      {/* Transaction Amount */}
      <div className="text-right">
        <span className="text-[15px] font-bold text-neutral-900 tracking-tight">
          {formatCurrency(transaction.amount)}
        </span>
      </div>
    </div>
  )
}
