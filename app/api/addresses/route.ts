import { bitgoConfig } from '@/lib/bitgo/config';
import { bffJson } from '@/lib/bitgo/bff';
import { listWalletAddresses } from '@/lib/bitgo/reads';
import { mapAddresses } from '@/lib/domain/address';

export const dynamic = 'force-dynamic';

export function GET() {
  return bffJson(async () => {
    const res = await listWalletAddresses(bitgoConfig.goAccountA);
    return { addresses: mapAddresses(res.addresses) };
  });
}
