// lib/mock/savings.ts
// 🟡 MOCK. El "savings goal" no existe en BitGo: es una meta guardada en estado
// local (constitución). Presentación estilo Revolut Pockets.

export const SAVINGS_GOAL_MOCK = {
  label: 'Vacaciones',
  emoji: '✈️',
  saved: 640,
  goal: 1000,
  accent: '#1b4dff', // mismo azul de marca que el resto de la app
} as const;
