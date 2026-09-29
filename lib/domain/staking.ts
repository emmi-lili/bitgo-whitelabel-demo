// lib/domain/staking.ts
// DeFi / staking domain: types shared between the BFF and the UI, plus the
// reward-accrual arithmetic. Like pricing.ts and money.ts, the math NEVER uses
// `number` or `parseFloat`: the staked amount is BigInt base units, the APR is a
// decimal string, and rewards are computed with BigInt and truncated at the end.
//
// Model (demo settlement, real APR):
//   reward_base = staked_base × (apr% ) × elapsed / year
// where apr is a percentage (e.g. "7" = 7%). Rounding is TRUNCATED (floor toward
// zero) — we never credit more reward than the elapsed time earned.
import type { Coin } from './assets';
import type { MoneyLite } from './trading';
import { parseDec } from './pricing';

// A conventional staking year: 365 days. Rewards are a demo approximation, so a
// fixed second count keeps the math deterministic and testable.
export const SECONDS_PER_YEAR = 31_536_000n;

function pow10(n: number): bigint {
  return 10n ** BigInt(n);
}

/** Reward accrued on a staked amount, in BASE units, truncated toward zero.
 *  `stakedBase` and the result are base units of the SAME coin; `aprPercent` is a
 *  percentage string ("7", "7.25"); `elapsedSeconds` is the staking duration. */
export function accruedRewardBase(
  stakedBase: bigint,
  aprPercent: string,
  elapsedSeconds: bigint,
): bigint {
  if (stakedBase <= 0n || elapsedSeconds <= 0n) return 0n;
  const apr = parseDec(aprPercent); // { digits, scale }; validates the string
  if (apr.digits <= 0n) return 0n;
  // value = staked × (apr.digits / 10^apr.scale / 100) × (elapsed / SECONDS_PER_YEAR)
  const num = stakedBase * apr.digits * elapsedSeconds;
  const den = pow10(apr.scale) * 100n * SECONDS_PER_YEAR;
  return num / den; // BigInt division truncates toward zero
}

/** Whole seconds between two ISO timestamps (never negative). Time, not money —
 *  so `number` here is fine; the reward math stays in BigInt. */
export function elapsedSeconds(fromIso: string, toIso: string): bigint {
  const ms = Date.parse(toIso) - Date.parse(fromIso);
  if (!Number.isFinite(ms) || ms <= 0) return 0n;
  return BigInt(Math.floor(ms / 1000));
}

// ── Views (the boundary the BFF returns; MoneyLite = Money without the brand) ──

/** The reward rate for an asset. `isReal` distinguishes a rate read from BitGo
 *  from the clearly-badged demo fallback used when the (empty) testnet account
 *  returns none — the UI shows the difference, never disguises it. */
export interface StakingRate {
  coin: Coin;
  /** Annual percentage, as a decimal string ("7", "7.25"). */
  apr: string;
  isReal: boolean;
}

/** A staking position in the demo ledger, valued with the real APR. */
export interface StakePosition {
  coin: Coin;
  symbol: string;
  glyph: string;
  /** Amount currently staked (display units). */
  staked: MoneyLite;
  /** Rewards accrued so far (display units), checkpoint + live accrual. */
  rewards: MoneyLite;
  rate: StakingRate;
  /** ISO of the last accrual checkpoint, or null when nothing is staked. */
  stakedAt: string | null;
}

/** Everything the /stake screen needs in one payload. */
export interface StakingView {
  position: StakePosition;
  /** Liquid balance available to stake (display units, same coin). */
  available: MoneyLite;
}

/** Outcome of a stake / unstake, mirroring the trading TradeOutcome shape. */
export type StakeAction = 'stake' | 'unstake';

export type StakeOutcome =
  | { outcome: 'done'; action: StakeAction; position: StakePosition; moved: MoneyLite }
  | { outcome: 'failed'; message: string; source?: 'bitgo' | 'app' };
