import { fieldStr } from '@/lib/bitgo/fields';
import { bffJson } from '@/lib/bitgo/bff';
import { isCoin, type Coin } from '@/lib/domain/assets';
import { getStakingView, stake, unstake } from '@/lib/staking/service';
import type { StakeOutcome } from '@/lib/domain/staking';

export const dynamic = 'force-dynamic';

// GET /api/staking — SOL staking position (demo) valued at BitGo's real APR,
// plus the liquid balance available to stake. See lib/staking/service.ts.
export function GET() {
  return bffJson(() => getStakingView());
}

// POST /api/staking — stake or unstake. It reads the REAL APR from BitGo and
// settles the movement in the local demo ledger, because the testnet Go Account
// is unfunded (see lib/bitgo/staking.ts for the real API and links).
//
// Body: { action: "stake" | "unstake", coin?, amount }
// Response: { outcome: "done", action, position, moved } | { outcome: "failed", message }.
export async function POST(req: Request): Promise<Response> {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const action = body?.action;
  const amount = fieldStr(body, 'amount');
  const coinRaw = fieldStr(body, 'coin');
  const coin: Coin = coinRaw && isCoin(coinRaw) ? coinRaw : 'ofctsol';

  if (action !== 'stake' && action !== 'unstake') return fail('Operación inválida.');
  if (!amount) return fail('Falta el monto.');

  const now = new Date().toISOString();
  const result =
    action === 'stake' ? await stake(coin, amount, now) : await unstake(coin, amount, now);
  const status = result.outcome === 'done' ? 200 : result.source === 'bitgo' ? 502 : 400;
  return Response.json(result, { status });
}

function fail(message: string): Response {
  return Response.json({ outcome: 'failed', message, source: 'app' } satisfies StakeOutcome, {
    status: 400,
  });
}
