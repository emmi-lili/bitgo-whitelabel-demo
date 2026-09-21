// lib/trading/service.ts
// Orchestrates trading: real BitGo PRICES (level1) + SETTLEMENT in the demo
// ledger. Each function has a single source per data type and never mixes them:
// prices come from lib/bitgo/trading (real), settlement from lib/demo/ledger.
import 'server-only';
import { bitgoConfig } from '../bitgo/config';
import { BitGoError } from '../bitgo/client';
import { getLevel1 } from '../bitgo/trading';
import { QUOTE_COIN, TRADABLE_ASSETS, assetOf, tradableOf, type Coin } from '../domain/assets';
import { baseUnits, displayFromBitGo, displayUnits, toBase, toDisplay } from '../domain/money';
import { midPrice, quoteBuy, quoteSell, quoteSwap, valueInUsd } from '../domain/pricing';
import type {
  AssetPrice,
  MoneyLite,
  QuoteResult,
  TradableAssetView,
  TradeRecord,
  TradeSide,
} from '../domain/trading';
import { getBalance, getBalances, settleTrade } from '../demo/ledger';

function money(coin: Coin, displayValue: string): MoneyLite {
  return { coin, unit: 'display', value: displayValue };
}

function isZero(s: string): boolean {
  return /^-?0*(\.0*)?$/.test(s.trim());
}

// ── Live prices ──────────────────────────────────────────────────────────────
async function priceOf(coin: Coin): Promise<AssetPrice | { error: string }> {
  const t = tradableOf(coin);
  if (!t) return { error: `Activo no negociable: ${coin}` };
  try {
    const l1 = await getLevel1(bitgoConfig.goAccountA, t.product);
    // On testnet one side of the book is sometimes missing (bid or ask = "0"). To
    // avoid quoting/valuing at half, we use the present side as a proxy for the other.
    const bid = isZero(l1.bidPrice) ? l1.askPrice : l1.bidPrice;
    const ask = isZero(l1.askPrice) ? l1.bidPrice : l1.askPrice;
    return {
      coin,
      product: t.product,
      bid,
      ask,
      mid: midPrice(bid, ask),
      time: l1.time,
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

/** All tradable assets with their live price (or the real error). */
export async function getTradableAssets(): Promise<TradableAssetView[]> {
  const prices = await Promise.all(TRADABLE_ASSETS.map((t) => priceOf(t.coin)));
  return TRADABLE_ASSETS.map((t, i) => {
    const meta = assetOf(t.coin);
    const p = prices[i]!;
    const view = {
      coin: t.coin,
      symbol: meta.symbol,
      name: meta.name,
      glyph: meta.glyph,
      product: t.product,
    };
    const full: TradableAssetView =
      'error' in p ? { ...view, price: null, priceError: p.error } : { ...view, price: p };
    return full;
  });
}

async function requirePrice(coin: Coin): Promise<AssetPrice> {
  const p = await priceOf(coin);
  if ('error' in p) throw new BitGoError(p.error, { source: 'bitgo' });
  return p;
}

// ── Quote (price only — no settlement) ───────────────────────────────────────
// BUY / SELL / SWAP pricing. `coin` is ALWAYS the crypto asset; USD (QUOTE_COIN)
// is the counter-currency. For a swap, `coin` is the source crypto and `toCoin`
// the destination. `amount` is expressed in whatever you HAND OVER:
//   · buy  → amount is USD you spend
//   · sell → amount is crypto you deliver
//   · swap → amount is source crypto you deliver
// Prices come live from BitGo level1 (see lib/bitgo/trading.ts); the decimal math
// lives in lib/domain/pricing.ts (BigInt, never `number`). Nothing is settled here.
export async function quote(
  side: TradeSide,
  coin: Coin,
  amount: string,
  toCoin?: Coin,
): Promise<QuoteResult> {
  if (side === 'buy') {
    // BUY: spend `amount` USD, receive `coin`. A buy fills at the ASK (the price
    // sellers are asking), so the crypto you get = USD / askPrice.
    const usd = displayUnits(QUOTE_COIN, amount); // validates USD has ≤ 2 decimals
    const price = await requirePrice(coin);
    const received = quoteBuy(usd.value, price.ask, coin);
    return {
      side,
      fromCoin: QUOTE_COIN,
      toCoin: coin,
      pay: money(QUOTE_COIN, usd.value),
      receive: money(coin, received.value),
      unitPrice: price.ask,
      usdValue: money(QUOTE_COIN, usd.value),
      priceTime: price.time,
    };
  }
  if (side === 'sell') {
    // SELL: deliver `amount` of `coin`, receive USD. A sell fills at the BID (the
    // price buyers are bidding), so the USD you get = coinAmount * bidPrice.
    const amt = displayUnits(coin, amount);
    const price = await requirePrice(coin);
    const received = quoteSell(amt.value, price.bid);
    return {
      side,
      fromCoin: coin,
      toCoin: QUOTE_COIN,
      pay: money(coin, amt.value),
      receive: money(QUOTE_COIN, received.value),
      unitPrice: price.bid,
      usdValue: money(QUOTE_COIN, received.value),
      priceTime: price.time,
    };
  }
  // SWAP: deliver `coin`, receive `toCoin`. Modeled as sell-to-USD then buy-from-USD:
  // sell source at its BID → USD, then buy destination at its ASK (see quoteSwap).
  if (!toCoin || toCoin === coin) throw new Error('El swap necesita dos activos distintos.');
  const amt = displayUnits(coin, amount);
  const [from, to] = await Promise.all([requirePrice(coin), requirePrice(toCoin)]);
  const { usd, received } = quoteSwap(amt.value, from.bid, to.ask, toCoin);
  return {
    side,
    fromCoin: coin,
    toCoin,
    pay: money(coin, amt.value),
    receive: money(toCoin, received.value),
    unitPrice: to.ask,
    usdValue: money(QUOTE_COIN, usd.value),
    priceTime: to.time,
  };
}

// ── Execute (quote at the REAL price, then settle in the demo ledger) ────────
// This is what actually "runs" a buy/sell/swap. We re-quote at the live price so
// the fill matches what BitGo would price right now, then debit what you pay and
// credit what you receive in the demo ledger (lib/demo/ledger.ts). The testnet Go
// Account is empty, so settlement is simulated; the PRICE is real. To go fully
// real instead, call createMarketOrder() (lib/bitgo/trading.ts) here and poll it.
export async function execute(
  side: TradeSide,
  coin: Coin,
  amount: string,
  toCoin: Coin | undefined,
  id: string,
  now: string,
): Promise<TradeRecord> {
  const q = await quote(side, coin, amount, toCoin);
  const record = await settleTrade({
    id,
    side: q.side,
    fromCoin: q.fromCoin,
    toCoin: q.toCoin,
    paid: q.pay,
    received: q.receive,
    unitPrice: q.unitPrice,
    usdValue: q.usdValue,
    createdAt: now,
  });
  return record;
}

// ── Portfolio (demo balances valued at the real price) ───────────────────────
export interface PortfolioEntry {
  coin: Coin;
  symbol: string;
  name: string;
  glyph: string;
  amount: MoneyLite; // balance in display
  usdValue: MoneyLite; // USD valuation (0 for USD itself = its own balance)
  price: string | null; // unit price used (null for USD)
}

export interface PortfolioView {
  entries: PortfolioEntry[];
  totalUsd: MoneyLite;
}

export async function getPortfolio(): Promise<PortfolioView> {
  const [balances, assets] = await Promise.all([getBalances(), getTradableAssets()]);
  const priceByCoin = new Map(assets.map((a) => [a.coin, a.price?.mid ?? null]));
  const entries: PortfolioEntry[] = [];
  let totalBase = 0n; // USD base units total

  for (const b of balances) {
    const meta = assetOf(b.coin);
    const amountDisplay = toDisplay(baseUnits(b.coin, b.base));
    let usdValue: MoneyLite;
    let price: string | null;
    if (b.coin === QUOTE_COIN) {
      usdValue = money(QUOTE_COIN, amountDisplay.value);
      price = null;
      totalBase += toBase(displayFromBitGo(QUOTE_COIN, amountDisplay.value)).value;
    } else {
      const mid = priceByCoin.get(b.coin) ?? null;
      if (mid) {
        const v = valueInUsd(amountDisplay.value, mid);
        usdValue = money(QUOTE_COIN, v.value);
        totalBase += toBase(v).value;
      } else {
        usdValue = money(QUOTE_COIN, '0');
      }
      price = mid;
    }
    entries.push({
      coin: b.coin,
      symbol: meta.symbol,
      name: meta.name,
      glyph: meta.glyph,
      amount: money(b.coin, amountDisplay.value),
      usdValue,
      price,
    });
  }

  const totalUsd = money(QUOTE_COIN, toDisplay(baseUnits(QUOTE_COIN, totalBase.toString())).value);
  return { entries, totalUsd };
}

export { getBalance };
