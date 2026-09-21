// lib/demo/ledger.ts
// 🟡 DEMO. The testnet Go Account has a 0 balance and there is no faucet for a
// trading balance, so the SETTLEMENT of buy/sell/swap happens in this local
// seeded ledger. The PRICES are real (BitGo level1); what's simulated is the
// settlement. It lives apart from any BitGo response (constitution: mocks never
// mix with real data in the same function) and the UI ALWAYS shows it with a demo
// badge. Minimal persistence: a JSON file under .data/, just like transfers.
import 'server-only';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Coin } from '../domain/assets';
import { COINS } from '../domain/assets';
import {
  addBase,
  baseUnits,
  displayUnits,
  fromLite,
  gteBase,
  subBase,
  toBase,
  type BaseMoney,
} from '../domain/money';
import type { TradeRecord } from '../domain/trading';

// Initial demo balance (display units). Chosen for a comfortable demo: a good
// USD cushion to buy with and some of each crypto to sell/swap.
const SEED: Partial<Record<Coin, string>> = {
  ofctusd: '10000',
  ofctusdc: '500',
  ofctbtc: '0.05',
  ofcteth: '0.5',
  ofctsol: '25',
};

interface LedgerFile {
  balances: Record<string, string>; // coin → base units (string)
  trades: TradeRecord[];
  seededAt: string;
}

const FILE = path.join(process.cwd(), '.data', 'ledger.json');
let cache: LedgerFile | null = null;

function seed(): LedgerFile {
  const balances: Record<string, string> = {};
  for (const coin of COINS) {
    const s = SEED[coin];
    balances[coin] = s ? toBase(displayUnits(coin, s)).value.toString() : '0';
  }
  return { balances, trades: [], seededAt: new Date().toISOString() };
}

/** Guarda de forma: un archivo corrupto o de otra versión no debe romper la app
 *  ni dejar `balances[coin]` en undefined. Si no valida, se reseedea. */
function isLedgerFile(v: unknown): v is LedgerFile {
  if (!v || typeof v !== 'object') return false;
  const f = v as Partial<LedgerFile>;
  return (
    !!f.balances &&
    typeof f.balances === 'object' &&
    Array.isArray(f.trades) &&
    typeof f.seededAt === 'string'
  );
}

async function load(): Promise<LedgerFile> {
  if (cache) return cache;
  try {
    const parsed: unknown = JSON.parse(await fs.readFile(FILE, 'utf8'));
    if (!isLedgerFile(parsed)) throw new Error('ledger.json con forma inválida');
    cache = parsed;
    // A new coin (e.g. ofcteth added later) starts out seeded all the same.
    for (const coin of COINS) {
      if (cache.balances[coin] === undefined) {
        const s = SEED[coin];
        cache.balances[coin] = s ? toBase(displayUnits(coin, s)).value.toString() : '0';
      }
    }
  } catch {
    cache = seed();
    await persist();
  }
  return cache;
}

async function persist(): Promise<void> {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(cache ?? seed(), null, 2));
}

function bal(f: LedgerFile, coin: Coin): BaseMoney {
  return baseUnits(coin, f.balances[coin] ?? '0');
}

export interface LedgerBalance {
  coin: Coin;
  base: string;
}

export async function getBalances(): Promise<LedgerBalance[]> {
  const f = await load();
  return COINS.map((coin) => ({ coin, base: f.balances[coin] ?? '0' }));
}

export async function getBalance(coin: Coin): Promise<string> {
  const f = await load();
  return f.balances[coin] ?? '0';
}

export async function listTrades(limit?: number): Promise<TradeRecord[]> {
  const f = await load();
  const sorted = [...f.trades].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return limit ? sorted.slice(0, limit) : sorted;
}

export class InsufficientDemoFunds extends Error {
  constructor(coin: Coin) {
    super(`Saldo demo insuficiente de ${coin.replace('ofct', '').toUpperCase()}.`);
    this.name = 'InsufficientDemoFunds';
  }
}

/** Settle a trade in the ledger: debit `paid`, credit `received`, save the
 *  record. Atomic with respect to the file (a single write). Throws if short. */
export async function settleTrade(
  input: Omit<TradeRecord, 'id' | 'createdAt'> & { id: string; createdAt: string },
): Promise<TradeRecord> {
  const f = await load();
  const payCoin = input.paid.coin;
  const recvCoin = input.received.coin;
  const payAmt = fromLite(input.paid);
  const recvAmt = fromLite(input.received);

  if (!gteBase(bal(f, payCoin), payAmt)) throw new InsufficientDemoFunds(payCoin);

  f.balances[payCoin] = subBase(bal(f, payCoin), payAmt).value.toString();
  f.balances[recvCoin] = addBase(bal(f, recvCoin), recvAmt).value.toString();

  const record: TradeRecord = { ...input };
  f.trades.push(record);
  await persist();
  return record;
}

/** Reset the ledger to the seeded balance (to restart a demo). */
export async function resetLedger(): Promise<void> {
  cache = seed();
  await persist();
}
