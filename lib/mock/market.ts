// lib/mock/market.ts
// 🟡 MOCK. El delta % del balance figura como "derivado" en UI.md, pero no hay
// snapshot histórico ni market data en este MVP → es simulado. Con <MockBadge/>.

export const BALANCE_DELTA_MOCK = {
  label: '▲ 2.4%',
  pct: 2.4,
} as const;
