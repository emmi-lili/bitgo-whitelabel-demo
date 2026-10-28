import { useState } from 'react'
import type { ReactNode, UIEvent } from 'react'
import StatusBar from './StatusBar'

interface AppScreenProps {
  /** Sticky header content rendered below the status bar */
  header: ReactNode
  /** Scrollable screen body */
  children: ReactNode
  /** Floating tab bar */
  dock: ReactNode
  /** Enter-transition class applied to the frame */
  enterClass?: string
}

/**
 * The single device shell shared by every screen: responsive phone frame,
 * a status bar + sticky header that blurs on scroll, momentum scrolling,
 * a bottom fade scrim, the floating tab bar, and the home indicator.
 */
export default function AppScreen({ header, children, dock, enterClass = '' }: AppScreenProps) {
  const [scrolled, setScrolled] = useState(false)

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const next = e.currentTarget.scrollTop > 6
    setScrolled((prev) => (prev === next ? prev : next))
  }

  return (
    <div className="app-page-bg font-sans antialiased text-[#121214] min-h-[100dvh] md:flex md:justify-center md:items-center md:py-6 select-none">
      {/* Device frame: full screen on mobile, framed phone on desktop */}
      <div
        className={`relative w-full h-[100dvh] md:w-[400px] md:h-[840px] md:max-h-[calc(100dvh_-_3rem)] bg-[#F4F5F8] overflow-hidden flex flex-col md:rounded-[48px] md:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] md:border-[8px] md:border-[#1E1E1E] ${enterClass}`}
      >
        {/* Ambient glow */}
        <div className="absolute -top-24 -left-20 w-72 h-72 bg-purple-200/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-24 -right-20 w-72 h-72 bg-fuchsia-100/50 rounded-full blur-3xl pointer-events-none" />

        {/* Scroll area */}
        <div
          onScroll={handleScroll}
          className="relative flex-1 overflow-y-auto no-scrollbar app-scroll z-10 pb-28"
        >
          {/* Status bar + header, sticky, frosts once content scrolls under it */}
          <div
            className={`sticky top-0 z-30 transition-colors duration-300 ${
              scrolled ? 'bg-[#F4F5F8]/80 backdrop-blur-md shadow-[0_1px_0_rgba(0,0,0,0.05)]' : ''
            }`}
          >
            <StatusBar />
            {header}
          </div>

          {children}
        </div>

        {/* Bottom fade so content dissolves into the floating dock instead of clipping */}
        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-[#F4F5F8] via-[#F4F5F8]/70 to-transparent pointer-events-none z-20" />

        {dock}

        {/* Home indicator */}
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-neutral-400/70 rounded-full z-50 pointer-events-none" />
      </div>
    </div>
  )
}
