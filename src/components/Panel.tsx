import { useState } from 'react'
import type { ReactNode, UIEvent } from 'react'
import StatusBar from './StatusBar'

interface PanelProps {
  /** Sticky header content rendered below the status bar */
  header: ReactNode
  /** Scrollable body */
  children: ReactNode
  /** Optional pinned footer (e.g. a primary CTA) */
  footer?: ReactNode
}

/**
 * One screen's content surface: a status bar + sticky header that frosts on
 * scroll, a momentum scroll area, and a bottom fade. Transparent so the shared
 * frame background / ambient glow shows through. The device frame, tab bar and
 * home indicator live once in AppShell — not here — so navigation never
 * remounts chrome.
 */
export default function Panel({ header, children, footer }: PanelProps) {
  const [scrolled, setScrolled] = useState(false)

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const next = e.currentTarget.scrollTop > 6
    setScrolled((prev) => (prev === next ? prev : next))
  }

  return (
    <div className="relative w-full h-full flex flex-col">
      <div
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto no-scrollbar app-scroll pb-28"
      >
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

      {/* Bottom fade so content dissolves into the dock / footer */}
      <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-[#F4F5F8] via-[#F4F5F8]/70 to-transparent pointer-events-none z-20" />

      {footer}
    </div>
  )
}
