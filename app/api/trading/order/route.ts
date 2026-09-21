import { fieldStr } from '@/lib/bitgo/fields';
import { isCoin, type Coin } from '@/lib/domain/assets';
import { execute } from '@/lib/trading/service';
import { InsufficientDemoFunds } from '@/lib/demo/ledger';
import type { TradeOutcome, TradeSide } from '@/lib/domain/trading';

export const dynamic = 'force-dynamic';

function isSide(x: unknown): x is TradeSide {
  return x === 'buy' || x === 'sell' || x === 'swap';
}

// POST /api/trading/order — the BUY / SELL / SWAP endpoint the browser calls.
//
// It quotes at the REAL BitGo price (via lib/trading/service.ts → BitGo Prime
// Trading level1) and then settles the fill in the local demo ledger, because the
// testnet Go Account is unfunded. See the BitGo trading client for the real API
// docs and links: lib/bitgo/trading.ts.
//
// Request body: { side: "buy"|"sell"|"swap", coin, amount, toCoin?, orderId? }
//   · buy  → `coin` is the crypto to acquire, `amount` is USD spent
//   · sell → `coin` is the crypto to sell, `amount` is the crypto amount
//   · swap → `coin` → `toCoin`, `amount` is the source crypto amount
// Response: { outcome: "filled", trade } | { outcome: "failed", step, message }.
export async function POST(req: Request): Promise<Response> {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const side = body?.side;
  const coin = fieldStr(body, 'coin');
  const amount = fieldStr(body, 'amount');
  const toCoinRaw = fieldStr(body, 'toCoin');
  const orderId = fieldStr(body, 'orderId') || crypto.randomUUID();

  if (!isSide(side)) return fail('quote', 'Operación inválida.');
  if (!coin || !isCoin(coin)) return fail('quote', `Activo desconocido: ${coin ?? '(vacío)'}.`);
  if (!amount) return fail('quote', 'Falta el monto.');
  const toCoin: Coin | undefined = toCoinRaw && isCoin(toCoinRaw) ? toCoinRaw : undefined;
  if (side === 'swap' && !toCoin) return fail('quote', 'El swap necesita un activo destino.');

  try {
    const trade = await execute(side, coin, amount, toCoin, orderId, new Date().toISOString());
    return Response.json({ outcome: 'filled', trade } satisfies TradeOutcome);
  } catch (e) {
    if (e instanceof InsufficientDemoFunds) return fail('settle', e.message, 'app', 400);
    const message = e instanceof Error ? e.message : String(e);
    // A pricing error comes from BitGo (level1); we propagate it with its message.
    return fail('quote', message, 'bitgo', 502);
  }
}

function fail(
  step: 'quote' | 'settle',
  message: string,
  source: 'bitgo' | 'app' = 'app',
  status = 400,
): Response {
  return Response.json({ outcome: 'failed', step, message, source } satisfies TradeOutcome, {
    status,
  });
}
