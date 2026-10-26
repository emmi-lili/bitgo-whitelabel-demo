import type { ReactNode } from 'react'

interface PhoneFrameProps {
  /** Scrollable content (sections 2–7) */
  children: ReactNode
  /** Floating dock, rendered as a direct child of <main> */
  dock: ReactNode
}

export default function PhoneFrame({ children, dock }: PhoneFrameProps) {
  return (
    <div className="bg-[#ECEEF2] text-[#121214] font-sans antialiased flex justify-center items-start min-h-screen sm:py-8 select-none">
      <main className="w-full max-w-[412px] bg-[#F7F8FA] min-h-screen sm:min-h-[890px] sm:rounded-[48px] sm:shadow-2xl overflow-hidden relative flex flex-col justify-between border-0 sm:border-[8px] sm:border-[#1E2024]">
        {/* Content Wrapper with Scroll */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-32">{children}</div>
        {dock}
      </main>
    </div>
  )
}
