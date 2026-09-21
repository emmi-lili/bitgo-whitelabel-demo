// test/money.test.ts — criterio de salida Fase 1 (parte runtime).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  baseUnits,
  displayUnits,
  toBase,
  toDisplay,
  addBase,
  subBase,
  cmpBase,
  fromLite,
  sanitizeDecimalInput,
} from '../lib/domain/money';

test('toBase(toDisplay(x)) === x para varios montos', () => {
  const samples: Array<[string, string]> = [
    ['ofctusd', '0'],
    ['ofctusd', '100'],
    ['ofctusd', '1'],
    ['ofctusd', '999999999'],
    ['ofctusd', '-4550'],
    ['ofctbtc', '100000000'],
    ['ofctsol', '123456789'],
  ];
  for (const [coin, raw] of samples) {
    const x = baseUnits(coin as 'ofctusd', raw);
    const round = toBase(toDisplay(x));
    assert.equal(round.value, x.value, `round-trip falló para ${coin} ${raw}`);
    assert.equal(round.coin, x.coin);
  }
});

test('display ↔ base con la escala del activo (ofctusd, decimals=2)', () => {
  assert.equal(toBase(displayUnits('ofctusd', '100.00')).value, 10000n);
  assert.equal(toBase(displayUnits('ofctusd', '1')).value, 100n);
  assert.equal(toDisplay(baseUnits('ofctusd', '10000')).value, '100.00');
  assert.equal(toDisplay(baseUnits('ofctusd', '-4550')).value, '-45.50');
});

test('rechaza más decimales que el activo (SCREENS: no acepta el tercer decimal)', () => {
  assert.throws(() => displayUnits('ofctusd', '1.234'));
});

test('rechaza montos que no son enteros en base units', () => {
  assert.throws(() => baseUnits('ofctusd', '10.5'));
  assert.throws(() => baseUnits('ofctusd', 'abc'));
});

test('aritmética en base units, exacta con bigint', () => {
  const a = baseUnits('ofctusd', '10000');
  const b = baseUnits('ofctusd', '2550');
  assert.equal(addBase(a, b).value, 12550n);
  assert.equal(subBase(a, b).value, 7450n);
  assert.equal(cmpBase(a, b), 1);
});

test('operar distinto activo lanza en runtime', () => {
  const usd = baseUnits('ofctusd', '100');
  const btc = baseUnits('ofctbtc', '100');
  // Elegimos coin en runtime: esto TIPA bien (coin es dato), y salta al ejecutar.
  assert.throws(() => addBase(usd, btc), /distinto activo/);
});

test('fromLite: base pasa directo, display convierte con la escala del activo', () => {
  assert.equal(fromLite({ coin: 'ofctusd', unit: 'base', value: '10000' }).value, 10000n);
  assert.equal(fromLite({ coin: 'ofctusd', unit: 'display', value: '100.00' }).value, 10000n);
  assert.equal(fromLite({ coin: 'ofctbtc', unit: 'display', value: '1' }).value, 100000000n);
});

test('sanitizeDecimalInput: dígitos y un solo separador decimal', () => {
  assert.equal(sanitizeDecimalInput('1.2.3'), '1.23'); // descarta puntos extra
  assert.equal(sanitizeDecimalInput('12a3'), '123'); // saca no-numéricos
  assert.equal(sanitizeDecimalInput('10.50'), '10.50'); // caso normal intacto
  assert.equal(sanitizeDecimalInput('.5'), '.5'); // decimal solo
  assert.equal(sanitizeDecimalInput('1..2'), '1.2'); // puntos consecutivos
});
