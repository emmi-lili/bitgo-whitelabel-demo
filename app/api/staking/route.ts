import { bffJson } from '@/lib/bitgo/bff';
import { getStakingView } from '@/lib/staking/service';

export const dynamic = 'force-dynamic';

// GET /api/staking — SOL staking position (demo) valued at BitGo's real APR,
// plus the liquid balance available to stake. See lib/staking/service.ts.
export function GET() {
  return bffJson(() => getStakingView());
}
