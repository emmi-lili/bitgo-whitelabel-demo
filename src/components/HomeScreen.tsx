import Panel from './Panel'
import WalletHeader from './WalletHeader'
import BalanceHero from './BalanceHero'
import ActionButtons from './ActionButtons'
import ReferralBanner from './ReferralBanner'
import QuickSend from './QuickSend'
import Transactions from './Transactions'

export default function HomeScreen({ onSend }: { onSend: () => void }) {
  return (
    <Panel header={<WalletHeader />}>
      <BalanceHero />
      <ActionButtons onSend={onSend} />
      <ReferralBanner />
      <QuickSend />
      <Transactions />
    </Panel>
  )
}
