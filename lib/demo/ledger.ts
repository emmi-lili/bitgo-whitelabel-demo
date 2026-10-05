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
import { accruedRewardBase, elapsedSeconds } from '../domain/staking';

// Initial demo balance (display units). Chosen for a comfortable demo: a good
// USD cushion to buy with and some of each crypto to sell/swap.
const SEED: Partial<Record<Coin, string>> = {
  ofctusd: '10000',
  ofctusdc: '500',
  ofctbtc: '0.05',
  ofcteth: '0.5',
  ofctsol: '25',
};

// A staking position in the demo ledger. `rewards` is CHECKPOINTED base units:
// pending accrual since `stakedAt` is computed live (see snapshot()) and only
// folded in on a mutation. `stakedAt` is the last checkpoint, null when idle.
interface StakeState {
  staked: string; // base units currently staked
  rewards: string; // base units of accrued (unclaimed) rewards, checkpointed
  stakedAt: string | null; // ISO of the last accrual checkpoint
}

interface LedgerFile {
  balances: Record<string, string>; // coin → base units (string)
  trades: TradeRecord[];
  staking: Record<string, StakeState>; // coin → staking position
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
  return { balances, trades: [], staking: {}, seededAt: new Date().toISOString() };
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
    // Staking was added after the first ledgers were written; a file from before
    // simply starts with no positions (nothing staked).
    if (!cache.staking || typeof cache.staking !== 'object') cache.staking = {};
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

/** Lookup de una operación demo por id (detalle de movimiento). */
export async function getTrade(id: string): Promise<TradeRecord | null> {
  const f = await load();
  return f.trades.find((t) => t.id === id) ?? null;
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

// ── Staking (demo settlement, APR supplied by the caller) ─────────────────────
// The ledger stores staked principal + checkpointed rewards; the REAL APR comes
// from BitGo and is passed in by lib/staking/service.ts (mocks never fetch real
// data here — constitution). Rewards accrue lazily: pending accrual is computed
// from `stakedAt` on read and only folded into the stored `rewards` on a
// mutation, using the BigInt math in lib/domain/staking.ts.

export class InsufficientDemoStake extends Error {
  constructor(coin: Coin) {
    super(`No hay suficiente ${coin.replace('ofct', '').toUpperCase()} en staking.`);
    this.name = 'InsufficientDemoStake';
  }
}

/** A read-only view of a staking position, with rewards including live accrual. */
export interface StakeSnapshot {
  coin: Coin;
  stakedBase: string; // base units currently staked
  rewardsBase: string; // base units accrued (checkpoint + pending)
  stakedAt: string | null;
}

function stakeStateOf(f: LedgerFile, coin: Coin): StakeState {
  const st = f.staking[coin] ?? { staked: '0', rewards: '0', stakedAt: null };
  f.staking[coin] = st;
  return st;
}

/** Rewards accrued since the last checkpoint, in base units (0 when idle). */
function pendingReward(st: StakeState, apr: string, now: string): bigint {
  if (!st.stakedAt) return 0n;
  return accruedRewardBase(BigInt(st.staked), apr, elapsedSeconds(st.stakedAt, now));
}

/** Fold pending accrual into stored rewards and re-anchor the checkpoint at now.
 *  Call before any change to the staked amount so accrual uses the old figures. */
function checkpoint(st: StakeState, apr: string, now: string): void {
  st.rewards = (BigInt(st.rewards) + pendingReward(st, apr, now)).toString();
  st.stakedAt = BigInt(st.staked) > 0n ? now : null;
}

function snapshot(st: StakeState, coin: Coin, apr: string, now: string): StakeSnapshot {
  return {
    coin,
    stakedBase: st.staked,
    rewardsBase: (BigInt(st.rewards) + pendingReward(st, apr, now)).toString(),
    stakedAt: st.stakedAt,
  };
}

/** Current staking position, with rewards including live (uncheckpointed) accrual. */
export async function getStake(coin: Coin, apr: string, now: string): Promise<StakeSnapshot> {
  const f = await load();
  return snapshot(stakeStateOf(f, coin), coin, apr, now);
}

/** Stake `amount` (base units): move it liquid → staked. Throws if the liquid
 *  balance is short. Accrual is checkpointed first so the old amount earns up to
 *  now, then the new principal starts earning from now. */
export async function stakeDemo(
  coin: Coin,
  amount: BaseMoney,
  apr: string,
  now: string,
): Promise<StakeSnapshot> {
  const f = await load();
  if (!gteBase(bal(f, coin), amount)) throw new InsufficientDemoFunds(coin);
  const st = stakeStateOf(f, coin);
  checkpoint(st, apr, now);
  f.balances[coin] = subBase(bal(f, coin), amount).value.toString();
  st.staked = (BigInt(st.staked) + amount.value).toString();
  st.stakedAt = now;
  await persist();
  return snapshot(st, coin, apr, now);
}

/** Unstake `amount` (base units): move it staked → liquid AND claim all accrued
 *  rewards to liquid in the same move (auto-claim on exit keeps value conserved
 *  and the demo satisfying). Throws if the staked amount is short. */
export async function unstakeDemo(
  coin: Coin,
  amount: BaseMoney,
  apr: string,
  now: string,
): Promise<{ snapshot: StakeSnapshot; returnedBase: string; claimedRewardsBase: string }> {
  const f = await load();
  const st = stakeStateOf(f, coin);
  if (!gteBase(baseUnits(coin, st.staked), amount)) throw new InsufficientDemoStake(coin);
  checkpoint(st, apr, now);
  const claimed = BigInt(st.rewards);
  st.staked = subBase(baseUnits(coin, st.staked), amount).value.toString();
  st.rewards = '0';
  const credit = amount.value + claimed; // principal returned + rewards claimed
  f.balances[coin] = addBase(bal(f, coin), baseUnits(coin, credit)).value.toString();
  st.stakedAt = BigInt(st.staked) > 0n ? now : null;
  await persist();
  return {
    snapshot: snapshot(st, coin, apr, now),
    returnedBase: amount.value.toString(),
    claimedRewardsBase: claimed.toString(),
  };
}

/** Reset the ledger to the seeded balance (to restart a demo). */
export async function resetLedger(): Promise<void> {
  cache = seed();
  await persist();
}
