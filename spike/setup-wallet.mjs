// Crea una Go Account nueva vía BitGo Express (flujo manual) y escribe spike/.env
// Uso: cd spike && node --env-file=.env.example setup-wallet.mjs

import crypto from 'crypto';
import { readFileSync, writeFileSync } from 'fs';

const token = process.env.BITGO_ACCESS_TOKEN;
const enterprise = process.env.BITGO_ENTERPRISE_ID;
const existingWalletId = process.env.GO_ACCOUNT_A_ID || '';
const expressUrl = (process.env.BITGO_EXPRESS_URL || 'http://localhost:3080').replace(/\/$/, '');
const apiBase = (process.env.BITGO_API_BASE || 'https://app.bitgo-test.com').replace(/\/$/, '');

if (!token || !enterprise) {
  console.error('Faltan BITGO_ACCESS_TOKEN o BITGO_ENTERPRISE_ID en el entorno.');
  process.exit(1);
}

const passphrase = crypto.randomBytes(24).toString('base64url');
const passcodeEncryptionCode = crypto.randomBytes(16).toString('base64url');

const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
};

async function expressPost(path, body) {
  const res = await fetch(`${expressUrl}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(json?.error || json?.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.requestId = json?.requestId;
    throw err;
  }
  return json;
}

async function bitgoPost(path, body) {
  const res = await fetch(`${apiBase}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(json?.error || json?.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.requestId = json?.requestId;
    throw err;
  }
  return json;
}

async function bitgoDelete(path) {
  const res = await fetch(`${apiBase}${path}`, { method: 'DELETE', headers });
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  if (!res.ok) {
    const err = new Error(json?.error || json?.message || text || `HTTP ${res.status}`);
    err.status = res.status;
    err.requestId = json?.requestId;
    throw err;
  }
  return json;
}

try {
  // BitGo limita a 1 offchain wallet por enterprise; hay que borrar la existente primero.
  if (existingWalletId) {
    console.log(`0/4 Eliminando Go Account existente (${existingWalletId})…`);
    try {
      await bitgoDelete(`/api/v2/ofc/wallet/${existingWalletId}`);
      console.log('  Go Account anterior eliminada');
    } catch (e) {
      if (e.status === 404) {
        console.log('  (no existía — sigo)');
      } else {
        throw new Error(
          `No pude eliminar la Go Account existente (${e.status}: ${e.message}). ` +
          'Borrala manualmente en app.bitgo-test.com y reintentá.',
        );
      }
    }
  }

  // Flujo manual BitGo: keychain local → encrypt → upload key → wallet/add
  // https://developers.bitgo.com/docs/crypto-as-a-service-go-accounts
  console.log('1/4 Generando keychain local (Express)…');
  const keychain = await expressPost('/api/v2/ofc/keychain/local', {});

  console.log('2/4 Encriptando clave privada con passphrase nueva…');
  const encrypted = await expressPost('/api/v2/encrypt', {
    input: keychain.prv,
    password: passphrase,
  });

  console.log('3/4 Subiendo key a BitGo…');
  const uploaded = await bitgoPost('/api/v2/ofc/key', {
    pub: keychain.pub,
    encryptedPrv: encrypted.encrypted ?? encrypted,
    source: 'user',
    originalPasscodeEncryptionCode: passcodeEncryptionCode,
    enterprise,
  });

  console.log('4/4 Creando Go Account (wallet/add)…');
  const wallet = await bitgoPost('/api/v2/ofc/wallet/add', {
    label: 'Bitgo Whitelabel Spike A',
    enterprise,
    type: 'trading',
    m: 1,
    n: 1,
    keys: [uploaded.id],
  });

  const walletId = wallet?.id;
  if (!walletId) {
    console.error('La respuesta no incluyó wallet id');
    process.exit(1);
  }

  const envContent = readFileSync('.env.example', 'utf8')
    .replace(/^GO_ACCOUNT_A_ID=.*$/m, `GO_ACCOUNT_A_ID=${walletId}`)
    .replace(/^GO_ACCOUNT_B_ID=.*$/m, 'GO_ACCOUNT_B_ID=')
    .replace(/^WALLET_PASSPHRASE=.*$/m, `WALLET_PASSPHRASE=${passphrase}`)
    .replace(/^WALLET_PASSCODE_ENCRYPTION_CODE=.*$/m, `WALLET_PASSCODE_ENCRYPTION_CODE=${passcodeEncryptionCode}`);

  writeFileSync('.env', envContent, { mode: 0o600 });

  console.log('\nGo Account creada y guardada en spike/.env');
  console.log(`  GO_ACCOUNT_A_ID = ${walletId}`);
  console.log('  WALLET_PASSPHRASE y WALLET_PASSCODE_ENCRYPTION_CODE → ver spike/.env');
} catch (e) {
  console.error(`\nError (${e.status || '?'}): ${e.message}`);
  if (e.requestId) console.error(`requestId: ${e.requestId}`);
  process.exit(1);
}
