import { SendIcon, ReceiveIcon, BuyIcon } from './icons'

export default function ActionButtons({ onSend }: { onSend: () => void }) {
  return (
    <section className="px-6 py-2">
      <div className="grid grid-cols-3 gap-2.5">
        {/* Send (Primary) */}
        <button
          onClick={onSend}
          className="h-12 bg-[#121316] text-white rounded-full flex items-center justify-center space-x-2 shadow-sm hover:bg-neutral-800 active:scale-95 transition-all"
          type="button"
        >
          <SendIcon className="w-4 h-4 fill-current transform -rotate-45 -mt-0.5" />
          <span className="text-[14px] font-semibold tracking-tight">Send</span>
        </button>
        {/* Receive */}
        <button
          className="h-12 bg-[#E9ECF1] text-[#1B1E22] rounded-full flex items-center justify-center space-x-1.5 hover:bg-[#dfe3e9] active:scale-95 transition-all"
          type="button"
        >
          <ReceiveIcon className="w-4 h-4 stroke-[2.2] text-[#1B1E22]" />
          <span className="text-[14px] font-semibold tracking-tight">Receive</span>
        </button>
        {/* Buy */}
        <button
          className="h-12 bg-[#E9ECF1] text-[#1B1E22] rounded-full flex items-center justify-center space-x-1.5 hover:bg-[#dfe3e9] active:scale-95 transition-all"
          type="button"
        >
          <BuyIcon className="w-4 h-4 fill-current text-[#1B1E22]" />
          <span className="text-[14px] font-semibold tracking-tight">Buy</span>
        </button>
      </div>
    </section>
  )
}
