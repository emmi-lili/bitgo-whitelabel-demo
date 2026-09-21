// lib/domain/address.ts
// Mapea las direcciones de recepción de la Go Account a dominio.
import type { Schemas } from '../bitgo/types';

export interface WalletAddress {
  id?: string;
  address: string;
  /** Activo de la dirección (onToken). Una Go Account genera una por activo. */
  coin?: string;
  chain?: number;
  label?: string;
}

export function mapAddresses(addresses: Schemas['Address2'][]): WalletAddress[] {
  const out: WalletAddress[] = [];
  for (const a of addresses) {
    if (!a.address) continue; // sin dirección utilizable, no la mostramos
    out.push({
      id: a.id,
      address: a.address,
      coin: a.coin,
      chain: a.chain,
      label: a.label ?? undefined,
    });
  }
  return out;
}
