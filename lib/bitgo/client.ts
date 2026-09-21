// lib/bitgo/client.ts
// Cliente HTTP tipado. Habla BitGo, devuelve JSON de BitGo. No sabe nada de UI.
// Preserva el mensaje de error de BitGo tal cual (Instrucciones-btgo.md §Errores).
import 'server-only';
import { bitgoConfig } from './config';

export type BitGoSource = 'bitgo' | 'express' | 'app';

/** Error que arrastra el mensaje original de BitGo + de dónde vino. El BFF lo
 *  mapea a { error, requestId, source } sin reemplazar el texto. */
export class BitGoError extends Error {
  readonly status?: number;
  readonly requestId?: string;
  readonly source: BitGoSource;
  readonly body?: unknown;

  constructor(
    message: string,
    opts: { status?: number; requestId?: string; source: BitGoSource; body?: unknown },
  ) {
    super(message);
    this.name = 'BitGoError';
    this.status = opts.status;
    this.requestId = opts.requestId;
    this.source = opts.source;
    this.body = opts.body;
  }
}

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface RawError {
  error?: string;
  message?: string;
  requestId?: string;
}

async function readBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { raw: text };
  }
}

function messageFrom(body: unknown, fallback: string): string {
  const b = body as RawError | undefined;
  return b?.error || b?.message || fallback;
}

/** Llamada a BitGo REST (app.bitgo-test.com) con Bearer. */
export async function bitgoFetch<T = unknown>(
  method: Method,
  path: string,
  body?: unknown,
): Promise<T> {
  const url = `${bitgoConfig.apiBase}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${bitgoConfig.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
    });
  } catch (e) {
    throw new BitGoError('No se pudo contactar a BitGo', { source: 'bitgo', body: String(e) });
  }
  const parsed = await readBody(res);
  if (!res.ok) {
    throw new BitGoError(messageFrom(parsed, res.statusText), {
      status: res.status,
      requestId:
        (parsed as RawError)?.requestId || res.headers.get('x-bitgo-requestid') || undefined,
      source: 'bitgo',
      body: parsed,
    });
  }
  return parsed as T;
}

/** Como bitgoFetch pero NO lanza en 4xx: devuelve { status, body } para poder
 *  ramificar (p.ej. 202 pendingApproval vs 400 DuplicateSequenceIdError en el
 *  send). Solo lanza si no hay red hacia BitGo. */
export async function bitgoFetchRaw(
  method: Method,
  path: string,
  body?: unknown,
): Promise<{ status: number; body: unknown }> {
  const url = `${bitgoConfig.apiBase}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${bitgoConfig.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
    });
  } catch (e) {
    throw new BitGoError('No se pudo contactar a BitGo', { source: 'bitgo', body: String(e) });
  }
  return { status: res.status, body: await readBody(res) };
}

/** Llamada a BitGo Express (firma, localhost:3080). Si no responde, es un modo
 *  de falla distinto: "servicio de firma no disponible", no un 500 genérico. */
export async function expressFetch<T = unknown>(
  method: Method,
  path: string,
  body?: unknown,
): Promise<T> {
  const url = `${bitgoConfig.expressUrl}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
    });
  } catch (e) {
    throw new BitGoError('El servicio de firma no responde. No se movió dinero.', {
      source: 'express',
      body: String(e),
    });
  }
  const parsed = await readBody(res);
  if (!res.ok) {
    throw new BitGoError(messageFrom(parsed, res.statusText), {
      status: res.status,
      source: 'express',
      body: parsed,
    });
  }
  return parsed as T;
}
