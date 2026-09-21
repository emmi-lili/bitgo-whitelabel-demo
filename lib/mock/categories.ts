// lib/mock/categories.ts
// 🟡 MOCK. BitGo no da merchant ni categoría de gasto tipo "Food & Drink"
// (Instrucciones-btgo.md). Esto es simulado y SIEMPRE se muestra con <MockBadge/>.
// Se deriva de forma estable desde el id del transfer para que no baile entre renders.

/** Subconjunto estructural de Transaction que necesita la categorización. Así
 *  sirve igual con el tipo de dominio o con el JSON ya parseado en el cliente. */
export interface CategorizableTx {
  id: string;
  subType?: string;
  direction: 'in' | 'out';
  comment?: string;
}

export type CategoryColor = 'blue' | 'orange' | 'green' | 'violet';

export interface MockCategory {
  label: string;
  icon: string;
  color: CategoryColor;
}

const CATEGORIES: MockCategory[] = [
  { label: 'Transfer', icon: '↔', color: 'blue' },
  { label: 'Groceries', icon: '🛒', color: 'orange' },
  { label: 'Income', icon: '↓', color: 'green' },
  { label: 'Electronics', icon: '💻', color: 'violet' },
  { label: 'Dining', icon: '🍽', color: 'orange' },
  { label: 'Transport', icon: '🚕', color: 'blue' },
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Ícono real (de subType) + categoría/merchant simulados. */
export function mockCategory(tx: CategorizableTx): MockCategory {
  // El ícono del tipo de movimiento SÍ es real (subType). La etiqueta es mock.
  if (tx.subType === 'ofc_book_transfer') return { label: 'Transfer', icon: '↔', color: 'blue' };
  if (tx.subType === 'ofc_deposit' || tx.direction === 'in')
    return { label: 'Income', icon: '↓', color: 'green' };
  const pool = CATEGORIES.filter((c) => c.label !== 'Income' && c.label !== 'Transfer');
  return pool[hash(tx.id) % pool.length] ?? CATEGORIES[0]!;
}

/** "Merchant" simulado — usa la nota real si existe, si no un nombre estable. */
const MERCHANTS = ['Cuenta B', 'Whole Foods', 'Apple Store', 'Uber', 'Blue Bottle', 'Amazon'];
export function mockMerchant(tx: CategorizableTx): string {
  if (tx.comment) return tx.comment; // la nota es dato REAL
  if (tx.subType === 'ofc_book_transfer') return tx.direction === 'out' ? 'Cuenta B' : 'Cuenta A';
  return MERCHANTS[hash(tx.id) % MERCHANTS.length] ?? 'Movimiento';
}
