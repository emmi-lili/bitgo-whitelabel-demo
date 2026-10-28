import Panel from './Panel'
import WalletHeader from './WalletHeader'
import BalanceHero from './BalanceHero'
import ActionButtons from './ActionButtons'
import ReferralBanner from './ReferralBanner'
import QuickSend from './QuickSend'
import Transactions from './Transactions'

export default function HomeScreen({
  onSend,
  onReceive,
  onBuy,
}: {
  onSend: () => void
  onReceive: () => void
  onBuy: () => void
}) {
  return (
    <Panel header={<WalletHeader />}>
      <BalanceHero />
      <ActionButtons onSend={onSend} onReceive={onReceive} onBuy={onBuy} />
      <ReferralBanner />
      <QuickSend />
      <Transactions />
    </Panel>
  )
}
