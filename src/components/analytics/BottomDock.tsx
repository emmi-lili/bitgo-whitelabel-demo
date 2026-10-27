import { useState } from 'react'
import type { SVGProps } from 'react'
import type { Screen } from '../../navigation'
import { HomeIcon, WalletIcon, SparklesIcon, AnalyticsIcon, ProfileIcon } from './icons'

interface Tab {
  key: string
  label: string
  Icon: (props: SVGProps<SVGSVGElement>) => JSX.Element
  /** When set, selecting the tab navigates to this screen */
  screen?: Screen
}

const TABS: Tab[] = [
  { key: 'home', label: 'Home', Icon: HomeIcon, screen: 'home' },
  { key: 'wallet', label: 'Wallet', Icon: WalletIcon },
  { key: 'sparkles', label: 'Sparkles', Icon: SparklesIcon },
  { key: 'analytics', label: 'Analytics', Icon: AnalyticsIcon, screen: 'analytics' },
  { key: 'profile', label: 'Profile', Icon: ProfileIcon },
]

export default function BottomDock({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  const [active, setActive] = useState('analytics')

  return (
    <div className="absolute bottom-6 left-0 right-0 px-6 flex justify-center z-40">
      <nav
        aria-label="Bottom Dock"
        className="bg-black/90 backdrop-blur-md rounded-full px-5 py-3.5 flex items-center justify-between w-full max-w-[320px] shadow-2xl"
      >
        {TABS.map(({ key, label, Icon, screen }) => {
          const isActive = active === key
          return (
            <button
              key={key}
              aria-label={label}
              onClick={() => {
                setActive(key)
                if (screen) onNavigate(screen)
              }}
              className={`relative transition-colors ${isActive ? 'text-white' : 'text-neutral-400 hover:text-white'}`}
              type="button"
            >
              <Icon className="w-5 h-5" />
              {isActive && (
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
              )}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
