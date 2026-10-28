import { useRef, useState } from 'react'
import type { SVGProps } from 'react'
import type { Screen } from '../navigation'
import { HomeIcon, WalletIcon, RewardsIcon, AnalyticsIcon, ProfileIcon } from './icons'

interface Tab {
  key: string
  label: string
  Icon: (props: SVGProps<SVGSVGElement>) => JSX.Element
  iconClass: string
  /** When set, selecting the tab navigates to this screen. Otherwise it's not built yet. */
  screen?: Screen
}

const TABS: Tab[] = [
  { key: 'home', label: 'Home', Icon: HomeIcon, iconClass: 'w-5 h-5 fill-current', screen: 'home' },
  { key: 'wallet', label: 'Wallet', Icon: WalletIcon, iconClass: 'w-5 h-5 stroke-[2] fill-none' },
  { key: 'rewards', label: 'Rewards', Icon: RewardsIcon, iconClass: 'w-5 h-5 fill-current' },
  {
    key: 'analytics',
    label: 'Analytics',
    Icon: AnalyticsIcon,
    iconClass: 'w-5 h-5 stroke-[2] fill-none',
    screen: 'analytics',
  },
  { key: 'profile', label: 'Profile', Icon: ProfileIcon, iconClass: 'w-5 h-5 fill-current' },
]

export default function TabBar({
  active,
  onNavigate,
}: {
  active: Screen
  onNavigate: (screen: Screen) => void
}) {
  const [toast, setToast] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  const handle = (tab: Tab) => {
    if (tab.screen) {
      onNavigate(tab.screen)
      return
    }
    // Honest feedback for destinations that don't exist yet.
    setToast(true)
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setToast(false), 1600)
  }

  return (
    <nav aria-label="Primary" className="absolute bottom-5 inset-x-4 z-40">
      {toast && (
        <div
          role="status"
          className="absolute -top-11 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-[12px] font-semibold px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap"
        >
          Coming soon
        </div>
      )}
      <div className="h-[62px] bg-[#E9ECF1]/90 backdrop-blur-md rounded-full px-3 dock-shadow flex items-center justify-between border border-white/60">
        {TABS.map((tab) => {
          const isActive = tab.screen === active
          if (isActive) {
            return (
              <button
                key={tab.key}
                aria-label={tab.label}
                aria-current="page"
                className="w-11 h-11 bg-[#121316] text-white rounded-full flex items-center justify-center shadow-md active:scale-95 transition"
                type="button"
              >
                <tab.Icon className={tab.iconClass} />
              </button>
            )
          }
          const built = Boolean(tab.screen)
          return (
            <button
              key={tab.key}
              aria-label={built ? tab.label : `${tab.label} (coming soon)`}
              onClick={() => handle(tab)}
              className={`w-11 h-11 flex items-center justify-center rounded-full transition active:scale-90 ${
                built ? 'text-neutral-500 hover:text-neutral-900' : 'text-neutral-400 opacity-50 hover:opacity-70'
              }`}
              type="button"
            >
              <tab.Icon className={tab.iconClass} />
            </button>
          )
        })}
      </div>
    </nav>
  )
}
