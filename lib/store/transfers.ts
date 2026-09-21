// lib/store/transfers.ts
// Persistencia mínima de transferencias por sequenceId. NO es un mock de BitGo:
// es estado de la app. Se persiste ANTES de la primera llamada (SCREENS §1.3),
// para poder recuperarse de un timeout sin arriesgar un doble movimiento.
// MVP: un JSON en disco. En producción sería una tabla.
import 'server-only';
import { promises as fs } from 'node:fs';
import path from 'node:path';

export type TransferStatus =
  'building' | 'signing' | 'sending' | 'accepted' | 'pendingApproval' | 'failed' | 'duplicate';

export interface StoredTransfer {
  sequenceId: string;
  status: TransferStatus;
  coin: string;
  amountBase: string; // base units, string (nunca number)
  destinationWalletId: string;
  createdAt: string;
  updatedAt: string;
  state?: string;
  transferId?: string;
  step?: string;
  error?: string;
}

const FILE = path.join(process.cwd(), '.data', 'transfers.json');

let cache: Record<string, StoredTransfer> | null = null;

async function load(): Promise<Record<string, StoredTransfer>> {
  if (cache) return cache;
  try {
    const parsed: unknown = JSON.parse(await fs.readFile(FILE, 'utf8'));
    // Nos quedamos solo con las entradas bien formadas: un archivo corrupto no
    // debe tirar la app ni inyectar registros sin sequenceId/status.
    cache = {};
    if (parsed && typeof parsed === 'object') {
      for (const [key, rec] of Object.entries(parsed as Record<string, unknown>)) {
        if (isStoredTransfer(rec)) cache[key] = rec;
      }
    }
  } catch {
    cache = {};
  }
  return cache;
}

function isStoredTransfer(v: unknown): v is StoredTransfer {
  const r = v as Partial<StoredTransfer> | null;
  return !!r && typeof r.sequenceId === 'string' && typeof r.status === 'string';
}

async function persist(): Promise<void> {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(cache ?? {}, null, 2));
}

export async function getStored(sequenceId: string): Promise<StoredTransfer | undefined> {
  return (await load())[sequenceId];
}

export async function putStored(rec: StoredTransfer): Promise<void> {
  const c = await load();
  c[rec.sequenceId] = rec;
  await persist();
}

export async function patchStored(
  sequenceId: string,
  patch: Partial<StoredTransfer>,
): Promise<void> {
  const c = await load();
  const cur = c[sequenceId];
  if (!cur) return;
  c[sequenceId] = { ...cur, ...patch, updatedAt: new Date().toISOString() };
  await persist();
}
