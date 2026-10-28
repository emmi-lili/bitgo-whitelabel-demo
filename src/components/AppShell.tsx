import { useState } from 'react'
import type { Screen } from '../navigation'
import TabBar from './TabBar'
import HomeScreen from './HomeScreen'
import AnalyticsScreen from './analytics/AnalyticsScreen'
import SendScreen from './send/SendScreen'
import ReceiveScreen from './receive/ReceiveScreen'
import BuyScreen from './buy/BuyScreen'

/** Horizontal position of each tab panel on the shared track. */
const TRACK_INDEX = { home: 0, analytics: 1 } as const
type Tab = keyof typeof TRACK_INDEX

/**
 * The whole app is one surface. A single device frame holds a persistent
 * status bar/tab bar/home indicator; Home and Analytics are always mounted
 * side-by-side on one track that slides via transform; Send slides in over
 * everything. Because nothing remounts, every transition glides.
 */
export default function AppShell() {
  const [tab, setTab] = useState<Tab>('home')
  const [sendOpen, setSendOpen] = useState(false)
  const [receiveOpen, setReceiveOpen] = useState(false)
  const [buyOpen, setBuyOpen] = useState(false)

  const navigate = (screen: Screen) => {
    if (screen === 'send') {
      setSendOpen(true)
      return
    }
    if (screen === 'receive') {
      setReceiveOpen(true)
      return
    }
    if (screen === 'buy') {
      setBuyOpen(true)
      return
    }
    setSendOpen(false)
    setReceiveOpen(false)
    setBuyOpen(false)
    setTab(screen)
  }

  return (
    <div className="app-page-bg font-sans antialiased text-[#121214] min-h-[100dvh] md:flex md:justify-center md:items-center md:py-6 select-none">
      {/* Device frame (rendered once) */}
      <div className="relative w-full h-[100dvh] md:w-[400px] md:h-[840px] md:max-h-[calc(100dvh_-_3rem)] bg-[#F4F5F8] overflow-hidden flex flex-col md:rounded-[48px] md:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] md:border-[8px] md:border-[#1E1E1E]">
        {/* Ambient glow (shared) */}
        <div className="absolute -top-24 -left-20 w-72 h-72 bg-purple-200/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-24 -right-20 w-72 h-72 bg-fuchsia-100/50 rounded-full blur-3xl pointer-events-none" />

        {/* Sliding track: Home + Analytics, always mounted */}
        <div className="relative flex-1 overflow-hidden">
          <div
            className="flex h-full w-[200%] ease-[var(--screen-ease)]"
            style={{
              transform: `translateX(-${TRACK_INDEX[tab] * 50}%)`,
              transitionProperty: 'transform',
              transitionDuration: 'var(--screen-dur)',
            }}
          >
            <div className="w-1/2 h-full">
              <HomeScreen
                onSend={() => setSendOpen(true)}
                onReceive={() => setReceiveOpen(true)}
                onBuy={() => setBuyOpen(true)}
              />
            </div>
            <div className="w-1/2 h-full">
              <AnalyticsScreen />
            </div>
          </div>
        </div>

        {/* Persistent tab bar + home indicator */}
        <TabBar active={tab} onNavigate={navigate} />
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-neutral-400/70 rounded-full z-50 pointer-events-none" />

        {/* Send: slides over everything */}
        <div
          className={`absolute inset-0 z-[60] bg-[#F4F5F8] overflow-hidden ease-[var(--screen-ease)] ${
            sendOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
          }`}
          style={{ transitionProperty: 'transform', transitionDuration: 'var(--screen-dur)' }}
          aria-hidden={!sendOpen}
        >
          <div className="absolute -top-24 -left-20 w-72 h-72 bg-purple-200/40 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -top-24 -right-20 w-72 h-72 bg-fuchsia-100/50 rounded-full blur-3xl pointer-events-none" />
          <SendScreen onClose={() => setSendOpen(false)} />
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-neutral-400/70 rounded-full z-50 pointer-events-none" />
        </div>

        {/* Receive: slides over everything */}
        <div
          className={`absolute inset-0 z-[60] bg-[#F4F5F8] overflow-hidden ease-[var(--screen-ease)] ${
            receiveOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
          }`}
          style={{ transitionProperty: 'transform', transitionDuration: 'var(--screen-dur)' }}
          aria-hidden={!receiveOpen}
        >
          <div className="absolute -top-24 -left-20 w-72 h-72 bg-purple-200/40 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -top-24 -right-20 w-72 h-72 bg-fuchsia-100/50 rounded-full blur-3xl pointer-events-none" />
          <ReceiveScreen onClose={() => setReceiveOpen(false)} />
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-neutral-400/70 rounded-full z-50 pointer-events-none" />
        </div>

        {/* Buy: slides over everything */}
        <div
          className={`absolute inset-0 z-[60] bg-[#F4F5F8] overflow-hidden ease-[var(--screen-ease)] ${
            buyOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
          }`}
          style={{ transitionProperty: 'transform', transitionDuration: 'var(--screen-dur)' }}
          aria-hidden={!buyOpen}
        >
          <div className="absolute -top-24 -left-20 w-72 h-72 bg-purple-200/40 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -top-24 -right-20 w-72 h-72 bg-fuchsia-100/50 rounded-full blur-3xl pointer-events-none" />
          <BuyScreen onClose={() => setBuyOpen(false)} />
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-neutral-400/70 rounded-full z-50 pointer-events-none" />
        </div>
      </div>
    </div>
  )
}
