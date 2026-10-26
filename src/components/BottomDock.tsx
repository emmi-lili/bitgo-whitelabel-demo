import { useState } from 'react'
import type { SVGProps } from 'react'
import { HomeIcon, VaultIcon, RewardsIcon, AnalyticsIcon, ProfileIcon } from './icons'

interface Tab {
  key: string
  label: string
  Icon: (props: SVGProps<SVGSVGElement>) => JSX.Element
  /** Extra classes applied to the icon (stroke/fill specifics) */
  iconClass: string
}

const TABS: Tab[] = [
  { key: 'home', label: 'Home', Icon: HomeIcon, iconClass: 'w-5 h-5 fill-current' },
  { key: 'vault', label: 'Vault', Icon: VaultIcon, iconClass: 'w-5 h-5 stroke-[2] fill-none' },
  { key: 'rewards', label: 'Rewards', Icon: RewardsIcon, iconClass: 'w-5 h-5 fill-current' },
  { key: 'analytics', label: 'Analytics', Icon: AnalyticsIcon, iconClass: 'w-5 h-5 stroke-[2] fill-none' },
  { key: 'profile', label: 'Profile', Icon: ProfileIcon, iconClass: 'w-5 h-5 fill-current' },
]

export default function BottomDock() {
  const [active, setActive] = useState('home')

  return (
    <nav className="absolute bottom-5 inset-x-5 z-30">
      <div className="h-[62px] bg-[#E9ECF1]/90 backdrop-blur-md rounded-full px-3 dock-shadow flex items-center justify-between border border-white/60">
        {TABS.map(({ key, label, Icon, iconClass }) =>
          active === key ? (
            <button
              key={key}
              aria-label={label}
              onClick={() => setActive(key)}
              className="w-11 h-11 bg-[#121316] text-white rounded-full flex items-center justify-center shadow-md active:scale-95 transition"
              type="button"
            >
              <Icon className={iconClass} />
            </button>
          ) : (
            <button
              key={key}
              aria-label={label}
              onClick={() => setActive(key)}
              className="p-2.5 text-neutral-500 hover:text-neutral-900 transition active:scale-95"
              type="button"
            >
              <Icon className={iconClass} />
            </button>
          ),
        )}
      </div>
    </nav>
  )
}
