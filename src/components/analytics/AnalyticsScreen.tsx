import type { Screen } from '../../navigation'
import AppScreen from '../AppScreen'
import TabBar from '../TabBar'
import AnalyticsHeader from './AnalyticsHeader'
import PortfolioCard from './PortfolioCard'
import AssetAllocation from './AssetAllocation'
import SpendingCategories from './SpendingCategories'

export default function AnalyticsScreen({
  onNavigate,
  enterClass,
}: {
  onNavigate: (screen: Screen) => void
  enterClass?: string
}) {
  return (
    <AppScreen
      enterClass={enterClass}
      header={<AnalyticsHeader />}
      dock={<TabBar active="analytics" onNavigate={onNavigate} />}
    >
      <main className="px-4 space-y-3.5 mt-1">
        <PortfolioCard />
        <AssetAllocation />
        <SpendingCategories />
      </main>
    </AppScreen>
  )
}
