import type { Screen } from '../../navigation'
import PhoneShell from './PhoneShell'
import StatusBar from './StatusBar'
import AnalyticsNav from './AnalyticsNav'
import PortfolioCard from './PortfolioCard'
import AssetAllocation from './AssetAllocation'
import SpendingCategories from './SpendingCategories'
import BottomDock from './BottomDock'

export default function AnalyticsScreen({
  onNavigate,
  enterClass,
}: {
  onNavigate: (screen: Screen) => void
  enterClass?: string
}) {
  return (
    <PhoneShell enterClass={enterClass} dock={<BottomDock onNavigate={onNavigate} />}>
      <StatusBar />
      <AnalyticsNav onBack={() => onNavigate('home')} />
      <main className="px-4 space-y-3.5 mt-1">
        <PortfolioCard />
        <AssetAllocation />
        <SpendingCategories />
      </main>
    </PhoneShell>
  )
}
