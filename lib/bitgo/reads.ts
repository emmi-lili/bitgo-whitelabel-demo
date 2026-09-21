// lib/bitgo/reads.ts
// Envoltorios tipados de los endpoints de LECTURA de BitGo. Devuelven JSON de
// BitGo (tipos generados); el mapeo a dominio vive en lib/domain/.
import 'server-only';
import { bitgoFetch } from './client';
import type { Schemas } from './types';

// Dentro de un Go Account, el coin de la ruta v2 es `ofc` (el contenedor);
// cada transfer/address trae su propio activo (ofctusd, ofctbtc, …).
const OFC = 'ofc';

/** GET /api/prime/trading/v1/accounts/{accountId}/balances → display units. */
export function getAccountBalances(accountId: string) {
  return bitgoFetch<{ data: Schemas['AccountBalances'] }>(
    'GET',
    `/api/prime/trading/v1/accounts/${encodeURIComponent(accountId)}/balances`,
  );
}

/** GET /api/v2/ofc/wallet/{walletId}/transfer → base units en valueString. */
export function listWalletTransfers(
  walletId: string,
  opts?: { limit?: number; type?: 'send' | 'receive' },
) {
  const q = new URLSearchParams();
  if (opts?.limit) q.set('limit', String(opts.limit));
  if (opts?.type) q.set('type', opts.type);
  const qs = q.toString() ? `?${q.toString()}` : '';
  return bitgoFetch<{ transfers: Schemas['Transfer'][] }>(
    'GET',
    `/api/v2/${OFC}/wallet/${encodeURIComponent(walletId)}/transfer${qs}`,
  );
}

/** GET /api/v2/ofc/wallet/{walletId}/transfer/{transferId} — para el detalle. */
export function getWalletTransfer(walletId: string, transferId: string) {
  return bitgoFetch<Schemas['Transfer']>(
    'GET',
    `/api/v2/${OFC}/wallet/${encodeURIComponent(walletId)}/transfer/${encodeURIComponent(transferId)}`,
  );
}

/** GET /api/v2/{coin}/wallet/{walletId} — saldo on-chain de una wallet nativa.
 *  balanceString/confirmed/spendable vienen en BASE units (como valueString). */
export function getWallet(coin: string, walletId: string) {
  return bitgoFetch<Schemas['Wallet']>(
    'GET',
    `/api/v2/${encodeURIComponent(coin)}/wallet/${encodeURIComponent(walletId)}`,
  );
}

/** GET /api/v2/ofc/wallet/{walletId}/addresses */
export function listWalletAddresses(walletId: string) {
  return bitgoFetch<{ addresses: Schemas['Address2'][] }>(
    'GET',
    `/api/v2/${OFC}/wallet/${encodeURIComponent(walletId)}/addresses`,
  );
}
