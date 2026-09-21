// lib/mock/index.ts
// ── Inventario de datos MOCK ────────────────────────────────────────────────
// Todo lo que NO viene de BitGo vive acá y se renderiza SIEMPRE con <MockBadge/>
// (constitución: "no hay mocks silenciosos"). Un solo lugar para auditar qué está
// simulado en la demo:
//
//   • Perfil de la persona ......... account.ts    (PROFILE_MOCK)
//   • KYC / estado de cuenta ...... account.ts    (KYC_MOCK)
//   • Tarjeta física .............. account.ts    (CARD_MOCK)
//   • Límite · APR · ciclo ........ account.ts    (CREDIT_MOCK)
//   • Auto-pay .................... account.ts    (AUTOPAY_MOCK)
//   • Savings goal ................ savings.ts    (SAVINGS_GOAL_MOCK)
//   • Delta % del balance ......... market.ts     (BALANCE_DELTA_MOCK)
//   • Categorías / merchant ....... categories.ts (mockCategory, mockMerchant)
//
export * from './account';
export * from './savings';
export * from './market';
export * from './categories';
