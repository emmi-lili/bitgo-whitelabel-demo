// lib/domain/transaction.ts
// Mapea Transfer[] (v2 wallet, base units) a dominio.
import type { Coin } from './assets';
import { isCoin, coinFromCurrency } from './assets';
import { absBase, baseUnits, toDisplay, type DisplayMoney } from './money';
import type { Schemas } from '../bitgo/types';

export interface TxHistoryEvent {
  action?: string; // created | signed | unconfirmed | confirmed | approved | ...
  date?: string;
}

export interface Transaction {
  id: string;
  coin: Coin;
  /** Derivado de type: receive→in, send→out. */
  direction: 'in' | 'out';
  /** Monto en display, valor absoluto. Usa intendedValueString si falló
   *  (BitGo mutila value a 0 en fallidas — SCREENS §4). */
  amount: DisplayMoney;
  state: string;
  /** Badge PENDING: set de estados de UI.md §2. */
  pending: boolean;
  isBookTransfer: boolean;
  subType?: string;
  date: string;
  comment?: string;
  sequenceId?: string;
  /** Referencia interna de BitGo (front-transfer hash). NO es el hash on-chain. */
  internalRef: string;
  /** Hash on-chain real: null en book transfer y hasta que esté confirmed
   *  (SCREENS §4 — vive en metadata[].onChainTxId). */
  onChainTxid: string | null;
  /** Log auditable para la línea de tiempo del detalle (SCREENS §4). */
  history: TxHistoryEvent[];
}

export interface TransactionsResult {
  transactions: Transaction[];
  unmapped: Array<{ id: string; coin: string }>;
}

// UI.md §2: pending = state ∈ este set.
const PENDING_STATES = new Set(['signed', 'unconfirmed', 'initialized', 'pendingApproval']);

function coinOf(raw: string): Coin | null {
  return isCoin(raw) ? raw : coinFromCurrency(raw);
}

// metadata es un array de pares clave-valor de shape variable; buscamos onChainTxId
// de forma defensiva sin usar `any`.
function extractOnChainTxId(metadata: unknown): string | null {
  if (!Array.isArray(metadata)) return null;
  for (const entry of metadata) {
    const v = (entry as Record<string, unknown> | null)?.['onChainTxId'];
    if (typeof v === 'string' && v) return v;
  }
  return null;
}

/** Mapea un Transfer a dominio, o null si el activo no es conocido. */
export function mapTransfer(t: Schemas['Transfer']): Transaction | null {
  const coin = coinOf(t.coin);
  if (!coin) return null;

  const failed = t.state === 'failed';
  const rawBase = failed && t.intendedValueString ? t.intendedValueString : t.valueString;
  const isBookTransfer = t.subType === 'ofc_book_transfer';
  // Book transfer nunca toca una blockchain → sin hash on-chain jamás.
  const onChainTxid = isBookTransfer
    ? null
    : extractOnChainTxId((t as { metadata?: unknown }).metadata);

  return {
    id: t.id,
    coin,
    direction: t.type === 'receive' ? 'in' : 'out',
    amount: toDisplay(absBase(baseUnits(coin, rawBase))),
    state: t.state,
    pending: PENDING_STATES.has(t.state),
    isBookTransfer,
    subType: t.subType,
    date: t.date,
    comment: t.comment || undefined,
    sequenceId: t.sequenceId,
    internalRef: t.txid,
    onChainTxid,
    history: Array.isArray(t.history)
      ? t.history.map((h) => ({ action: h.action, date: h.date }))
      : [],
  };
}

export function mapTransfers(transfers: Schemas['Transfer'][]): TransactionsResult {
  const transactions: Transaction[] = [];
  const unmapped: Array<{ id: string; coin: string }> = [];

  for (const t of transfers) {
    const tx = mapTransfer(t);
    if (tx) transactions.push(tx);
    else unmapped.push({ id: t.id, coin: t.coin });
  }

  return { transactions, unmapped };
}
