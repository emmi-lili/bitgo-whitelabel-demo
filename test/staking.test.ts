// test/staking.test.ts — reward accrual with BigInt (no float).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { accruedRewardBase, elapsedSeconds, SECONDS_PER_YEAR } from '../lib/domain/staking';

// 1 SOL in base units (9 decimals) = 1e9.
const ONE_SOL = 1_000_000_000n;

test('accruedRewardBase: a full year at 7% APR yields 7% of the stake', () => {
  // 100 SOL staked a whole year at 7% → 7 SOL = 7e9 base units, exactly.
  const staked = 100n * ONE_SOL;
  assert.equal(accruedRewardBase(staked, '7', SECONDS_PER_YEAR), 7n * ONE_SOL);
});

test('accruedRewardBase: half a year at 8% is half the annual reward', () => {
  const staked = 10n * ONE_SOL; // 10 SOL
  const halfYear = SECONDS_PER_YEAR / 2n;
  // 8% of 10 SOL = 0.8 SOL/yr → 0.4 SOL over half a year.
  assert.equal(accruedRewardBase(staked, '8', halfYear), 400_000_000n);
});

test('accruedRewardBase: fractional APR ("7.25") is handled without float', () => {
  const staked = 100n * ONE_SOL;
  // 7.25% of 100 SOL for a year = 7.25 SOL.
  assert.equal(accruedRewardBase(staked, '7.25', SECONDS_PER_YEAR), 7_250_000_000n);
});

test('accruedRewardBase: truncates toward zero, never over-credits', () => {
  // 1 base unit staked for one second at 7% rounds down to 0 (no fabricated dust).
  assert.equal(accruedRewardBase(1n, '7', 1n), 0n);
  // A day of 1 SOL at 5%: 1e9 * 5 * 86400 / (100 * 31_536_000) = 136_986 (floored).
  assert.equal(accruedRewardBase(ONE_SOL, '5', 86_400n), 136_986n);
});

test('accruedRewardBase: no stake, no time, or non-positive APR earns nothing', () => {
  assert.equal(accruedRewardBase(0n, '7', SECONDS_PER_YEAR), 0n);
  assert.equal(accruedRewardBase(ONE_SOL, '7', 0n), 0n);
  assert.equal(accruedRewardBase(ONE_SOL, '0', SECONDS_PER_YEAR), 0n);
});

test('elapsedSeconds: whole seconds, clamped at zero for non-forward ranges', () => {
  assert.equal(elapsedSeconds('2026-01-01T00:00:00.000Z', '2026-01-01T00:01:00.000Z'), 60n);
  assert.equal(elapsedSeconds('2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'), 0n);
  // Backwards in time never yields a negative (or any) reward window.
  assert.equal(elapsedSeconds('2026-01-02T00:00:00.000Z', '2026-01-01T00:00:00.000Z'), 0n);
});
