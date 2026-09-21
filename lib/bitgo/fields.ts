// lib/bitgo/fields.ts
// Lectura defensiva de respuestas sin tipar (BitGo/Express) y de cuerpos JSON de
// request. El OpenAPI no modela todas las shapes, así que en vez de castear a
// `any` en cada lugar leemos campos con guardas centralizadas acá.

/** Lee `body[key]` como string, o `undefined` si falta / no es string. */
export function fieldStr(body: unknown, key: string): string | undefined {
  const v = (body as Record<string, unknown> | null)?.[key];
  return typeof v === 'string' ? v : undefined;
}

/** Baja por una cadena de claves anidadas devolviendo `unknown` (o undefined). */
export function nested(body: unknown, ...keys: string[]): unknown {
  let cur: unknown = body;
  for (const k of keys) cur = (cur as Record<string, unknown> | null)?.[k];
  return cur;
}
