import { BackIcon, QrIcon } from './icons'

export default function SendNav({
  title,
  onBack,
  showScan = false,
}: {
  title: string
  onBack: () => void
  showScan?: boolean
}) {
  return (
    <nav aria-label="Top Bar" className="flex items-center justify-between px-5 py-3">
      <button
        aria-label="Go back"
        onClick={onBack}
        className="w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 hover:bg-neutral-100 transition-colors active:scale-95"
        type="button"
      >
        <BackIcon className="w-5 h-5 text-neutral-800" />
      </button>

      <h1 className="text-[19px] font-bold text-neutral-900 tracking-tight">{title}</h1>

      {showScan ? (
        <button
          aria-label="Scan QR code"
          className="w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 hover:bg-neutral-100 transition-colors active:scale-95"
          type="button"
        >
          <QrIcon className="w-5 h-5 text-neutral-800" />
        </button>
      ) : (
        <div className="w-11 h-11" />
      )}
    </nav>
  )
}
