import type { ReactNode } from 'react';
import { BottomNav } from '@/components/BottomNav';

// Shell de las 3 tabs: 420px centrado + bottom nav fija (UI.md §1).
export default function TabsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="shell">
      {children}
      <BottomNav />
    </div>
  );
}
