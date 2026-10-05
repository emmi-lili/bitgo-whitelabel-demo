import { bitgoConfig } from '@/lib/bitgo/config';
import { bffJson } from '@/lib/bitgo/bff';
import { BitGoError } from '@/lib/bitgo/client';
import { getWalletTransfer } from '@/lib/bitgo/reads';
import { getTrade } from '@/lib/demo/ledger';
import { mapTradeAsTransaction, mapTransfer } from '@/lib/domain/transaction';

export const dynamic = 'force-dynamic';

export function GET(_req: Request, { params }: { params: { id: string } }): Promise<Response> {
  return bffJson(async () => {
    // Primero el ledger demo (compras/ventas/swaps); si no, BitGo.
    const trade = await getTrade(params.id);
    if (trade) return mapTradeAsTransaction(trade);

    try {
      const transfer = await getWalletTransfer(bitgoConfig.goAccountA, params.id);
      const tx = mapTransfer(transfer);
      if (!tx) throw new Error('Activo no soportado en este movimiento.');
      return tx;
    } catch (e) {
      if (e instanceof BitGoError && e.status === 404) {
        throw new Error('Movimiento no encontrado.');
      }
      throw e;
    }
  });
}
