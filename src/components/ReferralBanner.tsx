import CryptoCoins from './CryptoCoins'
import { ChevronRightIcon } from './icons'

export default function ReferralBanner() {
  return (
    <section className="px-6 py-4">
      <div className="relative bg-[#0E0F12] text-white rounded-3xl p-5 overflow-hidden shadow-lg min-h-[148px] flex flex-col justify-between">
        {/* Text Content & CTA */}
        <div className="z-10 max-w-[58%]">
          <h2 className="text-[15px] font-bold leading-snug tracking-tight text-white mb-3">
            Invita a un amigo y gana $15 en cripto
          </h2>
          <button
            className="inline-flex items-center px-3.5 py-1.5 bg-white text-neutral-900 rounded-full text-[11px] font-bold hover:bg-neutral-100 active:scale-95 transition-all"
            type="button"
          >
            <span>Compartir invitación</span>
            <ChevronRightIcon className="w-3 h-3 ml-0.5 stroke-[2.5]" />
          </button>
        </div>
        {/* 3D Crypto Coins Mockup Graphic */}
        <CryptoCoins />
      </div>
    </section>
  )
}
