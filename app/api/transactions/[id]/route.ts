import { bitgoConfig } from '@/lib/bitgo/config';
import { bffJson } from '@/lib/bitgo/bff';
import { getWalletTransfer } from '@/lib/bitgo/reads';
import { mapTransfer } from '@/lib/domain/transaction';

export const dynamic = 'force-dynamic';

export function GET(_req: Request, { params }: { params: { id: string } }): Promise<Response> {
  return bffJson(async () => {
    const transfer = await getWalletTransfer(bitgoConfig.goAccountA, params.id);
    const tx = mapTransfer(transfer);
    if (!tx) throw new Error('Activo no soportado en este movimiento.');
    return tx;
  });
}
