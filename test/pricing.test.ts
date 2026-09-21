// test/pricing.test.ts — buy/sell/swap quoting with BigInt (no float).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { quoteBuy, quoteSell, quoteSwap, valueInUsd, parseDec } from '../lib/domain/pricing';
import { toBase } from '../lib/domain/money';

test('quoteBuy: USD → asset by dividing by the ask, truncated to the asset decimals', () => {
  // 100 USD at 50000 USD/BTC = 0.002 BTC exactly.
  assert.equal(quoteBuy('100', '50000', 'ofctbtc').value, '0.00200000');
  // 5 USD at 110.68078193 USD/SOL = 0.04517496… SOL, truncated to 9 decimals.
  assert.equal(quoteBuy('5', '110.68078193', 'ofctsol').value, '0.045174960');
  // Round down: we never promise more.
  assert.equal(quoteBuy('1', '3', 'ofctusd').value, '0.33');
});

test('quoteSell: asset → USD by multiplying by the bid, to 2 USD decimals', () => {
  // 0.5 BTC at 81078.88 USD/BTC = 40539.44 USD.
  assert.equal(quoteSell('0.5', '81078.88').value, '40539.44');
  // 10 SOL at 110.21940507 = 1102.1940507 → 1102.19 (truncates).
  assert.equal(quoteSell('10', '110.21940507').value, '1102.19');
});

test('valueInUsd: portfolio valuation', () => {
  assert.equal(valueInUsd('0.05', '80000').value, '4000.00');
  assert.equal(valueInUsd('0', '80000').value, '0.00');
});

test('quoteSwap: A→USD→B using the bid of what I sell and the ask of what I buy', () => {
  // Sell 1 ETH at bid 2000 → 2000 USD; buy BTC at ask 40000 → 0.05 BTC.
  const { usd, received } = quoteSwap('1', '2000', '40000', 'ofctbtc');
  assert.equal(usd.value, '2000.00');
  assert.equal(received.value, '0.05000000');
});

test('the quote result converts to base units without loss', () => {
  const got = quoteBuy('100', '50000', 'ofctbtc'); // 0.00200000 BTC
  assert.equal(toBase(got).value, 200000n); // 0.002 * 1e8
});

test('rejects zero or negative price', () => {
  assert.throws(() => quoteBuy('100', '0', 'ofctbtc'), /Precio inválido/);
  assert.throws(() => quoteSell('1', '-5'), /Precio inválido/);
});

test('parseDec validates decimal form', () => {
  assert.deepEqual(parseDec('12.34'), { digits: 1234n, scale: 2 });
  assert.deepEqual(parseDec('-0.5'), { digits: -5n, scale: 1 });
  assert.throws(() => parseDec('1.2.3'));
});
