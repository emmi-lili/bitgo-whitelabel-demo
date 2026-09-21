// lib/bitgo/transferring.ts
// Orquestación de la transferencia (book transfer A→B): build → firmar → send,
// con sequenceId persistido ANTES del build y verificación de
// shortCircuitBlockchainTransfer ANTES de firmar (PLAN2 Fase 3).
import 'server-only';
import { bitgoConfig } from './config';
import { BitGoError, bitgoFetch, bitgoFetchRaw, expressFetch } from './client';
import { getStored, patchStored, putStored } from '../store/transfers';
import { displayUnits, toBase } from '../domain/money';
import { fieldStr, nested } from './fields';
import type {
  TransferInput,
  TransferOutcome,
  TransferStatusResult,
  TransferStep,
} from '../domain/transfer';

// El OpenAPI no modela el build result de OFC; estas shapes vienen de
// HalfSignedGoWithdrawal + del spike verde de esta sesión.
interface OfcBuildResult {
  payload?: unknown;
  shortCircuitBlockchainTransfer?: boolean;
  txInfo?: { shortCircuitBlockchainTransfer?: boolean };
}
interface OfcSignResult {
  payload?: Record<string, unknown>;
  signature?: string;
}

const OFC = 'ofc';

/** state del send: puede venir en `status` (top-level) o en `transfer.state`. */
function stateOf(body: unknown): string | undefined {
  return (
    fieldStr(body, 'status') ??
    (typeof nested(body, 'transfer', 'state') === 'string'
      ? (nested(body, 'transfer', 'state') as string)
      : undefined)
  );
}

function fail(sequenceId: string, step: TransferStep, e: unknown): TransferOutcome {
  if (e instanceof BitGoError) {
    return { outcome: 'failed', sequenceId, step, message: e.message, source: e.source };
  }
  return {
    outcome: 'failed',
    sequenceId,
    step,
    message: e instanceof Error ? e.message : String(e),
    source: 'app',
  };
}

export async function executeTransfer(input: TransferInput): Promise<TransferOutcome> {
  const { sequenceId, coin, destinationWalletId } = input;
  const src = bitgoConfig.goAccountA;

  // ── Idempotencia (doble clic que sobrevive a un refresh / reintento) ──────
  const prev = await getStored(sequenceId);
  if (prev) {
    if (prev.status === 'accepted')
      return {
        outcome: 'accepted',
        sequenceId,
        state: prev.state ?? 'signed',
        transferId: prev.transferId,
      };
    if (prev.status === 'pendingApproval') return { outcome: 'pendingApproval', sequenceId };
    if (prev.status === 'duplicate') return { outcome: 'duplicate', sequenceId };
    if (prev.status === 'failed')
      return {
        outcome: 'failed',
        sequenceId,
        step: (prev.step as TransferStep) ?? 'send',
        message: prev.error ?? 'Falló',
        source: 'app',
      };
    // building/signing/sending → hay uno en curso con este seq.
    return { outcome: 'duplicate', sequenceId };
  }

  // ── Validación de monto (input de usuario → base units, estricto) ─────────
  let amountBase;
  try {
    amountBase = toBase(displayUnits(coin, input.amount));
  } catch (e) {
    return fail(sequenceId, 'validate', e);
  }
  if (amountBase.value <= 0n) {
    return {
      outcome: 'failed',
      sequenceId,
      step: 'validate',
      message: 'El monto debe ser mayor a cero.',
      source: 'app',
    };
  }
  const amountStr = amountBase.value.toString();

  // ── Persistir ANTES de la primera llamada (red de seguridad del timeout) ──
  const now = new Date().toISOString();
  await putStored({
    sequenceId,
    status: 'building',
    coin,
    amountBase: amountStr,
    destinationWalletId,
    createdAt: now,
    updatedAt: now,
    step: 'build',
  });

  // ── 1) BUILD ──────────────────────────────────────────────────────────────
  let built: OfcBuildResult;
  try {
    // recipient = walletId (NO address): mandar address rompería el book transfer.
    built = await bitgoFetch<OfcBuildResult>('POST', `/api/v2/${OFC}/wallet/${src}/tx/build`, {
      recipients: [{ amount: amountStr, walletId: destinationWalletId }],
      ...(input.comment ? { comment: input.comment } : {}),
    });
  } catch (e) {
    await patchStored(sequenceId, {
      status: 'failed',
      step: 'build',
      error: e instanceof Error ? e.message : String(e),
    });
    return fail(sequenceId, 'build', e);
  }

  const payload = built.payload ?? built;
  const shortCircuit =
    built.shortCircuitBlockchainTransfer ??
    built.txInfo?.shortCircuitBlockchainTransfer ??
    (nested(payload, 'shortCircuitBlockchainTransfer') as boolean | undefined);

  // ── Verificar el flag ANTES de firmar (PLAN2) ─────────────────────────────
  if (shortCircuit !== true) {
    const msg = 'La transferencia no es un movimiento interno (book transfer). No se firmó.';
    await patchStored(sequenceId, { status: 'failed', step: 'build', error: msg });
    return { outcome: 'failed', sequenceId, step: 'build', message: msg, source: 'app' };
  }

  // ── 2) FIRMAR en Express ──────────────────────────────────────────────────
  await patchStored(sequenceId, { status: 'signing', step: 'sign' });
  let signed: OfcSignResult;
  try {
    signed = await expressFetch<OfcSignResult>('POST', '/api/v2/ofc/signPayload', {
      walletId: src,
      walletPassphrase: bitgoConfig.walletPassphrase,
      payload,
    });
  } catch (e) {
    // Express caído: no se movió dinero. Mensaje propio (SCREENS §2.3).
    await patchStored(sequenceId, {
      status: 'failed',
      step: 'sign',
      error: e instanceof Error ? e.message : String(e),
    });
    return fail(sequenceId, 'sign', e);
  }
  const halfSigned = signed.payload ? { ...signed.payload, signature: signed.signature } : signed;

  // ── 3) SEND (sequenceId acá: BitGo deduplica el doble clic) ───────────────
  await patchStored(sequenceId, { status: 'sending', step: 'send' });
  let res: { status: number; body: unknown };
  try {
    res = await bitgoFetchRaw('POST', `/api/v2/${OFC}/wallet/${src}/tx/send`, {
      halfSigned,
      sequenceId,
    });
  } catch (e) {
    await patchStored(sequenceId, {
      status: 'failed',
      step: 'send',
      error: e instanceof Error ? e.message : String(e),
    });
    return fail(sequenceId, 'send', e);
  }

  const state = stateOf(res.body);

  // 202 o state pendingApproval → requiere otro admin (§2.2)
  if (res.status === 202 || state === 'pendingApproval') {
    await patchStored(sequenceId, {
      status: 'pendingApproval',
      step: 'send',
      state: 'pendingApproval',
    });
    return { outcome: 'pendingApproval', sequenceId, approvalId: fieldStr(res.body, 'id') };
  }

  // 4xx → puede ser doble clic (DuplicateSequenceIdError) u otro fallo
  if (res.status >= 400) {
    const name = fieldStr(res.body, 'name');
    if (name === 'DuplicateSequenceIdError') {
      await patchStored(sequenceId, { status: 'duplicate', step: 'send' });
      return { outcome: 'duplicate', sequenceId };
    }
    const message =
      fieldStr(res.body, 'error') ??
      fieldStr(res.body, 'message') ??
      `Falló el envío (${res.status})`;
    await patchStored(sequenceId, { status: 'failed', step: 'send', error: message });
    return { outcome: 'failed', sequenceId, step: 'send', message, source: 'bitgo' };
  }

  // 200 → aceptada. Para un book transfer, `signed` ya significa hecho (§2.1).
  const transactionType =
    fieldStr(res.body, 'transactionType') ??
    fieldStr(nested(res.body, 'transfer'), 'transactionType');
  const transferId = fieldStr(nested(res.body, 'transfer'), 'id') ?? fieldStr(res.body, 'transfer');
  const txid = fieldStr(res.body, 'txid');
  if (transactionType && transactionType !== 'BOOK_TRANSFER') {
    console.warn(`[transfer] transactionType inesperado: ${transactionType} (seq ${sequenceId})`);
  }
  await patchStored(sequenceId, {
    status: 'accepted',
    step: 'send',
    state: state ?? 'signed',
    transferId,
  });
  return {
    outcome: 'accepted',
    sequenceId,
    state: state ?? 'signed',
    transactionType,
    transferId,
    txid,
  };
}

/** Recuperación por timeout (§2.4): ¿la transferencia entró? Consulta por
 *  sequenceId. Si existe, entró; si 404, no entró y se puede reintentar. */
export async function transferStatusBySequenceId(
  sequenceId: string,
): Promise<TransferStatusResult> {
  const src = bitgoConfig.goAccountA;
  const res = await bitgoFetchRaw(
    'GET',
    `/api/v2/${OFC}/wallet/${src}/transfer/sequenceId/${encodeURIComponent(sequenceId)}`,
  );
  if (res.status === 200) {
    const state = stateOf(res.body) ?? 'signed';
    const transferId = fieldStr(res.body, 'id') ?? fieldStr(nested(res.body, 'transfer'), 'id');
    return { outcome: 'accepted', sequenceId, state, transferId };
  }
  return { outcome: 'notProcessed', sequenceId };
}
