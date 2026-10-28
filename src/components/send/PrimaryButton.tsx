import type { ReactNode } from 'react'

export default function PrimaryButton({
  onClick,
  children,
  disabled = false,
  loading = false,
}: {
  onClick: () => void
  children: ReactNode
  disabled?: boolean
  loading?: boolean
}) {
  return (
    <div className="absolute bottom-7 inset-x-5 z-40">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || loading}
        className="w-full py-4 rounded-full bg-[#121316] text-white font-bold text-[16px] tracking-tight flex items-center justify-center gap-2 shadow-lg shadow-neutral-900/15 hover:bg-neutral-800 active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none"
      >
        {loading && (
          <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        )}
        {children}
      </button>
    </div>
  )
}
