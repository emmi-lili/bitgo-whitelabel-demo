/**
 * Root header for the Analytics tab. Large left-aligned title matching the
 * weight/position of the Home header — no back button, because Analytics is a
 * top-level destination reached from the tab bar, not a pushed detail screen.
 */
export default function AnalyticsHeader() {
  return (
    <header className="px-6 pt-1 pb-2 flex items-center justify-between">
      <h1 className="text-[28px] font-bold tracking-tight text-neutral-900">Analytics</h1>
      {/* Context chip balances the row and tells the user the period in view */}
      <span className="text-[12px] font-semibold text-neutral-500 bg-white/70 border border-neutral-200/70 rounded-full px-3 py-1">
        Jun 2026
      </span>
    </header>
  )
}
