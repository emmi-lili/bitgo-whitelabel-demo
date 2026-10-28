import { useRef, useState } from 'react'
import type { SendAsset } from '../../data/send'
import QRCode from './QRCode'
import { CopyIcon } from './icons'
import { CheckIcon } from '../send/icons'

export default function ReceiveCard({ asset, address }: { asset: SendAsset; address: string }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address)
    } catch {
      /* clipboard unavailable — still show feedback for the mockup */
    }
    setCopied(true)
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <section className="bg-white rounded-3xl p-5 analytics-card border border-gray-100 flex flex-col items-center text-center">
      {/* QR */}
      <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
        <QRCode value={address} size={196} />
      </div>

      {/* Address */}
      <p className="text-[12.5px] text-neutral-400 font-medium mt-4">
        Tu dirección de {asset.symbol}
      </p>
      <p className="font-mono text-[13px] text-neutral-800 break-all leading-snug px-2 mt-1">
        {address}
      </p>

      {/* Copy */}
      <button
        type="button"
        onClick={copy}
        className="mt-4 inline-flex items-center gap-1.5 bg-neutral-900 text-white text-[13px] font-bold px-4 py-2.5 rounded-full active:scale-95 transition hover:bg-neutral-800"
      >
        {copied ? (
          <>
            <CheckIcon className="w-3.5 h-3.5" />
            ¡Copiado!
          </>
        ) : (
          <>
            <CopyIcon className="w-3.5 h-3.5" />
            Copiar dirección
          </>
        )}
      </button>

      {/* Network note */}
      <p className="text-[11.5px] text-neutral-400 mt-4 leading-snug">
        Envía solo <span className="font-semibold text-neutral-600">{asset.symbol}</span> en la red{' '}
        <span className="font-semibold text-neutral-600">{asset.network}</span> a esta dirección.
      </p>
    </section>
  )
}
