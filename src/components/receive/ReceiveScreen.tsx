import { useRef, useState } from 'react'
import { assets, receiveAddress } from '../../data/send'
import type { SendAsset } from '../../data/send'
import Panel from '../Panel'
import SendNav from '../send/SendNav'
import PrimaryButton from '../send/PrimaryButton'
import AssetSelector from '../send/AssetSelector'
import ReceiveCard from './ReceiveCard'

export default function ReceiveScreen({ onClose }: { onClose: () => void }) {
  const [asset, setAsset] = useState<SendAsset>(assets[0])
  const [toast, setToast] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  const address = receiveAddress(asset)

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: `Mi dirección ${asset.symbol}`, text: address })
        return
      }
    } catch {
      return // user cancelled the share sheet
    }
    // Fallback: copy + toast
    try {
      await navigator.clipboard.writeText(address)
    } catch {
      /* ignore */
    }
    setToast(true)
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setToast(false), 1600)
  }

  return (
    <Panel
      header={<SendNav title="Recibir" onBack={onClose} />}
      footer={
        <>
          {toast && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50 bg-neutral-900 text-white text-[12px] font-semibold px-3 py-1.5 rounded-full shadow-lg">
              Dirección copiada
            </div>
          )}
          <PrimaryButton onClick={share}>Compartir dirección</PrimaryButton>
        </>
      }
    >
      <div className="px-5 space-y-4 pt-2">
        <AssetSelector asset={asset} onSelect={setAsset} />
        <ReceiveCard asset={asset} address={address} />
      </div>
    </Panel>
  )
}
