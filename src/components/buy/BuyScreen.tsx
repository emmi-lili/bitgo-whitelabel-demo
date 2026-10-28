import { useState } from 'react'
import { assets } from '../../data/send'
import type { SendAsset } from '../../data/send'
import { balance } from '../../data/mock'
import Panel from '../Panel'
import SendNav from '../send/SendNav'
import PrimaryButton from '../send/PrimaryButton'
import AssetSelector from '../send/AssetSelector'
import BuyAmountCard from './BuyAmountCard'
import BuySuccessView from './BuySuccessView'

type Step = 'form' | 'success'
const STEPS: Step[] = ['form', 'success']

export default function BuyScreen({ onClose }: { onClose: () => void }) {
  const [asset, setAsset] = useState<SendAsset>(assets[0])
  const [amountStr, setAmountStr] = useState('')
  const [step, setStep] = useState<Step>('form')
  const [processing, setProcessing] = useState(false)

  const amount = parseFloat(amountStr) || 0
  const insufficient = amount > balance
  const canBuy = amount > 0 && !insufficient
  const index = STEPS.indexOf(step)

  const confirm = () => {
    if (processing || !canBuy) return
    setProcessing(true)
    window.setTimeout(() => {
      setProcessing(false)
      setStep('success')
    }, 1300)
  }

  const done = () => {
    onClose()
    window.setTimeout(() => {
      setStep('form')
      setAmountStr('')
      setProcessing(false)
    }, 500)
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div
        className="flex h-full w-[200%] ease-[var(--screen-ease)]"
        style={{
          transform: `translateX(-${index * 50}%)`,
          transitionProperty: 'transform',
          transitionDuration: 'var(--screen-dur)',
        }}
      >
        {/* Step 1 — Form */}
        <div className="w-1/2 h-full">
          <Panel
            header={<SendNav title="Comprar" onBack={onClose} />}
            footer={
              <PrimaryButton onClick={confirm} disabled={!canBuy} loading={processing}>
                {processing ? 'Procesando…' : 'Comprar'}
              </PrimaryButton>
            }
          >
            <div className="px-5 space-y-4 pt-2">
              <AssetSelector asset={asset} onSelect={setAsset} />
              <BuyAmountCard
                asset={asset}
                value={amountStr}
                onChange={setAmountStr}
                cashBalance={balance}
                insufficient={insufficient}
              />
            </div>
          </Panel>
        </div>

        {/* Step 2 — Success */}
        <div className="w-1/2 h-full">
          <Panel header={<div className="pt-2" />} footer={<PrimaryButton onClick={done}>Listo</PrimaryButton>}>
            <BuySuccessView asset={asset} amount={amount} play={step === 'success'} />
          </Panel>
        </div>
      </div>
    </div>
  )
}
