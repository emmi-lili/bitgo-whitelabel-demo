// lib/domain/balance.ts
// Mapea AccountBalance[] (prime trading, display units) a dominio.
// Los CINCO balances se exponen por separado, no colapsados (PLAN2 Fase 2).
import type { Coin } from './assets';
import { coinFromCurrency, DISPLAY_COINS } from './assets';
import { baseUnits, displayFromBitGo, subBase, toDisplay, type DisplayMoney } from './money';
import type { Schemas } from '../bitgo/types';

export interface AssetBalance {
  coin: Coin;
  currency: string; // símbolo crudo de BitGo (p.ej. "TUSD*")
  total: DisplayMoney; // balance
  held: DisplayMoney; // heldBalance
  unsettledHeld: DisplayMoney; // unsettledHeldBalance
  tradable: DisplayMoney; // tradableBalance
  withdrawable: DisplayMoney; // withdrawableBalance — el disponible para transferir
}

/** Balance de un activo que no mapeamos a un Coin conocido: se muestra crudo,
 *  visible, sin inventarle decimales ni ocultarlo. */
export interface UnmappedBalance {
  currency: string;
  raw: Record<string, string>;
}

export interface BalancesResult {
  balances: AssetBalance[];
  unmapped: UnmappedBalance[];
}

export function mapAccountBalances(data: Schemas['AccountBalances']): BalancesResult {
  const balances: AssetBalance[] = [];
  const unmapped: UnmappedBalance[] = [];

  for (const b of data) {
    const coin = coinFromCurrency(b.currency);
    if (!coin) {
      unmapped.push({
        currency: b.currency,
        raw: {
          balance: b.balance,
          heldBalance: b.heldBalance,
          unsettledHeldBalance: b.unsettledHeldBalance,
          tradableBalance: b.tradableBalance,
          withdrawableBalance: b.withdrawableBalance,
        },
      });
      continue;
    }
    balances.push({
      coin,
      currency: b.currency,
      total: displayFromBitGo(coin, b.balance),
      held: displayFromBitGo(coin, b.heldBalance),
      unsettledHeld: displayFromBitGo(coin, b.unsettledHeldBalance),
      tradable: displayFromBitGo(coin, b.tradableBalance),
      withdrawable: displayFromBitGo(coin, b.withdrawableBalance),
    });
  }

  return { balances, unmapped };
}

/** Saldo on-chain de la wallet nativa de SOL (`tsol`) como un AssetBalance más.
 *  Los valores vienen en base units (lamports) → los pasamos a display. La
 *  wallet nativa no tiene el modelo de 5 balances de trading: exponemos el total,
 *  el disponible (`spendable`) y lo aún sin confirmar (`total - confirmed`);
 *  `held` y `tradable` no aplican y quedan en cero. */
export function nativeSolBalance(w: Schemas['Wallet']): AssetBalance {
  const coin: Coin = 'ofctsol';
  const total = baseUnits(coin, w.balanceString ?? '0');
  const confirmed = baseUnits(coin, w.confirmedBalanceString ?? '0');
  const spendable = baseUnits(coin, w.spendableBalanceString ?? '0');
  const zero = displayFromBitGo(coin, '0');
  return {
    coin,
    currency: 'tsol',
    total: toDisplay(total),
    held: zero,
    unsettledHeld: toDisplay(subBase(total, confirmed)),
    tradable: zero,
    withdrawable: toDisplay(spendable),
  };
}

/** Agrega el saldo de la wallet nativa de SOL al resultado. Se usa cuando hay
 *  TSOL_WALLET_ID configurada. El orden/selección final los fija toDisplayBalances. */
export function withNativeSol(result: BalancesResult, w: Schemas['Wallet']): BalancesResult {
  return { balances: [...result.balances, nativeSolBalance(w)], unmapped: result.unmapped };
}

/** Balance en cero para un coin (cuando BitGo no devolvió esa moneda). */
function zeroBalance(coin: Coin): AssetBalance {
  const zero = displayFromBitGo(coin, '0');
  return {
    coin,
    currency: coin,
    total: zero,
    held: zero,
    unsettledHeld: zero,
    tradable: zero,
    withdrawable: zero,
  };
}

/** Reduce a las monedas que muestra Cuenta (SOL, USD, USDC), una fila por moneda
 *  y en ese orden. Si BitGo no devolvió alguna, va en cero (está bien que sea cero
 *  hasta que entre algo). Colapsa duplicados por moneda: BitGo manda USD dos veces
 *  (TUSD y TUSD*, misma currency) — nos quedamos con la primera. */
export function toDisplayBalances(result: BalancesResult): BalancesResult {
  const byCoin = new Map<Coin, AssetBalance>();
  for (const b of result.balances) if (!byCoin.has(b.coin)) byCoin.set(b.coin, b);
  const balances = DISPLAY_COINS.map((coin) => byCoin.get(coin) ?? zeroBalance(coin));
  return { balances, unmapped: result.unmapped };
}
