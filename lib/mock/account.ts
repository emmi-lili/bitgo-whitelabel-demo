// lib/mock/account.ts
// 🟡 MOCK. Nada de esto viene de BitGo: el estado KYC, la tarjeta física y los
// términos de crédito (límite, APR, ciclo de facturación, auto-pay) son productos
// que este MVP no integra. Viven acá, separados de toda respuesta de BitGo, y
// SIEMPRE se renderizan con <MockBadge/> (constitución: "no hay mocks silenciosos").

/** Estado de cuenta / KYC simulado (badge estático, no hay verificación real). */
export const KYC_MOCK = {
  accountName: 'Go Account A',
  status: 'Active',
} as const;

/** Perfil de la persona (mock). No hay user API en este MVP. */
export const PROFILE_MOCK = {
  initials: 'E',
  firstName: 'Emmi',
  lastName: '',
  fullName: 'Emmi',
  email: 'emmilili.04@gmail.com',
  role: 'Administradora',
  phone: '+54 · · · · · · ·',
  timezone: 'America/Caracas (UTC−4)',
  memberSince: 'Ago 2026',
  enterprise: 'Bitgo Whitelabel',
  status: 'Active',
} as const;

export interface CardMock {
  brand: string;
  holder: string;
  last4: string;
  expiry: string;
}

/** Tarjeta física simulada. No existe ni se emite en este MVP. */
export const CARD_MOCK: CardMock = {
  brand: 'Bitgo Whitelabel',
  holder: 'EMMI',
  last4: '4921',
  expiry: '12/29',
};

/** Términos de crédito simulados. Filas listas para <InfoTable/>. */
export const CREDIT_MOCK: Array<[string, string]> = [
  ['Límite', '$5,000.00'],
  ['APR', '18.9%'],
  ['Ciclo de facturación', 'Día 1'],
];

/** Auto-pay simulado. */
export const AUTOPAY_MOCK = {
  enabled: true,
  label: 'Auto-pay activado',
} as const;
