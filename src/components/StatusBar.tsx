/** iOS-style status bar shown at the top of every screen. */
export default function StatusBar() {
  return (
    <div className="pt-3 pb-1 px-7 flex items-center justify-between text-black select-none">
      {/* Time */}
      <span className="text-[15px] font-semibold tracking-tight">9:41</span>

      {/* Dynamic Island */}
      <div className="absolute left-1/2 -translate-x-1/2 top-2 w-[114px] h-[30px] bg-black rounded-full flex items-center justify-end px-3">
        <div className="w-2.5 h-2.5 rounded-full bg-[#0a0a0a] border border-neutral-800" />
      </div>

      {/* Signal / Wifi / Battery */}
      <div className="flex items-center space-x-1.5 pt-0.5">
        {/* Cellular */}
        <svg className="w-4 h-3.5" fill="currentColor" viewBox="0 0 17 12">
          <rect height="3.5" rx="0.5" width="2.5" x="0.5" y="8.5" />
          <rect height="6" rx="0.5" width="2.5" x="4.5" y="6" />
          <rect height="8.5" rx="0.5" width="2.5" x="8.5" y="3.5" />
          <rect height="11.5" rx="0.5" width="2.5" x="12.5" y="0.5" />
        </svg>
        {/* Wifi */}
        <svg className="w-4 h-3.5" fill="currentColor" viewBox="0 0 16 12">
          <path d="M8 2.5C10.6 2.5 13 3.6 14.7 5.3L16 3.9C13.9 1.8 11.1 0.5 8 0.5C4.9 0.5 2.1 1.8 0 3.9L1.3 5.3C3 3.6 5.4 2.5 8 2.5ZM8 6.5C9.6 6.5 11 7.2 12.1 8.3L13.4 6.9C11.9 5.4 9.9 4.5 8 4.5C6.1 4.5 4.1 5.4 2.6 6.9L3.9 8.3C5 7.2 6.4 6.5 8 6.5ZM8 10.5C8.8 10.5 9.5 11.2 9.5 12H6.5C6.5 11.2 7.2 10.5 8 10.5Z" />
        </svg>
        {/* Battery */}
        <div className="flex items-center">
          <div className="w-5 h-2.5 border-[1.5px] border-black rounded-[4px] p-[1px] flex items-center">
            <div className="h-full w-3 bg-black rounded-[1.5px]" />
          </div>
          <div className="w-[1.5px] h-1 bg-black rounded-r-[1px] -ml-[0.5px]" />
        </div>
      </div>
    </div>
  )
}
