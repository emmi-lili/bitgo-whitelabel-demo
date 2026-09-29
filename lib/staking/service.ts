// lib/staking/service.ts
// Orchestrates staking: the REAL reward rate (APR) from BitGo Go-Staking + demo
// SETTLEMENT in the local ledger. Same split as lib/trading/service.ts: each
// function has a single source per data type and never mixes them — the APR comes
// from lib/bitgo/staking (real), the position and its accrual from lib/demo/ledger
// (demo). The unfunded testnet account can't settle a real stake, so we settle in
// the ledger; to go fully real, call stakeReal()/unstakeReal() here instead.
import 'server-only';
import { bitgoConfig } from '../bitgo/config';
import { extractRewardRate, getStakingAttributes } from '../bitgo/staking';
import { assetOf, isStakeable, type Coin } from '../domain/assets';
import { baseUnits, displayUnits, toBase, toDisplay } from '../domain/money';
import type { MoneyLite } from '../domain/trading';
import type { StakeOutcome, StakePosition, StakingRate, StakingView } from '../domain/staking';
import {
  getBalance,
  getStake,
  InsufficientDemoFunds,
  InsufficientDemoStake,
  stakeDemo,
  unstakeDemo,
  type StakeSnapshot,
} from '../demo/ledger';

// Fallback APR used ONLY when BitGo returns no rate for the (unfunded) testnet
// account. It is surfaced with isReal=false so the UI badges it as demo — we
// never disguise a demo rate as a real one.
const DEMO_APR = '7.0';

// The single asset in scope for the MVP (docs/PLAN2.md Fase 8).
const DEFAULT_STAKE_COIN: Coin = 'ofctsol';

function money(coin: Coin, value: string): MoneyLite {
  return { coin, unit: 'display', value };
}

function displayOf(coin: Coin, base: string): MoneyLite {
  return money(coin, toDisplay(baseUnits(coin, base)).value);
}

function fail(message: string, source: 'bitgo' | 'app' = 'app'): StakeOutcome {
  return { outcome: 'failed', message, source };
}

// ── Real reward rate (with a clearly-flagged demo fallback) ──────────────────
/** The annual reward rate for an asset. Reads BitGo's staking attributes and
 *  pulls `rewardPercentageRate`; if the (unfunded) testnet account returns none —
 *  or the beta endpoint is unavailable — falls back to a demo APR flagged
 *  isReal=false so the UI can badge it. */
export async function getStakingRate(coin: Coin): Promise<StakingRate> {
  if (!isStakeable(coin)) throw new Error(`Activo no disponible para staking: ${coin}`);
  try {
    const attrs = await getStakingAttributes(bitgoConfig.goAccountA, coin);
    const apr = extractRewardRate(attrs);
    if (apr) return { coin, apr, isReal: true };
  } catch (e) {
    // Beta endpoint or empty account: fall back to the demo rate (badged).
    console.warn(`[staking] no real APR for ${coin}, using demo: ${(e as Error).message}`);
  }
  return { coin, apr: DEMO_APR, isReal: false };
}

function toPosition(coin: Coin, rate: StakingRate, snap: StakeSnapshot): StakePosition {
  const meta = assetOf(coin);
  return {
    coin,
    symbol: meta.symbol,
    glyph: meta.glyph,
    staked: displayOf(coin, snap.stakedBase),
    rewards: displayOf(coin, snap.rewardsBase),
    rate,
    stakedAt: snap.stakedAt,
  };
}

// ── The screen payload: position (demo) valued at the real APR + liquid balance ─
export async function getStakingView(
  coin: Coin = DEFAULT_STAKE_COIN,
  now: string = new Date().toISOString(),
): Promise<StakingView> {
  const rate = await getStakingRate(coin);
  const [snap, available] = await Promise.all([getStake(coin, rate.apr, now), getBalance(coin)]);
  return { position: toPosition(coin, rate, snap), available: displayOf(coin, available) };
}

// ── Execute (real APR, demo settlement in the ledger) ────────────────────────
export async function stake(coin: Coin, amount: string, now: string): Promise<StakeOutcome> {
  if (!isStakeable(coin)) return fail(`Activo no disponible para staking: ${coin}`);
  let amountBase;
  try {
    amountBase = toBase(displayUnits(coin, amount));
  } catch (e) {
    return fail(e instanceof Error ? e.message : String(e));
  }
  if (amountBase.value <= 0n) return fail('El monto debe ser mayor a cero.');

  const rate = await getStakingRate(coin);
  try {
    const snap = await stakeDemo(coin, amountBase, rate.apr, now);
    return {
      outcome: 'done',
      action: 'stake',
      position: toPosition(coin, rate, snap),
      moved: displayOf(coin, amountBase.value.toString()),
    };
  } catch (e) {
    if (e instanceof InsufficientDemoFunds) return fail(e.message);
    return fail(e instanceof Error ? e.message : String(e), 'bitgo');
  }
}

export async function unstake(coin: Coin, amount: string, now: string): Promise<StakeOutcome> {
  if (!isStakeable(coin)) return fail(`Activo no disponible para staking: ${coin}`);
  let amountBase;
  try {
    amountBase = toBase(displayUnits(coin, amount));
  } catch (e) {
    return fail(e instanceof Error ? e.message : String(e));
  }
  if (amountBase.value <= 0n) return fail('El monto debe ser mayor a cero.');

  const rate = await getStakingRate(coin);
  try {
    const { snapshot, returnedBase, claimedRewardsBase } = await unstakeDemo(
      coin,
      amountBase,
      rate.apr,
      now,
    );
    // What returns to the liquid balance: principal + auto-claimed rewards.
    const credited = (BigInt(returnedBase) + BigInt(claimedRewardsBase)).toString();
    return {
      outcome: 'done',
      action: 'unstake',
      position: toPosition(coin, rate, snapshot),
      moved: displayOf(coin, credited),
    };
  } catch (e) {
    if (e instanceof InsufficientDemoStake) return fail(e.message);
    return fail(e instanceof Error ? e.message : String(e), 'bitgo');
  }
}
