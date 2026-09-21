// lib/domain/assets.ts
// Tickers como constantes tipadas. Nunca un string literal de activo en medio
// de una llamada (Instrucciones-btgo.md §Tickers). Todo lo que vive dentro de
// un Go Account lleva prefijo `ofc`; en testnet, USD de trading es "TUSD*".

export const COINS = ['ofctusd', 'ofctbtc', 'ofctsol', 'ofctusdc', 'ofcteth'] as const;
export type Coin = (typeof COINS)[number];

export interface AssetMeta {
  readonly coin: Coin;
  /** base units por 1 unidad display = 10^decimals. */
  readonly decimals: number;
  /** Símbolo para la UI. */
  readonly symbol: string;
  /** Long name for the trading UI. */
  readonly name: string;
  /** Emoji/glyph for the UI (we avoid images in the MVP). */
  readonly glyph: string;
  /** Trading symbol inside the Go Account (testnet, with `*`). */
  readonly tradingTicker: string;
}

// `decimals` of ofctusd = 2 (confirmed in the spike: "100 base = USD 1"). The
// rest are in their usual on-chain scale. It's ONE number per asset and lives
// only here: the rest of the system derives from this.
export const ASSETS: Record<Coin, AssetMeta> = {
  ofctusd: {
    coin: 'ofctusd',
    decimals: 2,
    symbol: 'USD',
    name: 'US Dollar',
    glyph: '$',
    tradingTicker: 'TUSD*',
  },
  ofctbtc: {
    coin: 'ofctbtc',
    decimals: 8,
    symbol: 'BTC',
    name: 'Bitcoin',
    glyph: '₿',
    tradingTicker: 'TBTC*',
  },
  ofctsol: {
    coin: 'ofctsol',
    decimals: 9,
    symbol: 'SOL',
    name: 'Solana',
    glyph: '◎',
    tradingTicker: 'TSOL*',
  },
  ofctusdc: {
    coin: 'ofctusdc',
    decimals: 6,
    symbol: 'USDC',
    name: 'USD Coin',
    glyph: '$',
    tradingTicker: 'TUSDC*',
  },
  ofcteth: {
    coin: 'ofcteth',
    decimals: 18,
    symbol: 'ETH',
    name: 'Ethereum',
    glyph: 'Ξ',
    tradingTicker: 'TETH*',
  },
};

// Las únicas monedas que se muestran en Cuenta, en este orden. Una fila por
// moneda, siempre presente (aunque BitGo no la devuelva → se muestra en cero).
export const DISPLAY_COINS: readonly Coin[] = ['ofctsol', 'ofctusd', 'ofctusdc'];

// ── Trading (buy/sell/swap) ──────────────────────────────────────────────────
// The quote asset: USD inside the Go Account. Everything is bought/sold/valued
// against it. On testnet its trading symbol carries a `*`.
export const QUOTE_COIN: Coin = 'ofctusd';

/** A tradable asset: the crypto and the BitGo product that quotes it against
 *  USD. `product` is the exact product `name` in the API (with `*`). */
export interface TradableAsset {
  readonly coin: Coin;
  /** BitGo crypto/USD product, e.g. "TBTC-TUSD*". Confirmed via the API. */
  readonly product: string;
  /** Symbol the API expects in quantityCurrency for the USD side. */
  readonly quoteCurrency: string;
}

// Curated to a liquid, stable testnet set (verified against
// GET /accounts/{id}/products: all with isTradeDisabled=false). The order drives
// the UI. USDC is also quoted against USD* (the TUSDC-TUSD* pair).
export const TRADABLE_ASSETS: readonly TradableAsset[] = [
  { coin: 'ofctbtc', product: 'TBTC-TUSD*', quoteCurrency: 'TUSD*' },
  { coin: 'ofcteth', product: 'TETH-TUSD', quoteCurrency: 'TUSD' },
  { coin: 'ofctsol', product: 'TSOL-TUSD', quoteCurrency: 'TUSD' },
  { coin: 'ofctusdc', product: 'TUSDC-TUSD*', quoteCurrency: 'TUSD*' },
];

export function tradableOf(coin: Coin): TradableAsset | undefined {
  return TRADABLE_ASSETS.find((t) => t.coin === coin);
}

export function isCoin(x: string): x is Coin {
  return (COINS as readonly string[]).includes(x);
}

export function assetOf(coin: Coin): AssetMeta {
  return ASSETS[coin];
}

// El mismo activo aparece con símbolos distintos según la API (Instrucciones §Tickers):
// dentro de un Go Account es `ofctusd`; en trading es `TUSD*`. Normalizamos ambos.
const CURRENCY_TO_COIN: Record<string, Coin> = {
  ofctusd: 'ofctusd',
  tusd: 'ofctusd',
  usd: 'ofctusd',
  ofctbtc: 'ofctbtc',
  tbtc: 'ofctbtc',
  btc: 'ofctbtc',
  ofctsol: 'ofctsol',
  tsol: 'ofctsol',
  sol: 'ofctsol',
  ofctusdc: 'ofctusdc',
  tusdc: 'ofctusdc',
  usdc: 'ofctusdc',
  ofcteth: 'ofcteth',
  teth: 'ofcteth',
  eth: 'ofcteth',
};

/** Mapea un símbolo de BitGo (`ofctusd`, `TUSD*`, `TBTC`…) a un Coin conocido,
 *  o null si no lo conocemos (para exponerlo aparte, sin inventarle decimales). */
export function coinFromCurrency(currency: string): Coin | null {
  const key = currency.trim().toLowerCase().replace(/\*$/, '');
  return CURRENCY_TO_COIN[key] ?? null;
}
