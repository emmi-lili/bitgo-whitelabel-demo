// lib/domain/pricing.ts
// PRICE arithmetic to quote buy/sell/swap. Like money.ts, `number` and
// `parseFloat` are never used here: BitGo prices arrive as decimal strings
// (e.g. "81407.78") and we multiply/divide them with BigInt at high precision,
// rounding only at the end to the target asset's decimals.
//
// Rules:
//   · A price is "how much USD 1 unit of the asset is worth" (quote/base), string.
//   · quoteBuy:  USD  → asset  (divide by the sell price, `ask`).
//   · quoteSell: asset → USD    (multiply by the buy price, `bid`).
//   · quoteSwap: asset→asset    (sell A at its `bid`, buy B at its `ask`).
//   · Rounding is TRUNCATED (floor of the absolute value): we never promise more
//     than we can deliver. It matches how an exchange gives you what fits, no more.

import type { Coin } from './assets';
import { assetOf } from './assets';
import { displayFromBitGo, type DisplayMoney } from './money';

// ── decimal as (digits, scale): value = digits / 10^scale, sign carried in digits ─
interface Dec {
  digits: bigint;
  scale: number;
}

const DEC_RE = /^-?\d+(\.\d+)?$/;

/** Parse a decimal string into (digits, scale). Throws if not a valid decimal. */
export function parseDec(s: string): Dec {
  const t = s.trim();
  if (!DEC_RE.test(t)) throw new Error(`Valor decimal inválido: "${s}"`);
  const neg = t.startsWith('-');
  const [intPart, fracPart = ''] = t.replace(/^-/, '').split('.');
  const digits = BigInt((intPart || '0') + fracPart);
  return { digits: neg ? -digits : digits, scale: fracPart.length };
}

function pow10(n: number): bigint {
  return 10n ** BigInt(n);
}

function isPositive(s: string): boolean {
  const d = parseDec(s);
  return d.digits > 0n;
}

/** a * b, result truncated to `outScale` decimals (floor of the absolute value). */
function mulTo(a: Dec, b: Dec, outScale: number): string {
  const prodDigits = a.digits * b.digits; // combined scale = a.scale + b.scale
  const prodScale = a.scale + b.scale;
  return rescale(prodDigits, prodScale, outScale);
}

/** a / b, result truncated to `outScale` decimals (floor of the absolute value). */
function divTo(a: Dec, b: Dec, outScale: number): string {
  if (b.digits === 0n) throw new Error('División por cero en cotización.');
  // Bring the numerator up to the output scale (plus a margin for clean truncation):
  // value = a.digits/10^a.scale ÷ b.digits/10^b.scale = a.digits*10^b.scale / (b.digits*10^a.scale)
  // we want the quotient scaled to outScale: multiply the numerator by 10^outScale.
  const num = a.digits * pow10(b.scale + outScale);
  const den = b.digits * pow10(a.scale);
  const scaledDigits = num / den; // truncated toward zero by BigInt
  return fromScaled(scaledDigits, outScale);
}

/** digits at a given scale → canonical decimal string with `scale` decimals. */
function fromScaled(digits: bigint, scale: number): string {
  const neg = digits < 0n;
  const abs = (neg ? -digits : digits).toString();
  if (scale === 0) return (neg ? '-' : '') + abs;
  const padded = abs.padStart(scale + 1, '0');
  const cut = padded.length - scale;
  const out = padded.slice(0, cut) + '.' + padded.slice(cut);
  return (neg ? '-' : '') + out;
}

/** Rescale (digits, fromScale) to `toScale` by truncating (floor of the abs value). */
function rescale(digits: bigint, fromScale: number, toScale: number): string {
  if (toScale >= fromScale) {
    return fromScaled(digits * pow10(toScale - fromScale), toScale);
  }
  const drop = fromScale - toScale;
  const truncated = digits / pow10(drop); // BigInt truncates toward zero
  return fromScaled(truncated, toScale);
}

// ── Quote API (the boundary: typed display strings in and out) ───────────────

/** BUY: given a USD budget and the ASK price (USD per 1 unit of the asset),
 *  return how much `targetCoin` you receive = usdAmount / askPrice, truncated to
 *  the asset's decimals (we never promise more than the money covers). */
export function quoteBuy(usdAmount: string, askPrice: string, targetCoin: Coin): DisplayMoney {
  if (!isPositive(askPrice)) throw new Error('Precio inválido para la compra.');
  const { decimals } = assetOf(targetCoin);
  const out = divTo(parseDec(usdAmount), parseDec(askPrice), decimals);
  return displayFromBitGo(targetCoin, out);
}

/** SELL: given an asset amount and the BID price (USD per 1 unit of the asset),
 *  return how much USD you receive = coinAmount * bidPrice, truncated to 2 (USD)
 *  decimals. */
export function quoteSell(coinAmount: string, bidPrice: string): DisplayMoney {
  if (!isPositive(bidPrice)) throw new Error('Precio inválido para la venta.');
  const { decimals } = assetOf('ofctusd');
  const out = mulTo(parseDec(coinAmount), parseDec(bidPrice), decimals);
  return displayFromBitGo('ofctusd', out);
}

/** USD value of an asset amount at a given price (for the portfolio). */
export function valueInUsd(coinAmount: string, price: string): DisplayMoney {
  const { decimals } = assetOf('ofctusd');
  const out = mulTo(parseDec(coinAmount), parseDec(price), decimals);
  return displayFromBitGo('ofctusd', out);
}

/** Midpoint between bid and ask, at 2 decimals (only to show a "price"). */
export function midPrice(bid: string, ask: string): string {
  const sum =
    parseDec(bid).digits * pow10(parseDec(ask).scale) +
    parseDec(ask).digits * pow10(parseDec(bid).scale);
  const scale = parseDec(bid).scale + parseDec(ask).scale;
  // sum/2 at the combined scale, then truncated to 2 decimals.
  return rescale(sum / 2n, scale, 2);
}

/** Swap A→B: sell A at its `bidA` (→ USD) and buy B at its `askB`. Returns the
 *  intermediate USD (what you "move") and how much B you receive. */
export function quoteSwap(
  fromAmount: string,
  bidFrom: string,
  askTo: string,
  toCoin: Coin,
): { usd: DisplayMoney; received: DisplayMoney } {
  const usd = quoteSell(fromAmount, bidFrom);
  const received = quoteBuy(usd.value, askTo, toCoin);
  return { usd, received };
}
