import { bitgoConfig } from '@/lib/bitgo/config';
import { bffJson } from '@/lib/bitgo/bff';
import { getAccountBalances, getWallet } from '@/lib/bitgo/reads';
import { mapAccountBalances, toDisplayBalances, withNativeSol } from '@/lib/domain/balance';

export const dynamic = 'force-dynamic';

export function GET() {
  return bffJson(async () => {
    const res = await getAccountBalances(bitgoConfig.goAccountA);
    let result = mapAccountBalances(res.data);
    // El Go Account OFC no admite depósitos SOL directos: el SOL vive en la
    // wallet nativa `tsol`. Si está configurada, sumamos su saldo on-chain.
    const solWalletId = bitgoConfig.solWalletId;
    if (solWalletId) result = withNativeSol(result, await getWallet('tsol', solWalletId));
    // Cuenta solo muestra SOL, USD y USDC (una fila por moneda, en cero si falta).
    return toDisplayBalances(result);
  });
}
