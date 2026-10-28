import type { Screen } from '../navigation'
import AppScreen from './AppScreen'
import TabBar from './TabBar'
import WalletHeader from './WalletHeader'
import BalanceHero from './BalanceHero'
import ActionButtons from './ActionButtons'
import ReferralBanner from './ReferralBanner'
import QuickSend from './QuickSend'
import Transactions from './Transactions'

export default function HomeScreen({
  onNavigate,
  enterClass,
}: {
  onNavigate: (screen: Screen) => void
  enterClass?: string
}) {
  return (
    <AppScreen
      enterClass={enterClass}
      header={<WalletHeader />}
      dock={<TabBar active="home" onNavigate={onNavigate} />}
    >
      <BalanceHero />
      <ActionButtons />
      <ReferralBanner />
      <QuickSend />
      <Transactions />
    </AppScreen>
  )
}
