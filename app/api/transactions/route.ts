import { bitgoConfig } from '@/lib/bitgo/config';
import { bffJson } from '@/lib/bitgo/bff';
import { listWalletTransfers } from '@/lib/bitgo/reads';
import { listTrades } from '@/lib/demo/ledger';
import {
  mapTradesAsTransactions,
  mapTransfers,
  type Transaction,
} from '@/lib/domain/transaction';

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
    // Fuentes separadas (constitución): BitGo transfers vs trades del ledger demo.
    // Se combinan acá, en el BFF, ya mapeadas a dominio.
    const [bitgo, trades] = await Promise.all([
      listWalletTransfers(bitgoConfig.goAccountA, {
        // Pedimos de más a BitGo: al mezclar con trades el slice final aplica el limit.
        limit: limit ? Math.min(limit * 2, 500) : undefined,
        type,
      }),
      listTrades(),
    ]);

    const fromBitgo = mapTransfers(bitgo.transfers);
    let fromTrades = mapTradesAsTransactions(trades);

    // El filtro nativo type=send|receive también aplica a las operaciones demo.
    if (type === 'receive') fromTrades = fromTrades.filter((t) => t.direction === 'in');
    if (type === 'send') fromTrades = fromTrades.filter((t) => t.direction === 'out');

    const merged: Transaction[] = [...fromBitgo.transactions, ...fromTrades].sort((a, b) =>
      a.date < b.date ? 1 : a.date > b.date ? -1 : 0,
    );

    return {
      transactions: limit ? merged.slice(0, limit) : merged,
      unmapped: fromBitgo.unmapped,
    };
  });
}
