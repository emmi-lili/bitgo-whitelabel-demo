import { EthIcon } from './icons'

export default function CryptoCoins() {
  return (
    <div
      aria-hidden="true"
      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-[145px] h-[130px] pointer-events-none"
    >
      {/* Sparkles */}
      <span className="absolute top-2 left-6 text-white text-xs opacity-75 animate-pulse">✦</span>
      <span className="absolute bottom-4 left-3 text-white text-xs opacity-80 animate-pulse">✦</span>
      <span className="absolute top-1/2 right-1 text-white text-[10px] opacity-70">✦</span>

      {/* Top Left: Ethereum */}
      <div className="crypto-coin absolute top-1 left-2 w-14 h-14 rounded-full bg-gradient-to-br from-neutral-200 via-neutral-400 to-neutral-700 flex items-center justify-center transform -rotate-12 border border-neutral-300">
        <EthIcon className="w-6 h-6 text-neutral-900 drop-shadow" />
      </div>

      {/* Top Right: Litecoin */}
      <div className="crypto-coin absolute top-2 right-1 w-[52px] h-[52px] rounded-full bg-gradient-to-br from-neutral-100 via-neutral-300 to-neutral-600 flex items-center justify-center transform rotate-6 border border-neutral-200">
        <span className="text-neutral-800 font-extrabold text-base italic drop-shadow">Ł</span>
      </div>

      {/* Bottom Center: Bitcoin */}
      <div className="crypto-coin absolute bottom-1 right-5 w-16 h-16 rounded-full bg-gradient-to-br from-neutral-200 via-neutral-400 to-neutral-800 flex items-center justify-center border border-neutral-300 z-10">
        <span className="text-neutral-900 font-extrabold text-xl tracking-tighter drop-shadow">₿</span>
      </div>
    </div>
  )
}
