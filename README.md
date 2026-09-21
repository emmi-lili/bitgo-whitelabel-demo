# BitGo Whitelabel — Neobank

App de neobank (whitelabel) sobre **BitGo**, construida con **Next.js 14 (App Router)** y
TypeScript estricto. La UI es un shell mobile-first; el servidor actúa de **BFF**: nunca
expone tokens ni llama a BitGo desde el navegador.

## Qué es real y qué es demo

Este proyecto corre contra **testnet**. La regla (ver `Instrucciones-btgo.md`) es que los
datos reales y los simulados **nunca se mezclan en la misma función**, y la UI marca lo
simulado con un badge visible:

| Dominio                                                       | Fuente                                                                                    |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Balances / transacciones / transferencias (book transfer A→B) | **Real** (BitGo API + Express para firmar)                                                |
| Precios de trading (level1)                                   | **Real** (BitGo Prime Trading)                                                            |
| Liquidación de compra/venta/swap                              | **Demo** — ledger local en `.data/ledger.json` (la Go Account de testnet está sin fondos) |
| Categorías / comercios en el historial                        | **Mock** (`lib/mock/*`), badgeado en la UI                                                |

## Requisitos

- Node.js 18+ (se usa `crypto.randomUUID` y `fetch` nativos)
- Una cuenta BitGo testnet con dos Go Accounts (A y B) confirmadas en el spike de Fase 0
- BitGo Express corriendo local para firmar (`BITGO_EXPRESS_URL`)

## Setup

```bash
npm install
cp .env.example .env.local   # completá las variables (ver abajo)
npm run dev                  # http://localhost:3000
```

### Variables de entorno

Todas son **server-side** (nunca llegan al navegador). Ver `.env.example`:

| Variable                              | Descripción                                                         |
| ------------------------------------- | ------------------------------------------------------------------- |
| `BITGO_ACCESS_TOKEN`                  | Token de acceso del enterprise (secreto)                            |
| `BITGO_ENTERPRISE_ID`                 | ID del enterprise                                                   |
| `BITGO_API_BASE`                      | Base de la API (default `https://app.bitgo-test.com`)               |
| `BITGO_EXPRESS_URL`                   | URL del Express local para firmar (default `http://localhost:3080`) |
| `GO_ACCOUNT_A_ID` / `GO_ACCOUNT_B_ID` | Go Accounts origen/destino                                          |
| `TSOL_WALLET_ID`                      | Wallet Solana testnet (opcional; si queda vacía no se consulta)     |
| `WALLET_PASSPHRASE`                   | Passphrase de la wallet (solo la usa el BFF para firmar)            |

## Scripts

| Comando                                   | Qué hace                                                    |
| ----------------------------------------- | ----------------------------------------------------------- |
| `npm run dev`                             | Servidor de desarrollo                                      |
| `npm run build` / `npm start`             | Build y arranque de producción                              |
| `npm run typecheck`                       | `tsc --noEmit` (TypeScript estricto)                        |
| `npm run lint`                            | ESLint (`next/core-web-vitals`)                             |
| `npm run format` / `npm run format:check` | Prettier                                                    |
| `npm test`                                | Typecheck + tests unitarios (`node --test`)                 |
| `npm run gen:bitgo`                       | Regenera `lib/bitgo/generated.ts` desde el OpenAPI de BitGo |

## Arquitectura

Capas, de adentro hacia afuera:

```
lib/domain/     Tipos y reglas de negocio puras. money.ts es el ÚNICO módulo que
                convierte unidades (bigint base / string display; nunca `number`).
lib/bitgo/      Cliente HTTP del BFF, config de secretos (server-only), lecturas y
                el flujo de transferencia (build → firmar → send, idempotente).
                generated.ts es el cliente OpenAPI (generado; no se edita a mano).
lib/trading/    Orquesta trading: precio real de BitGo + liquidación en el ledger demo.
lib/demo/       Ledger de liquidación simulada (persistencia JSON en .data/).
lib/store/      Persistencia de transferencias por sequenceId (idempotencia).
lib/mock/       Datos mock (categorías, comercios), aislados y badgeados.
app/api/        Route handlers (BFF). Validan input y delegan en lib/.
app/(app)/      Pantallas (App Router). Client components que consumen /api.
components/     Design system y hooks compartidos (useApi, fetchJson).
```

Principios que conviene respetar al tocar el código:

- **Dinero**: nunca `number` ni `parseFloat`. Montos como `bigint` (base) o `string`
  (display); toda conversión pasa por `lib/domain/money.ts`.
- **Secretos**: solo en `lib/bitgo/config.ts` (con `server-only`); nunca en el cliente.
- **Errores**: se propaga el mensaje real de BitGo/Express; no se ocultan fallas.
- **Idempotencia**: las transferencias se persisten **antes** de la primera llamada para
  poder recuperarse de un timeout sin arriesgar un doble movimiento.

## Tests

```bash
npm test
```

Cubren la aritmética de dinero (`test/money.test.ts`) y el pricing de trading
(`test/pricing.test.ts`). El chequeo de tipos corre como parte de `npm test`.
