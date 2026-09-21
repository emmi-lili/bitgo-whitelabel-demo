import { bitgoConfig } from '@/lib/bitgo/config';

export const dynamic = 'force-dynamic';

// Destinos conocidos (lista corta, no campo libre: pegar un walletId a mano es
// una fuente de errores irrecuperables — SCREENS §1.1). En el MVP, la Cuenta B.
export function GET(): Response {
  const destinations: Array<{ id: string; label: string }> = [];
  if (bitgoConfig.goAccountB) destinations.push({ id: bitgoConfig.goAccountB, label: 'Cuenta B' });
  return Response.json({ destinations });
}
