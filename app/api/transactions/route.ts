import { bitgoConfig } from '@/lib/bitgo/config';
import { bffJson } from '@/lib/bitgo/bff';
import { listWalletTransfers } from '@/lib/bitgo/reads';
import { mapTransfers } from '@/lib/domain/transaction';

export const dynamic = 'force-dynamic';

export function GET(req: Request) {
  const url = new URL(req.url);
  const limitRaw = url.searchParams.get('limit');
  const typeRaw = url.searchParams.get('type');

  // Cota dura: un `limit` gigante (o 0) no debe llegar a BitGo. 1..500.
  const limit =
    limitRaw && /^\d+$/.test(limitRaw) ? Math.min(Math.max(Number(limitRaw), 1), 500) : undefined;
  const type = typeRaw === 'send' || typeRaw === 'receive' ? typeRaw : undefined;

  return bffJson(async () => {
    const res = await listWalletTransfers(bitgoConfig.goAccountA, { limit, type });
    return mapTransfers(res.transfers);
  });
}
