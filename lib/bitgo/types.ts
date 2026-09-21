// lib/bitgo/types.ts
// Handle tipado a los tipos GENERADOS desde la spec OpenAPI (lib/bitgo/generated.ts).
// No se escriben shapes de BitGo a mano: se referencian desde acá.
// Los mappers concretos a tipos de dominio se agregan en la Fase 2, cuando
// veamos las respuestas reales.
import type { components, operations, paths } from './generated';

export type Schemas = components['schemas'];
export type Operations = operations;
export type Paths = paths;
