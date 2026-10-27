import { BackIcon } from './icons'

export default function AnalyticsNav({ onBack }: { onBack: () => void }) {
  return (
    <nav
      aria-label="Main Navigation"
      className="px-5 pt-3 pb-3 flex items-center justify-between relative"
    >
      {/* Back Button */}
      <button
        aria-label="Go back"
        onClick={onBack}
        className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-sm text-neutral-800 active:scale-95 transition-transform hover:bg-neutral-50"
        type="button"
      >
        <BackIcon className="w-5 h-5 -ml-0.5" />
      </button>

      {/* Screen Title */}
      <h1 className="text-[23px] font-semibold tracking-tight text-neutral-900 absolute left-1/2 -translate-x-1/2">
        Analytics
      </h1>

      {/* Spacer to balance the back button */}
      <div className="w-11 h-11 invisible" />
    </nav>
  )
}
