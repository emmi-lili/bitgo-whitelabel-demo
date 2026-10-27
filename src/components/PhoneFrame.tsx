import type { ReactNode } from 'react'

interface PhoneFrameProps {
  /** Scrollable content (sections 2–7) */
  children: ReactNode
  /** Floating dock, rendered as a direct child of <main> */
  dock: ReactNode
  /** Enter-transition class applied to the frame */
  enterClass?: string
}

export default function PhoneFrame({ children, dock, enterClass = '' }: PhoneFrameProps) {
  return (
    <div className="bg-[#ECEEF2] text-[#121214] font-sans antialiased min-h-[100dvh] md:flex md:justify-center md:items-center md:py-6 select-none">
      {/* Device frame: full screen on mobile, framed phone on desktop */}
      <main
        className={`relative w-full h-[100dvh] md:w-[412px] md:h-[840px] md:max-h-[calc(100dvh_-_3rem)] bg-[#F7F8FA] overflow-hidden flex flex-col justify-between md:rounded-[48px] md:shadow-2xl md:border-[8px] md:border-[#1E2024] ${enterClass}`}
      >
        {/* Content Wrapper with Scroll */}
        <div className="flex-1 overflow-y-auto no-scrollbar app-scroll pb-32">{children}</div>
        {dock}
      </main>
    </div>
  )
}
