// lib/mock/savings.ts
// 🟡 MOCK. El "savings goal" no existe en BitGo: es una meta guardada en estado
// local (constitución). Presentación estilo Revolut Pockets.

export const SAVINGS_GOAL_MOCK = {
  label: 'Vacaciones',
  emoji: '✈️',
  saved: 640,
  goal: 1000,
  accent: 'var(--accent)', // acento secundario (violeta) — le da aire al azul de marca
} as const;
