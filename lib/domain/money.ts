// lib/domain/money.ts
// El ÚNICO módulo que convierte unidades. Nadie más multiplica ni divide montos.
//
// Reglas (Instrucciones-btgo.md §Dinero):
//   · Nunca `number`, nunca `parseFloat`. Montos = `bigint` (base) o `string` (display).
//   · El tipo lleva la unidad adentro para que el compilador frene la mezcla.
//   · Aritmética solo sobre base units, y solo entre el mismo coin.

import type { Coin } from './assets';
import { assetOf } from './assets';
import type { MoneyLite } from './trading';

// Marca nominal privada al módulo: la única forma de obtener un Money es pasar
// por los constructores de acá. Un object literal externo no es asignable.
declare const BRAND: unique symbol;

export type Unit = 'base' | 'display';

export interface Money<U extends Unit = Unit> {
  readonly [BRAND]: U;
  readonly coin: Coin;
  readonly unit: U;
  readonly value: U extends 'base' ? bigint : string;
}

export type BaseMoney = Money<'base'>;
export type DisplayMoney = Money<'display'>;

// ── construcción interna ─────────────────────────────────────────────────────
function base(coin: Coin, value: bigint): BaseMoney {
  return { coin, unit: 'base', value } as unknown as BaseMoney;
}
function display(coin: Coin, value: string): DisplayMoney {
  return { coin, unit: 'display', value } as unknown as DisplayMoney;
}

// ── validación de strings (sin number, sin parseFloat) ───────────────────────
function parseIntegerString(s: string): bigint {
  const t = s.trim();
  if (!/^-?\d+$/.test(t)) throw new Error(`Monto base inválido: "${s}" (se esperaba entero)`);
  return BigInt(t);
}

/** Decimal string → bigint en base units. Rechaza más decimales que el activo. */
function decimalToBigInt(s: string, decimals: number): bigint {
  const t = s.trim();
  if (!/^-?\d+(\.\d+)?$/.test(t)) throw new Error(`Monto display inválido: "${s}"`);
  const neg = t.startsWith('-');
  const [intPart, fracPart = ''] = t.replace(/^-/, '').split('.');
  if (fracPart.length > decimals) {
    throw new Error(`"${s}" tiene ${fracPart.length} decimales; el activo admite ${decimals}`);
  }
  const digits = intPart + fracPart.padEnd(decimals, '0');
  const v = BigInt(digits || '0');
  return neg ? -v : v;
}

/** bigint base units → decimal string canónico con `decimals` posiciones. */
function bigIntToDecimal(v: bigint, decimals: number): string {
  const neg = v < 0n;
  const digits = (neg ? -v : v).toString();
  if (decimals === 0) return (neg ? '-' : '') + digits;
  const padded = digits.padStart(decimals + 1, '0');
  const cut = padded.length - decimals;
  return (neg ? '-' : '') + padded.slice(0, cut) + '.' + padded.slice(cut);
}

// ── constructores públicos (el borde) ────────────────────────────────────────
/** Envuelve un valor en base units. `/api/v2/*` → valueString viene así. */
export function baseUnits(coin: Coin, value: bigint | string): BaseMoney {
  return base(coin, typeof value === 'bigint' ? value : parseIntegerString(value));
}

/** Envuelve input de USUARIO en display units. Rechaza más decimales que el
 *  activo (SCREENS §1.1: el campo no acepta el tercer decimal). */
export function displayUnits(coin: Coin, value: string): DisplayMoney {
  const { decimals } = assetOf(coin);
  // Normaliza a forma canónica de una vez (valida decimales de paso).
  return display(coin, bigIntToDecimal(decimalToBigInt(value, decimals), decimals));
}

/** Envuelve display units que YA vienen de BitGo (fuente confiable). A
 *  diferencia de displayUnits (input de usuario), no rechaza precisión: BitGo
 *  ya manda el decimal del activo. Solo valida que sea un número decimal. */
export function displayFromBitGo(coin: Coin, value: string): DisplayMoney {
  const t = value.trim();
  if (!/^-?\d+(\.\d+)?$/.test(t)) throw new Error(`Monto display inválido de BitGo: "${value}"`);
  return display(coin, t);
}

// ── conversión ───────────────────────────────────────────────────────────────
export function toDisplay(m: BaseMoney): DisplayMoney {
  const { decimals } = assetOf(m.coin);
  return display(m.coin, bigIntToDecimal(m.value, decimals));
}

export function toBase(m: DisplayMoney): BaseMoney {
  const { decimals } = assetOf(m.coin);
  return base(m.coin, decimalToBigInt(m.value, decimals));
}

/** MoneyLite (la variante sin marca que viaja por el BFF) → BaseMoney. Punto
 *  único para convertir un monto "suelto" a base units, según su unidad. */
export function fromLite(m: MoneyLite): BaseMoney {
  return m.unit === 'base' ? baseUnits(m.coin, m.value) : toBase(displayUnits(m.coin, m.value));
}

// ── aritmética: solo base, solo mismo coin ───────────────────────────────────
function assertSameCoin(a: BaseMoney, b: BaseMoney): void {
  if (a.coin !== b.coin) {
    throw new Error(`No se pueden operar montos de distinto activo: ${a.coin} vs ${b.coin}`);
  }
}

export function addBase(a: BaseMoney, b: BaseMoney): BaseMoney {
  assertSameCoin(a, b);
  return base(a.coin, a.value + b.value);
}

export function subBase(a: BaseMoney, b: BaseMoney): BaseMoney {
  assertSameCoin(a, b);
  return base(a.coin, a.value - b.value);
}

/** -1 si a<b, 0 si igual, 1 si a>b. Lanza si difieren de activo. */
export function cmpBase(a: BaseMoney, b: BaseMoney): -1 | 0 | 1 {
  assertSameCoin(a, b);
  return a.value < b.value ? -1 : a.value > b.value ? 1 : 0;
}

export function gteBase(a: BaseMoney, b: BaseMoney): boolean {
  return cmpBase(a, b) >= 0;
}

export function isNegative(m: BaseMoney): boolean {
  return m.value < 0n;
}

export function absBase(m: BaseMoney): BaseMoney {
  return base(m.coin, m.value < 0n ? -m.value : m.value);
}

// ── formateo para la UI (sin number, sin parseFloat) ─────────────────────────
/** Agrupa el entero con separador de miles operando sobre el string decimal.
 *  Client-safe: opera sobre el string, sirve para el JSON ya parseado. */
export function formatMoneyValue(value: string, opts?: { symbol?: string }): string {
  const neg = value.startsWith('-');
  const [intPart = '0', frac] = value.replace(/^-/, '').split('.');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const num = frac ? `${grouped}.${frac}` : grouped;
  return `${neg ? '-' : ''}${opts?.symbol ?? ''}${num}`;
}

export function formatDisplay(m: DisplayMoney, opts?: { symbol?: string }): string {
  return formatMoneyValue(m.value, opts);
}

/** Sanitiza input de monto: solo dígitos y UN separador decimal (descarta el
 *  resto). Client-safe; el borde real de validación sigue siendo displayUnits. */
export function sanitizeDecimalInput(s: string): string {
  const cleaned = s.replace(/[^0-9.]/g, '');
  const dot = cleaned.indexOf('.');
  if (dot === -1) return cleaned;
  return cleaned.slice(0, dot + 1) + cleaned.slice(dot + 1).replace(/\./g, '');
}
