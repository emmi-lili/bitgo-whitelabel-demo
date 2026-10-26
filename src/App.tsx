import PhoneFrame from './components/PhoneFrame'
import WalletHeader from './components/WalletHeader'
import BalanceHero from './components/BalanceHero'
import ActionButtons from './components/ActionButtons'
import ReferralBanner from './components/ReferralBanner'
import QuickSend from './components/QuickSend'
import Transactions from './components/Transactions'
import BottomDock from './components/BottomDock'

export default function App() {
  return (
    <PhoneFrame dock={<BottomDock />}>
      <WalletHeader />
      <BalanceHero />
      <ActionButtons />
      <ReferralBanner />
      <QuickSend />
      <Transactions />
    </PhoneFrame>
  )
}
