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
  { key: 'home', label: 'Inicio', Icon: HomeIcon, iconClass: 'w-5 h-5 fill-current', screen: 'home' },
  { key: 'wallet', label: 'Cartera', Icon: WalletIcon, iconClass: 'w-5 h-5 stroke-[2] fill-none' },
  { key: 'rewards', label: 'Recompensas', Icon: RewardsIcon, iconClass: 'w-5 h-5 fill-current' },
  {
    key: 'analytics',
    label: 'Analíticas',
    Icon: AnalyticsIcon,
    iconClass: 'w-5 h-5 stroke-[2] fill-none',
    screen: 'analytics',
  },
  { key: 'profile', label: 'Perfil', Icon: ProfileIcon, iconClass: 'w-5 h-5 fill-current' },
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

  const activeIndex = Math.max(
    0,
    TABS.findIndex((t) => t.screen === active),
  )

  const handle = (tab: Tab) => {
    if (tab.screen) {
      onNavigate(tab.screen)
      return
    }
    setToast(true)
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setToast(false), 1600)
  }

  return (
    <nav aria-label="Navegación principal" className="absolute bottom-5 inset-x-4 z-40">
      {toast && (
        <div
          role="status"
          className="absolute -top-11 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-[12px] font-semibold px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap"
        >
          Próximamente
        </div>
      )}
      <div className="relative h-[62px] bg-[#E9ECF1]/90 backdrop-blur-md rounded-full dock-shadow border border-white/60 flex">
        {/* Sliding active indicator */}
        <div
          className="absolute inset-y-0 w-1/5 flex items-center justify-center pointer-events-none ease-[var(--screen-ease)]"
          style={{
            transform: `translateX(${activeIndex * 100}%)`,
            transitionProperty: 'transform',
            transitionDuration: '350ms',
          }}
        >
          <span className="w-11 h-11 bg-[#121316] rounded-full shadow-md" />
        </div>

        {TABS.map((tab) => {
          const isActive = tab.screen === active
          const built = Boolean(tab.screen)
          return (
            <button
              key={tab.key}
              aria-label={built ? tab.label : `${tab.label} (próximamente)`}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => handle(tab)}
              className={`relative z-10 flex-1 flex items-center justify-center transition-colors duration-200 active:scale-90 ${
                isActive
                  ? 'text-white'
                  : built
                    ? 'text-neutral-500 hover:text-neutral-900'
                    : 'text-neutral-400 opacity-50 hover:opacity-70'
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
