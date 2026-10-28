import { transactions } from '../data/mock'
import TransactionItem from './TransactionItem'

export default function Transactions() {
  return (
    <section className="px-6 pt-3 pb-6">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[17px] font-bold text-[#141518] tracking-tight">Transacciones</h3>
        <button
          className="px-2.5 py-1 bg-[#ECEEF2] hover:bg-[#dfe2e7] text-neutral-700 text-[11px] font-bold rounded-full transition"
          type="button"
        >
          Ver todo
        </button>
      </div>
      {transactions.map((transaction) => (
        <TransactionItem key={transaction.id} transaction={transaction} />
      ))}
    </section>
  )
}
