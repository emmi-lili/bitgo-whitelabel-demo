import { bffJson } from '@/lib/bitgo/bff';
import { getPortfolio } from '@/lib/trading/service';
import { listTrades } from '@/lib/demo/ledger';

export const dynamic = 'force-dynamic';

// GET /api/trading/portfolio — demo balances valued at the real price + demo trades.
export function GET() {
  return bffJson(async () => {
    const [portfolio, trades] = await Promise.all([getPortfolio(), listTrades(20)]);
    return { ...portfolio, trades };
  });
}
