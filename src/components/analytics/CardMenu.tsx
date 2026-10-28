import { useEffect, useRef, useState } from 'react'
import { EllipsisIcon } from './icons'

export interface MenuOption {
  label: string
  onSelect: () => void
  /** Renders a check and highlights the row */
  active?: boolean
}

/** A "⋮" button that opens a dropdown of options, closing on outside click. */
export default function CardMenu({ options }: { options: MenuOption[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        aria-label="Más opciones"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`p-2 -m-2 rounded-full transition-colors active:scale-95 ${open ? 'text-neutral-800 bg-neutral-100' : 'text-neutral-400 hover:text-neutral-700'}`}
        type="button"
      >
        <EllipsisIcon className="w-5 h-5" />
      </button>

      {open && (
        <div className="absolute right-0 top-7 z-50 w-44 bg-white rounded-2xl shadow-xl border border-neutral-100 p-1.5 origin-top-right">
          {options.map((opt) => (
            <button
              key={opt.label}
              onClick={() => {
                opt.onSelect()
                setOpen(false)
              }}
              className={`w-full text-left px-3 py-2 rounded-xl text-[13px] font-medium transition-colors flex items-center justify-between ${
                opt.active ? 'text-neutral-900 bg-neutral-100' : 'text-neutral-600 hover:bg-neutral-50'
              }`}
              type="button"
            >
              <span>{opt.label}</span>
              {opt.active && <span className="text-[12px] text-success">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
