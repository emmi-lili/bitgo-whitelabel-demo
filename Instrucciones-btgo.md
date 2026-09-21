# Bitgo Whitelabel — Constitución del proyecto

Wallet cripto con estética de app bancaria, sobre BitGo testnet. El objetivo del MVP es **validar transferencias reales entre dos Go Accounts y verlas reflejadas en el dashboard**. Todo lo demás es secundario.

---

## Regla cero: no inventes endpoints de BitGo

Si vas a escribir una llamada a BitGo y no la verificaste en esta sesión, **no la escribas**. Consultá primero `https://developers.bitgo.com/llms.txt` (índice completo en Markdown, con las rutas de cada endpoint) y después la página de referencia específica.

Si no podés verificar, dejá un `// TODO(verify):` con la URL de la referencia y decilo en voz alta. Un TODO honesto cuesta cinco minutos. Un endpoint inventado cuesta medio día de debugging contra un 404 que parece un problema de auth.

Ver `skills/bitgo-integration/SKILL.md` para las reglas de integración y las trampas conocidas.
Ver `UI.md` para tokens de diseño, inventario de componentes y estados obligatorios.
Ver `SCREENS.md` para el comportamiento de las pantallas que no están en el mockup.

---

## Qué es real y qué está mockeado

Esta distinción tiene que ser visible en el código y en la UI. No hay mocks silenciosos.

**Real, contra BitGo testnet:** balances, transferencias entre Go Accounts (book transfers), historial de movimientos, direcciones de recepción, **productos y precios de trading (bid/ask de `level1`)**.

**Mockeado, con etiqueta visible en pantalla:** KYC (badge estático), tarjeta física, límite de crédito, APR, ciclo de facturación, auto-pay, savings goal, categorías de gasto tipo "Food & Drink", y **la liquidación de compra/venta/swap**: los precios son reales pero el settlement ocurre en un ledger demo sembrado (`lib/demo/ledger.ts`), porque la Go Account de testnet está en cero y no hay faucet de saldo de trading. Toda pantalla de trading lleva `<MockBadge/>` aclarándolo.

**Fuera de alcance del MVP:** wire, ACH, Plaid, retiros on-chain, staking, órdenes limit/stop/TWAP, y órdenes de trading con fondeo real (el cliente `lib/bitgo/trading.ts` ya las soporta y están verificadas contra la API, pero requieren fondear la Go Account).

Los datos mock viven en `lib/mock/` y **nunca** se mezclan con respuestas de BitGo dentro de la misma función. Todo componente que renderiza datos mock muestra un `<MockBadge />`. Si te encontrás queriendo mockear una respuesta de BitGo para "que funcione", pará: eso es exactamente la deuda que estamos evitando.

---

## Arquitectura

```
Browser (Next.js)  →  BFF (API routes)  →  BitGo REST (app.bitgo-test.com)
                                        →  BitGo Express (localhost:3080, firma)
```

El navegador nunca ve el access token ni la wallet passphrase. Cero excepciones, ni siquiera "temporalmente para probar".

Capas, y cada una tiene una sola responsabilidad:

- `lib/bitgo/` — cliente HTTP tipado. Habla BitGo, devuelve tipos de BitGo. No sabe nada de la UI.
- `lib/domain/` — tipos del dominio (`Money`, `Transaction`, `Balance`) y mappers desde BitGo. Acá y solo acá se convierten unidades.
- `app/api/` — el BFF. Orquesta, valida entrada, no contiene lógica de negocio.
- `app/(ui)/` — pantallas. Consumen tipos de dominio, nunca tipos de BitGo.

Si un componente de React importa algo de `lib/bitgo/`, está mal.

---

## Dinero

Nunca `number`. Nunca `parseFloat`. Los montos son `string` o `bigint`, siempre.

Hay dos convenciones y mezclarlas es el bug número uno de esta integración:

| Namespace              | Unidades          | Ejemplo                   |
| ---------------------- | ----------------- | ------------------------- |
| `/api/prime/trading/*` | display (decimal) | `"balance": "100.0"`      |
| `/api/v2/*`            | base units        | `"valueString": "-10000"` |

Un solo módulo, `lib/domain/money.ts`, hace la conversión. Nadie más convierte. El tipo `Money` lleva la unidad adentro para que el compilador te frene si mezclás.

---

## Tickers

El mismo activo tiene cuatro símbolos según dónde vive:

- `fiatusd` / `tfiatusd` — USD en contexto bancario (prod / test)
- `ofcusd` / `ofctusd` — USD dentro de un Go Account (prod / test)
- `sol` / `tsol` / `ofcsol` / `ofctsol` — mismo patrón para Solana

Todo lo que está dentro de un Go Account lleva prefijo `ofc`. En testnet, el ticker de USD para trading incluye asterisco: `TUSD*`.

Definilos como constantes tipadas en `lib/domain/assets.ts`. Nunca como string literal en medio de una llamada.

---

## Errores

Los errores de BitGo son informativos. Propagalos con su mensaje, no los reemplaces por "algo salió mal". El BFF devuelve `{ error, requestId, source: 'bitgo' | 'express' | 'app' }`.

Si Express no responde, el mensaje al usuario dice "servicio de firma no disponible", no un 500 genérico. Es un modo de falla distinto y se diagnostica distinto.

---

## Definition of done

Ninguna fase se da por cerrada sin esto. No hay "lo arreglo después".

1. Los tipos compilan sin `any` y sin `@ts-ignore`.
2. Ninguna función maneja montos con `number`.
3. Todo dato mock tiene su badge visible.
4. Los errores de BitGo llegan al usuario con su mensaje original.
5. El criterio de salida de la fase (ver `PLAN.md`) se verificó a mano, no se asumió.

---

## Cómo trabajar

Una fase a la vez, en el orden de `PLAN.md`. Cada fase tiene un criterio de salida verificable. No arranques la siguiente sin cumplir el anterior.

Si algo de este documento resulta estar mal (por ejemplo, porque la doc de BitGo dice otra cosa), **corregí este documento primero** y después el código. Un `CLAUDE.md` desactualizado genera más deuda que la que previene.
