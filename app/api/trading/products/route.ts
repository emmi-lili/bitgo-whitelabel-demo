import { bffJson } from '@/lib/bitgo/bff';
import { getTradableAssets } from '@/lib/trading/service';

export const dynamic = 'force-dynamic';

// GET /api/trading/products — tradable assets with live price (real level1).
export function GET() {
  return bffJson(async () => ({ assets: await getTradableAssets() }));
}
