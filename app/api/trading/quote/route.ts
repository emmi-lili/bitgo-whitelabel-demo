import { bffJson } from '@/lib/bitgo/bff';
import { isCoin, type Coin } from '@/lib/domain/assets';
import { quote } from '@/lib/trading/service';
import type { TradeSide } from '@/lib/domain/trading';

export const dynamic = 'force-dynamic';

function isSide(x: string | null): x is TradeSide {
  return x === 'buy' || x === 'sell' || x === 'swap';
}

// GET /api/trading/quote?side=buy&coin=ofctbtc&amount=100[&toCoin=ofctsol]
// Returns a quote at the REAL price, without settling.
export function GET(req: Request) {
  const u = new URL(req.url);
  const side = u.searchParams.get('side');
  const coin = u.searchParams.get('coin');
  const amount = u.searchParams.get('amount');
  const toCoinRaw = u.searchParams.get('toCoin');

  if (!isSide(side))
    return Response.json({ error: 'side inválido', source: 'app' }, { status: 400 });
  if (!coin || !isCoin(coin))
    return Response.json({ error: `Activo desconocido: ${coin}`, source: 'app' }, { status: 400 });
  if (!amount) return Response.json({ error: 'Falta amount', source: 'app' }, { status: 400 });
  const toCoin: Coin | undefined = toCoinRaw && isCoin(toCoinRaw) ? toCoinRaw : undefined;

  return bffJson(() => quote(side, coin, amount, toCoin));
}
