// lib/bitgo/bff.ts
// Helper del BFF: ejecuta el trabajo y, si algo falla, devuelve el error de
// BitGo/Express con su mensaje original (Instrucciones-btgo.md §Errores):
//   { error, requestId, source: 'bitgo' | 'express' | 'app' }
import 'server-only';
import { BitGoError } from './client';

export async function bffJson(work: () => Promise<unknown>): Promise<Response> {
  try {
    return Response.json(await work());
  } catch (e) {
    if (e instanceof BitGoError) {
      // Express caído es un modo de falla distinto: lo marcamos 503 para que la
      // UI diga "servicio de firma no disponible" y no un 500 genérico.
      const status = e.source === 'express' ? 503 : (e.status ?? 502);
      return Response.json(
        { error: e.message, requestId: e.requestId, source: e.source },
        { status },
      );
    }
    const message = e instanceof Error ? e.message : String(e);
    return Response.json({ error: message, source: 'app' }, { status: 500 });
  }
}
