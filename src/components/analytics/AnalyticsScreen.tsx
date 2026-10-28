import Panel from '../Panel'
import AnalyticsHeader from './AnalyticsHeader'
import PortfolioCard from './PortfolioCard'
import AssetAllocation from './AssetAllocation'
import SpendingCategories from './SpendingCategories'

export default function AnalyticsScreen() {
  return (
    <Panel header={<AnalyticsHeader />}>
      <main className="px-4 space-y-3.5 mt-1">
        <PortfolioCard />
        <AssetAllocation />
        <SpendingCategories />
      </main>
    </Panel>
  )
}
