// test/money.typecheck.ts — criterio de salida Fase 1 (parte compilación).
//
// Este archivo NO se ejecuta: lo valida `tsc --noEmit`. Cada `@ts-expect-error`
// afirma "esta línea DEBE fallar en compilación". Si alguna dejara de fallar
// (porque el tipo Money se aflojó), tsc marca el @ts-expect-error como no usado
// y el typecheck falla. Ese es, literal, el criterio de PLAN2:
// "el compilador rechaza sumar base con display; si no falla, el tipo está mal".

import {
  baseUnits,
  displayUnits,
  toBase,
  toDisplay,
  addBase,
  type BaseMoney,
  type DisplayMoney,
} from '../lib/domain/money';

const b: BaseMoney = baseUnits('ofctusd', '10000'); // base
const d: DisplayMoney = displayUnits('ofctusd', '100.00'); // display

// ── Lo que DEBE fallar ───────────────────────────────────────────────────────

// @ts-expect-error — no se puede sumar base con display.
addBase(b, d);

// @ts-expect-error — un DisplayMoney no es asignable a BaseMoney.
const _1: BaseMoney = d;

// @ts-expect-error — un BaseMoney no es asignable a DisplayMoney.
const _2: DisplayMoney = b;

// @ts-expect-error — toBase espera DisplayMoney, no BaseMoney (doble conversión bloqueada).
toBase(b);

// @ts-expect-error — toDisplay espera BaseMoney, no DisplayMoney.
toDisplay(d);

// @ts-expect-error — no se puede construir un Money a mano (marca nominal privada).
const _4: BaseMoney = { coin: 'ofctusd', unit: 'base', value: 5n };

// ── Lo que DEBE compilar (conversión explícita y visible) ────────────────────
const okSum = addBase(b, toBase(d));
void okSum;
void _1;
void _2;
void _4;
