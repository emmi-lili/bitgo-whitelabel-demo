// lib/bitgo/config.ts
// Configuración server-side. El token y demás secretos se leen de process.env
// y NUNCA se serializan al cliente. `server-only` hace fallar el build si este
// módulo entra en un bundle de navegador.
import 'server-only';

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Falta la variable de entorno ${name}`);
  return v;
}

// Getters: no explota al importar (build time), solo cuando se usa de verdad.
export const bitgoConfig = {
  get accessToken(): string {
    return required('BITGO_ACCESS_TOKEN');
  },
  get enterpriseId(): string {
    return required('BITGO_ENTERPRISE_ID');
  },
  /** Go Account A: origen de lecturas y transferencias. Confirmada en el spike.
   *  Asumimos que su id sirve como walletId (v2) y como accountId (prime trading);
   *  si prime trading devuelve 404, es señal de que difieren. */
  get goAccountA(): string {
    return required('GO_ACCOUNT_A_ID');
  },
  get goAccountB(): string | undefined {
    return process.env.GO_ACCOUNT_B_ID || undefined;
  },
  /** Wallet nativa de Solana testnet (coin `tsol`). Su saldo on-chain se muestra
   *  en Cuenta junto a los balances OFC: el Go Account no admite depósitos SOL
   *  directos, así que el SOL vive acá hasta un eventual settlement. Opcional:
   *  si no está seteada, no se consulta y Cuenta solo muestra los balances OFC. */
  get solWalletId(): string | undefined {
    return process.env.TSOL_WALLET_ID || undefined;
  },
  /** Passphrase de la wallet. Solo la usa el BFF para firmar vía Express.
   *  Nunca se serializa al cliente. */
  get walletPassphrase(): string {
    return required('WALLET_PASSPHRASE');
  },
  get apiBase(): string {
    return (process.env.BITGO_API_BASE || 'https://app.bitgo-test.com').replace(/\/$/, '');
  },
  get expressUrl(): string {
    return (process.env.BITGO_EXPRESS_URL || 'http://localhost:3080').replace(/\/$/, '');
  },
};
