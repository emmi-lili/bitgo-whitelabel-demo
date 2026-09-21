// lib/bitgo/trading.ts
// ─────────────────────────────────────────────────────────────────────────────
// BUY / SELL / SWAP — BitGo Prime Trading API client (typed wrappers).
// ─────────────────────────────────────────────────────────────────────────────
//
// WHAT THIS IS
//   Thin, typed HTTP wrappers around BitGo's Prime Trading REST API. This is the
//   ONLY place that speaks the trading endpoints; it returns raw BitGo JSON and
//   knows nothing about the UI. The domain mapping lives in lib/domain/trading.ts
//   and the orchestration (real price + demo settlement) in lib/trading/service.ts.
//
// WHERE THE API LIVES
//   · Base URL (testnet):  https://app.bitgo-test.com   (prod: https://app.bitgo.com)
//     Configured in lib/bitgo/config.ts via BITGO_API_BASE.
//   · Auth: Bearer access token (BITGO_ACCESS_TOKEN), added by bitgoFetch().
//   · All trading routes hang off:
//       /api/prime/trading/v1/accounts/{accountId}
//     where {accountId} is the Go Account (trading wallet) id — here GO_ACCOUNT_A_ID.
//
// OFFICIAL DOCS (verify before changing — project rule "no invented endpoints")
//   · Docs home:            https://developers.bitgo.com/
//   · LLM/Markdown index:   https://developers.bitgo.com/llms.txt
//   · Go Accounts / CaaS:   https://developers.bitgo.com/docs/crypto-as-a-service-go-accounts
//   The endpoint PATHS below were verified live against app.bitgo-test.com.
//
// ENDPOINTS USED (all money in DISPLAY units, e.g. "81225.7", NOT base units)
//   GET  /accounts/{id}/products             → tradable pairs ("TBTC-TUSD*", …)
//   GET  /accounts/{id}/products/{p}/level1  → best bid/ask (live price snapshot)
//   POST /accounts/{id}/orders               → place an order (buy/sell)
//   GET  /accounts/{id}/orders               → order history
//   GET  /accounts/{id}/orders/{orderId}     → single order (final status)
//
// PRICING CONVENTION
//   A product is "BASE-QUOTE" (e.g. TBTC-TUSD*). Price = QUOTE per 1 BASE.
//   BUY  crypto  → you pay QUOTE (USD), you get BASE, matched at the ASK.
//   SELL crypto  → you deliver BASE, you get QUOTE (USD), matched at the BID.
// ─────────────────────────────────────────────────────────────────────────────
import 'server-only';
import { bitgoFetch } from './client';

const TRADING = '/api/prime/trading/v1/accounts';

export interface BitGoProduct {
  id: string;
  name: string; // "TBTC-TUSD*"
  baseCurrency: string;
  quoteCurrency: string;
  quoteMinSize: string;
  quoteIncrement: string;
  baseIncrement: string;
  isTradeDisabled: boolean;
}

export interface BitGoLevel1 {
  time: string;
  product: string;
  bidPrice: string;
  bidSize: string;
  askPrice: string;
  askSize: string;
}

/** The Order object as BitGo returns it (the subset we use). */
export interface BitGoOrder {
  id: string;
  clientOrderId: string | null;
  time: string;
  product: string;
  side: 'buy' | 'sell';
  type: string;
  status:
    'pending_open' | 'open' | 'completed' | 'pending_cancel' | 'canceled' | 'error' | 'scheduled';
  reason: string;
  quantity: string;
  quantityCurrency: string;
  filledQuantity: string;
  filledQuoteQuantity: string;
  averagePrice: string;
}

/** GET /products — every tradable pair on the Go Account (display units).
 *  Used to build the buy/sell asset list. Each item's `name` (e.g. "TBTC-TUSD*")
 *  is the product id you pass to level1 and to the order's `product` field. */
export function listProducts(accountId: string) {
  return bitgoFetch<{ data: BitGoProduct[] }>(
    'GET',
    `${TRADING}/${encodeURIComponent(accountId)}/products`,
  );
}

/** GET /products/{product}/level1 — top-of-book price snapshot for one pair.
 *  Returns the best `bidPrice` (what a SELL fills at) and `askPrice` (what a BUY
 *  fills at). This is the live price shown in the UI and used to quote a trade.
 *  The product name can contain `*` (testnet USD, "TUSD*"), so it is URL-encoded. */
export function getLevel1(accountId: string, product: string) {
  return bitgoFetch<BitGoLevel1>(
    'GET',
    `${TRADING}/${encodeURIComponent(accountId)}/products/${encodeURIComponent(product)}/level1`,
  );
}

export interface NewMarketOrder {
  /** Pair id, e.g. "TBTC-TUSD*" (from listProducts()). */
  product: string;
  /** "buy" = acquire the base asset; "sell" = dispose of the base asset. */
  side: 'buy' | 'sell';
  /** Amount in DISPLAY units, measured in `quantityCurrency`. */
  quantity: string;
  /** Which currency `quantity` is expressed in — must match a side of the pair.
   *  BUY by USD budget → the QUOTE currency (e.g. "TUSD*"): "spend this much USD".
   *  SELL a crypto amount → the BASE currency (e.g. "TBTC"): "sell this much BTC". */
  quantityCurrency: string;
  /** Idempotency key you own; BitGo echoes it back and rejects duplicates. */
  clientOrderId?: string;
  /** Market orders only support immediate execution: IOC (default) or FOK. */
  timeInForce?: 'IOC' | 'FOK';
}

/** POST /orders — place a REAL market order (buy or sell) on BitGo.
 *
 *  This is the genuine buy/sell call. It returns the initial Order, usually with
 *  status "pending_open"; the fill is asynchronous, so poll getOrder() for the
 *  final status ("completed" with a fill, or "canceled"/"error" with a `reason`).
 *
 *  NOTE (testnet demo): the Go Account here has a 0 balance, so a real order is
 *  accepted but then settles to `canceled · reason: "insufficientFunds"`. That is
 *  why the app quotes at these REAL prices but settles buy/sell in the local demo
 *  ledger (lib/demo/ledger.ts). This wrapper is wired and verified for when the
 *  account is funded; see lib/trading/service.ts for how it is used. */
export function createMarketOrder(accountId: string, order: NewMarketOrder) {
  return bitgoFetch<BitGoOrder>('POST', `${TRADING}/${encodeURIComponent(accountId)}/orders`, {
    type: 'market',
    timeInForce: order.timeInForce ?? 'IOC',
    ...order,
  });
}

/** GET /orders/{orderId} — fetch one order to read its final status
 *  ("completed" / "canceled" / "error") and, on a fill, its `averagePrice`. */
export function getOrder(accountId: string, orderId: string) {
  return bitgoFetch<BitGoOrder>(
    'GET',
    `${TRADING}/${encodeURIComponent(accountId)}/orders/${encodeURIComponent(orderId)}`,
  );
}

/** GET /orders — history of real orders placed on this account. */
export function listOrders(accountId: string, opts?: { limit?: number }) {
  const q = opts?.limit ? `?limit=${opts.limit}` : '';
  return bitgoFetch<{ data: BitGoOrder[] }>(
    'GET',
    `${TRADING}/${encodeURIComponent(accountId)}/orders${q}`,
  );
}
