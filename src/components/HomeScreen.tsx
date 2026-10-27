import type { Screen } from '../navigation'
import PhoneFrame from './PhoneFrame'
import WalletHeader from './WalletHeader'
import BalanceHero from './BalanceHero'
import ActionButtons from './ActionButtons'
import ReferralBanner from './ReferralBanner'
import QuickSend from './QuickSend'
import Transactions from './Transactions'
import BottomDock from './BottomDock'

export default function HomeScreen({
  onNavigate,
  enterClass,
}: {
  onNavigate: (screen: Screen) => void
  enterClass?: string
}) {
  return (
    <PhoneFrame enterClass={enterClass} dock={<BottomDock onNavigate={onNavigate} />}>
      <WalletHeader />
      <BalanceHero />
      <ActionButtons />
      <ReferralBanner />
      <QuickSend />
      <Transactions />
    </PhoneFrame>
  )
}
