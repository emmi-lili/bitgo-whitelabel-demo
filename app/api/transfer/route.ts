import { bffJson } from '@/lib/bitgo/bff';
import { executeTransfer, transferStatusBySequenceId } from '@/lib/bitgo/transferring';
import { fieldStr } from '@/lib/bitgo/fields';
import { isCoin } from '@/lib/domain/assets';

export const dynamic = 'force-dynamic';

function validationError(sequenceId: string, message: string): Response {
  return Response.json(
    { outcome: 'failed', sequenceId, step: 'validate', message, source: 'app' },
    { status: 400 },
  );
}

// POST /api/transfer — build → firmar → send. Devuelve el desenlace (SCREENS §2).
export async function POST(req: Request): Promise<Response> {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;

  const sequenceId = fieldStr(body, 'sequenceId');
  const destinationWalletId = fieldStr(body, 'destinationWalletId');
  const coin = fieldStr(body, 'coin');
  const amount = fieldStr(body, 'amount');
  const comment = fieldStr(body, 'comment');

  if (!sequenceId)
    return validationError('', 'Falta sequenceId (debe generarlo el cliente una sola vez).');
  if (!destinationWalletId) return validationError(sequenceId, 'Falta el destino.');
  if (!coin || !isCoin(coin))
    return validationError(sequenceId, `Activo desconocido: ${coin ?? '(vacío)'}.`);
  if (!amount) return validationError(sequenceId, 'Falta el monto.');

  try {
    const outcome = await executeTransfer({
      destinationWalletId,
      coin,
      amount,
      sequenceId,
      comment,
    });
    return Response.json(outcome);
  } catch (e) {
    // Error inesperado (bug): lo reportamos honesto, sin ocultarlo.
    return Response.json(
      {
        outcome: 'failed',
        sequenceId,
        step: 'send',
        message: e instanceof Error ? e.message : String(e),
        source: 'app',
      },
      { status: 500 },
    );
  }
}

// GET /api/transfer?sequenceId=... — recuperación por timeout (SCREENS §2.4).
export async function GET(req: Request): Promise<Response> {
  const sequenceId = new URL(req.url).searchParams.get('sequenceId');
  if (!sequenceId)
    return Response.json({ error: 'Falta sequenceId', source: 'app' }, { status: 400 });
  return bffJson(() => transferStatusBySequenceId(sequenceId));
}
