// lib/domain/trading.ts
// Trading domain types, shared between the BFF and the UI. A mirror without
// Money's nominal brand (amounts travel as { coin, unit, value }).
import type { Coin } from './assets';

export type TradeSide = 'buy' | 'sell' | 'swap';

/** Live price of an asset against USD (from BitGo's real level1). */
export interface AssetPrice {
  coin: Coin;
  product: string;
  /** Sell price (what you get paid if you sell): best bid. */
  bid: string;
  /** Buy price (what you pay if you buy): best ask. */
  ask: string;
  /** Midpoint, to show a plain "price". */
  mid: string;
  time: string;
}

/** An asset listed in the trading UI, with its live price (or error). */
export interface TradableAssetView {
  coin: Coin;
  symbol: string;
  name: string;
  glyph: string;
  product: string;
  price: AssetPrice | null;
  /** If the price failed to load, BitGo's real message (we don't hide it). */
  priceError?: string;
}

export interface MoneyLite {
  coin: Coin;
  unit: 'base' | 'display';
  value: string;
}

/** Result of a quote before confirming (prior to the fill). */
export interface QuoteResult {
  side: TradeSide;
  fromCoin: Coin;
  toCoin: Coin;
  /** What you hand over. */
  pay: MoneyLite;
  /** What you receive (estimated, at the current price). */
  receive: MoneyLite;
  /** Unit price used (USD per unit of the crypto asset). */
  unitPrice: string;
  /** USD moved (for a swap, the intermediate step). */
  usdValue: MoneyLite;
  priceTime: string;
}

/** A trade already settled in the demo ledger (at BitGo's real price). */
export interface TradeRecord {
  id: string;
  side: TradeSide;
  fromCoin: Coin;
  toCoin: Coin;
  paid: MoneyLite;
  received: MoneyLite;
  unitPrice: string;
  usdValue: MoneyLite;
  /** Reference of the REAL order fired to BitGo, if one was fired. */
  bitgoOrderId?: string;
  bitgoStatus?: string;
  createdAt: string;
}

/** Outcome of executing a trade. */
export type TradeOutcome =
  | { outcome: 'filled'; trade: TradeRecord }
  | { outcome: 'failed'; step: 'quote' | 'settle'; message: string; source?: 'bitgo' | 'app' };
