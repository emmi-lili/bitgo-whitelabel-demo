import { useState } from 'react'
import { assets, recipients, truncateAddress } from '../../data/send'
import type { SendAsset, Recipient } from '../../data/send'
import Panel from '../Panel'
import SendNav from './SendNav'
import PrimaryButton from './PrimaryButton'
import AssetSelector from './AssetSelector'
import RecipientCard from './RecipientCard'
import AmountCard from './AmountCard'
import NetworkCard from './NetworkCard'
import ReviewSummary from './ReviewSummary'
import SuccessView from './SuccessView'
import { ArrowRightIcon } from './icons'

type Step = 'form' | 'review' | 'success'
const STEPS: Step[] = ['form', 'review', 'success']

export default function SendScreen({ onClose }: { onClose: () => void }) {
  const [asset, setAsset] = useState<SendAsset>(assets[0])
  const [recipient, setRecipient] = useState<Recipient | null>(recipients[0])
  const [address, setAddress] = useState(truncateAddress(recipients[0].address))
  const [amountStr, setAmountStr] = useState('')
  const [step, setStep] = useState<Step>('form')
  const [sending, setSending] = useState(false)

  const amount = parseFloat(amountStr) || 0
  const index = STEPS.indexOf(step)

  const pickRecipient = (r: Recipient) => {
    setRecipient(r)
    setAddress(truncateAddress(r.address))
  }
  const changeAddress = (v: string) => {
    setAddress(v)
    setRecipient(null)
  }

  const confirm = () => {
    if (sending) return
    setSending(true)
    window.setTimeout(() => {
      setSending(false)
      setStep('success')
    }, 1300)
  }

  const done = () => {
    onClose()
    // Reset after the overlay has slid away, so it reopens on a fresh form.
    window.setTimeout(() => {
      setStep('form')
      setAmountStr('')
      setSending(false)
    }, 500)
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div
        className="flex h-full w-[300%] ease-[var(--screen-ease)]"
        style={{
          transform: `translateX(-${index * (100 / 3)}%)`,
          transitionProperty: 'transform',
          transitionDuration: 'var(--screen-dur)',
        }}
      >
        {/* Step 1 — Form */}
        <div className="w-1/3 h-full">
          <Panel
            header={<SendNav title="Send Money" onBack={onClose} showScan />}
            footer={
              <PrimaryButton onClick={() => setStep('review')} disabled={amount <= 0}>
                Review Transfer
                <ArrowRightIcon className="w-4 h-4 -mr-1" />
              </PrimaryButton>
            }
          >
            <div className="px-5 space-y-4 pt-2">
              <AssetSelector asset={asset} onSelect={setAsset} />
              <RecipientCard
                recipient={recipient}
                address={address}
                onSelect={pickRecipient}
                onAddressChange={changeAddress}
              />
              <AmountCard asset={asset} value={amountStr} onChange={setAmountStr} />
              <NetworkCard asset={asset} />
            </div>
          </Panel>
        </div>

        {/* Step 2 — Review */}
        <div className="w-1/3 h-full">
          <Panel
            header={<SendNav title="Review Transfer" onBack={() => setStep('form')} />}
            footer={
              <PrimaryButton onClick={confirm} loading={sending}>
                {sending ? 'Sending…' : 'Confirm & Send'}
              </PrimaryButton>
            }
          >
            <ReviewSummary asset={asset} amount={amount} recipient={recipient} address={address} />
          </Panel>
        </div>

        {/* Step 3 — Success */}
        <div className="w-1/3 h-full">
          <Panel header={<div className="pt-2" />} footer={<PrimaryButton onClick={done}>Done</PrimaryButton>}>
            <SuccessView asset={asset} amount={amount} recipient={recipient} play={step === 'success'} />
          </Panel>
        </div>
      </div>
    </div>
  )
}
