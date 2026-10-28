import { useState } from 'react'
import type { Screen } from './navigation'
import HomeScreen from './components/HomeScreen'
import AnalyticsScreen from './components/analytics/AnalyticsScreen'

/** Left-to-right order of screens, used to pick the transition direction. */
const ORDER: Record<Screen, number> = { home: 0, analytics: 1 }

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [enterClass, setEnterClass] = useState('')

  const navigate = (next: Screen) => {
    if (next === screen) return
    setEnterClass(ORDER[next] > ORDER[screen] ? 'anim-forward' : 'anim-back')
    setScreen(next)
  }

  return screen === 'analytics' ? (
    <AnalyticsScreen onNavigate={navigate} enterClass={enterClass} />
  ) : (
    <HomeScreen onNavigate={navigate} enterClass={enterClass} />
  )
}
