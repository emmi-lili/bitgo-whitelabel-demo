'use client';
import { useCallback, useEffect, useState } from 'react';

export interface ApiError {
  message: string;
  source?: 'bitgo' | 'express' | 'app';
  requestId?: string;
}

export interface ApiState<T> {
  loading: boolean;
  data?: T;
  error?: ApiError;
  reload: () => void;
}

/** fetch + parseo defensivo del JSON en un solo lugar. Devuelve status y body
 *  crudo (parseado) sin decidir por el llamador: algunos endpoints devuelven un
 *  cuerpo con sentido incluso en 4xx (p.ej. `{ outcome: 'failed' }`). Un cuerpo
 *  no-JSON cae a `{}`. Los errores de red (o AbortError) se propagan. */
export async function fetchJson<T>(
  path: string,
  init?: RequestInit,
): Promise<{ ok: boolean; status: number; body: T }> {
  const res = await fetch(path, init);
  const body = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, status: res.status, body };
}

function normalizeError(body: unknown, status: number): ApiError {
  const b = body as { error?: string; source?: ApiError['source']; requestId?: string } | null;
  // Express caído es un modo de falla distinto (SCREENS §5).
  if (b?.source === 'express') {
    return {
      message: b.error ?? 'El servicio de firma no responde.',
      source: 'express',
      requestId: b.requestId,
    };
  }
  return { message: b?.error ?? `Error ${status}`, source: b?.source, requestId: b?.requestId };
}

export function useApi<T>(path: string): ApiState<T> {
  const [state, setState] = useState<{ loading: boolean; data?: T; error?: ApiError }>({
    loading: true,
  });
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let alive = true;
    setState({ loading: true });
    (async () => {
      try {
        const { ok, status, body } = await fetchJson<T>(path);
        if (!alive) return;
        if (!ok) setState({ loading: false, error: normalizeError(body, status) });
        else setState({ loading: false, data: body });
      } catch {
        if (alive)
          setState({
            loading: false,
            error: { message: 'No se pudo cargar. Revisá tu conexión.' },
          });
      }
    })();
    return () => {
      alive = false;
    };
  }, [path, nonce]);

  return { ...state, reload };
}
