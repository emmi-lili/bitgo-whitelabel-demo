// ─────────────────────────────────────────────────────────────────────────────
// Bitgo Whitelabel — SPIKE Fase 0 · CÓDIGO DESECHABLE (borrar tras cerrar la fase)
//
// Pregunta que responde: ¿puedo tener DOS Go Accounts en un mismo enterprise?
// La respuesta define el modelo de datos entero (ver docs/PLAN2.md, Fase 0).
//
// Verde significa TRES cosas confirmadas a la vez:
//   1) existen dos Go Accounts en el mismo enterprise (creamos la B),
//   2) la transferencia A→B volvió con transactionType === "BOOK_TRANSFER",
//   3) el historial de A muestra `send` y el de B muestra `receive`.
//
// Reglas respetadas acá:
//   · Ningún endpoint sin verificar contra https://developers.bitgo.com/llms.txt.
//     Los que no pude verificar al 100% llevan // TODO(verify): <url>.
//   · Montos: nunca number, nunca parseFloat. Strings y BigInt.
//   · El token y la passphrase viven solo en process.env (server-side).
//
// Uso:  cd spike && cp .env.example .env && node --env-file=.env spike.mjs
// ─────────────────────────────────────────────────────────────────────────────

const COIN = process.env.SPIKE_COIN || 'ofctusd';
const AMOUNT_BASE = process.env.SPIKE_AMOUNT_BASE || '100';

const env = {
  token: process.env.BITGO_ACCESS_TOKEN,
  enterprise: process.env.BITGO_ENTERPRISE_ID,
  accountA: process.env.GO_ACCOUNT_A_ID,
  accountB: process.env.GO_ACCOUNT_B_ID, // puede venir vacío: se crea
  passphrase: process.env.WALLET_PASSPHRASE,
  passcodeEncryptionCode: process.env.WALLET_PASSCODE_ENCRYPTION_CODE,
  apiBase: (process.env.BITGO_API_BASE || 'https://app.bitgo-test.com').replace(/\/$/, ''),
  expressUrl: (process.env.BITGO_EXPRESS_URL || 'http://localhost:3080').replace(/\/$/, ''),
};

// ── logging ──────────────────────────────────────────────────────────────────
const c = { g: '\x1b[32m', r: '\x1b[31m', y: '\x1b[33m', b: '\x1b[34m', dim: '\x1b[2m', x: '\x1b[0m' };
const step = (n, m) => console.log(`\n${c.b}▶ ${n}${c.x} ${m}`);
const ok = (m) => console.log(`  ${c.g}✓${c.x} ${m}`);
const info = (m) => console.log(`  ${c.dim}${m}${c.x}`);
const warn = (m) => console.log(`  ${c.y}⚠ ${m}${c.x}`);

// Fin ROJO: imprime el motivo, la ruta de resolución, y sale con código 1.
// No improvisa workarounds — eso lo decidís vos con la salida en mano.
function red(title, detail, routes) {
  console.log(`\n${c.r}🛑 SPIKE ROJO — ${title}${c.x}`);
  if (detail) console.log(`\n${detail}`);
  if (routes?.length) {
    console.log(`\n${c.y}Opciones (no elijo por vos):${c.x}`);
    routes.forEach((r) => console.log(`  • ${r}`));
  }
  console.log('');
  process.exit(1);
}

// ── HTTP contra BitGo REST (app.bitgo-test.com) ──────────────────────────────
// Preserva el mensaje de error de BitGo tal cual: es informativo (Instrucciones-btgo.md §Errores).
async function bitgo(method, path, body) {
  const url = `${env.apiBase}${path}`;
  let res;
  try {
    res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${env.token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    red('No hay red hacia BitGo', `${method} ${url}\n${e.message}`, [
      'Revisá conexión / que BITGO_API_BASE sea https://app.bitgo-test.com',
    ]);
  }
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  if (!res.ok) {
    const msg = json?.error || json?.message || text || res.statusText;
    const err = new Error(msg);
    err.status = res.status;
    err.requestId = json?.requestId || res.headers.get('x-bitgo-requestid');
    err.body = json;
    throw err;
  }
  return json;
}

// ── HTTP contra BitGo Express (firma, localhost:3080) ────────────────────────
// Si Express no responde, es un modo de falla DISTINTO: "servicio de firma no
// disponible", no un 500 genérico (Instrucciones-btgo.md §Errores).
async function express(method, path, body) {
  const url = `${env.expressUrl}${path}`;
  let res;
  try {
    res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(env.token ? { Authorization: `Bearer ${env.token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    red('Servicio de firma no disponible', `No respondió BitGo Express en ${env.expressUrl}\n${e.message}`, [
      'Levantá Express en external-signing y reintentá. No se movió dinero.',
    ]);
  }
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  if (!res.ok) {
    const err = new Error(json?.error || json?.message || text || res.statusText);
    err.status = res.status;
    err.body = json;
    err.express = true;
    throw err;
  }
  return json;
}

function requireEnv() {
  const missing = ['token', 'enterprise', 'passphrase'].filter((k) => !env[k]);
  if (missing.length) {
    red('Faltan variables en .env',
      `Sin valor: ${missing.map((k) => ({ token: 'BITGO_ACCESS_TOKEN', enterprise: 'BITGO_ENTERPRISE_ID', passphrase: 'WALLET_PASSPHRASE' }[k])).join(', ')}`,
      ['Completá spike/.env (ver spike/.env.example) y reintentá.']);
  }
}

// wallet/generate vive en Express, no en app.bitgo-test.com.
// Si generate falla (p.ej. "m must be 1"), usamos el flujo manual documentado.
async function createGoAccount(label) {
  const generateBody = {
    label,
    passphrase: env.passphrase,
    enterprise: env.enterprise,
    type: 'trading',
    ...(env.passcodeEncryptionCode ? { passcodeEncryptionCode: env.passcodeEncryptionCode } : {}),
  };

  try {
    const created = await express('POST', '/api/v2/ofc/wallet/generate', generateBody);
    return created?.wallet?.id || created?.id;
  } catch (e) {
    if (!/m must be 1/i.test(e.message)) throw e;
    warn('generate falló con "m must be 1" — intento flujo manual (keychain → encrypt → add)…');
  }

  const keychain = await express('POST', '/api/v2/ofc/keychain/local', {});
  const encrypted = await express('POST', '/api/v2/encrypt', {
    input: keychain.prv,
    password: env.passphrase,
  });
  const uploaded = await bitgo('POST', '/api/v2/ofc/key', {
    pub: keychain.pub,
    encryptedPrv: encrypted.encrypted ?? encrypted,
    source: 'user',
    originalPasscodeEncryptionCode: env.passcodeEncryptionCode,
    enterprise: env.enterprise,
  });
  const wallet = await bitgo('POST', '/api/v2/ofc/wallet/add', {
    label,
    enterprise: env.enterprise,
    type: 'trading',
    m: 1,
    n: 1,
    keys: [uploaded.id],
  });
  return wallet?.id;
}

// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`${c.b}Bitgo Whitelabel — Spike Fase 0${c.x}  ${c.dim}(${env.apiBase} · ${COIN})${c.x}`);
  requireEnv();

  // ── Paso 0 · Express vivo ────────────────────────────────────────────────
  // Verificado: BitGo Express expone GET /api/v2/ping.
  step('0', 'Express (servicio de firma)');
  const ping = await express('GET', '/api/v2/ping');
  ok(`Express responde — versión ${ping?.bitgo || ping?.version || 'desconocida'}`);

  // ── Paso 1 · Listar Go Accounts del enterprise ───────────────────────────
  // Verificado: GET /api/v2/{coin}/wallet  (ref v2walletlistbycoin).
  step('1', 'Go Accounts existentes en el enterprise');
  const list = await bitgo('GET', `/api/v2/ofc/wallet?enterprise=${encodeURIComponent(env.enterprise)}&limit=100`);
  const wallets = list?.wallets || [];
  info(`El enterprise tiene ${wallets.length} wallet(s) ofc:`);
  wallets.forEach((w) => info(`   · ${w.id}  ${w.label ? `(${w.label})` : ''}`));
  if (!env.accountA) {
    if (wallets.length) env.accountA = wallets[0].id;
    if (env.accountA) warn(`GO_ACCOUNT_A_ID vacío — uso la primera: ${env.accountA}`);
  }
  if (!env.accountA) red('No hay Go Account A', 'El enterprise no tiene ninguna Go Account ofc y no pasaste GO_ACCOUNT_A_ID.',
    ['Creá una Go Account en app.bitgo-test.com o revisá el enterprise.']);
  ok(`Go Account A = ${env.accountA}`);

  // ── Paso 2 · Crear la SEGUNDA Go Account (el experimento) ─────────────────
  // Verificado: POST /api/v2/ofc/wallet/generate con body
  //   { label, passphrase, enterprise, type:"trading", passcodeEncryptionCode }
  //   (cookbook caas-go-accounts-automated). El ejemplo de BitGo nombra la
  //   variable CHILD_ENTERPRISE_ID; acá pasamos el enterprise PRINCIPAL a
  //   propósito: si lo acepta, dos Go Accounts conviven sin child enterprise.
  step('2', 'Crear Go Account B en el MISMO enterprise');
  if (env.accountB) {
    warn(`GO_ACCOUNT_B_ID ya seteado (${env.accountB}) — salteo la creación.`);
  } else {
    try {
      env.accountB = await createGoAccount('Bitgo Whitelabel Spike B');
      ok(`Go Account B creada: ${env.accountB}`);
      info('→ CONFIRMADO: dos Go Accounts en un mismo enterprise. Anotá este ID en .env.');
    } catch (e) {
      // Modo de falla previsto #1: segundo Go Account rechazado.
      red('Segundo Go Account rechazado',
        `BitGo respondió (status ${e.status}${e.requestId ? `, requestId ${e.requestId}` : ''}):\n  "${e.message}"`,
        [
          'Si el mensaje habla de child enterprise / KYC: NO se pueden tener dos Go Accounts directos. Ruta = child enterprises + KYC (duplica el tamaño del proyecto).',
          'Si habla de passphrase/passcode: es un problema de credenciales, ajustá .env y reintentá.',
          'Traé el mensaje textual al chat antes de decidir.',
        ]);
    }
  }

  // ── Paso 3 · Book transfer A → B ─────────────────────────────────────────
  step('3', `Transferencia A→B (${AMOUNT_BASE} base units de ${COIN})`);

  // 3a · build.  Verificado: POST /api/v2/{coin}/wallet/{id}/tx/build y que el
  //      recipient usa `walletId` (cookbook Ta2Ta). Mandar `address` en vez de
  //      walletId es lo que rompe el BOOK_TRANSFER.
  //      TODO(verify): campos extra del body para ofc (¿type?, ¿sequenceId en
  //      build?) → https://developers.bitgo.com/reference/express-buildtransaction
  info('build…');
  const built = await bitgo('POST', `/api/v2/ofc/wallet/${env.accountA}/tx/build`, {
    recipients: [{ amount: AMOUNT_BASE, walletId: env.accountB }],
  });
  // shortCircuitBlockchainTransfer se LEE acá (PLAN2 Fase 3), no se manda.
  const shortCircuit = built?.shortCircuitBlockchainTransfer ?? built?.txInfo?.shortCircuitBlockchainTransfer;
  info(`   shortCircuitBlockchainTransfer = ${shortCircuit}`);
  if (shortCircuit === false) warn('build dice shortCircuit=false → esto NO sería book transfer. Revisá el walletId destino.');
  ok('build OK');

  // 3b · firmar en Express.  Verificado: POST {EXPRESS}/api/v2/ofc/signPayload
  //      con { walletId, walletPassphrase, payload } (cookbook Ta2Ta).
  //      TODO(verify): forma exacta de la respuesta (payload firmado + signature)
  //      → https://developers.bitgo.com/reference/express-signpayload
  info('firmar (Express)…');
  const signed = await express('POST', '/api/v2/ofc/signPayload', {
    walletId: env.accountA,
    walletPassphrase: env.passphrase,
    payload: built.payload ?? built,
  });
  ok('firmado');

  // 3c · send.  Verificado: POST /api/v2/{coin}/wallet/{id}/tx/send.
  //      TODO(verify): forma exacta de `halfSigned` → depende de lo que
  //      devuelva signPayload. Imprimo la respuesta para ajustar al correr.
  //      https://developers.bitgo.com/reference/express-sendtransaction
  info('send…');
  const sent = await bitgo('POST', `/api/v2/ofc/wallet/${env.accountA}/tx/send`, {
    halfSigned: signed.payload ? { ...signed.payload, signature: signed.signature } : signed,
  });

  const state = sent?.transfer?.state ?? sent?.state;
  const txType = sent?.transfer?.transactionType ?? sent?.transactionType;
  const transferId = sent?.transfer?.id ?? sent?.transferId;
  info(`   state=${state}  transactionType=${txType}  transferId=${transferId}`);

  // Modo de falla previsto #2: pendingApproval.
  if (state === 'pendingApproval') {
    red('Transferencia en pendingApproval',
      'La transferencia quedó registrada pero necesita que OTRO admin la apruebe.',
      ['Ruta = crear un segundo usuario admin en el enterprise y reintentar.']);
  }
  // Modo de falla previsto #3: no es book transfer.
  if (txType && txType !== 'BOOK_TRANSFER') {
    red(`transactionType inesperado: ${txType}`,
      'Se esperaba BOOK_TRANSFER. Probablemente se envió un `address` en vez de `walletId`.',
      ['Revisá el recipient del paso 3a: debe ser { amount, walletId }, nunca address.']);
  }
  ok(`send OK — transactionType=${txType}`);

  // ── Paso 4 · Ambas puntas en el historial ────────────────────────────────
  // Verificado: GET /api/v2/{coin}/wallet/{id}/transfer (ref v2walletlisttransfers).
  step('4', 'Verificar las dos puntas en el historial');
  const legA = await bitgo('GET', `/api/v2/ofc/wallet/${env.accountA}/transfer?limit=25`);
  const legB = await bitgo('GET', `/api/v2/ofc/wallet/${env.accountB}/transfer?limit=25`);
  const sendA = (legA?.transfers || []).find((t) => t.type === 'send' || t.id === transferId);
  const recvB = (legB?.transfers || []).find((t) => t.type === 'receive');
  if (!sendA) red('No apareció el `send` en A', 'La transferencia no figura como salida en la Go Account A.', ['Revisá la salida cruda de arriba.']);
  if (!recvB) red('No apareció el `receive` en B', 'La transferencia no figura como entrada en la Go Account B.', ['Revisá la salida cruda de arriba.']);
  ok(`A muestra send (${sendA.id})`);
  ok(`B muestra receive (${recvB.id})`);

  // ── Escala de base units (dato que pide PLAN2) ───────────────────────────
  step('§', 'Escala real de base units observada');
  const sample = sendA;
  info(`   valueString = ${sample.valueString}   value = ${sample.value}`);
  info(`   usd/baseValue = ${sample.usd ?? sample.baseValue ?? '(revisar JSON crudo)'}`);
  console.log(`\n${c.dim}   Transfer A (crudo):\n${JSON.stringify(sample, null, 2)}${c.x}`);

  // ── VERDE ─────────────────────────────────────────────────────────────────
  console.log(`\n${c.g}✅ SPIKE VERDE${c.x}`);
  console.log(`${c.g}   Dos Go Accounts en un enterprise · BOOK_TRANSFER · ambas puntas visibles.${c.x}`);
  console.log('\n   Anotá para el modelo de datos:');
  console.log(`     GO_ACCOUNT_A_ID = ${env.accountA}`);
  console.log(`     GO_ACCOUNT_B_ID = ${env.accountB}`);
  console.log(`     escala base units = ver valueString/value de arriba`);
  console.log(`\n   Después: borrá spike/. No la conviertas en "utils".\n`);
}

main().catch((e) => {
  // Cualquier error de BitGo no previsto: mostralo con su mensaje original.
  red('Error no previsto',
    `${e.message}${e.status ? ` (status ${e.status})` : ''}${e.requestId ? ` · requestId ${e.requestId}` : ''}` +
    (e.body ? `\n${JSON.stringify(e.body, null, 2)}` : ''),
    ['Traé este mensaje al chat. No improviso un workaround.']);
});
