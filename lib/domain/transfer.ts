// lib/domain/transfer.ts — tipos del flujo de transferencia (compartidos BFF↔UI).
import type { Coin } from './assets';

export type TransferStep = 'validate' | 'build' | 'sign' | 'send';

export interface TransferInput {
  destinationWalletId: string;
  coin: Coin;
  /** Monto en display (lo que tipeó la persona). El BFF lo convierte a base. */
  amount: string;
  /** Generado por el cliente UNA vez y reusado en reintentos y doble clic. */
  sequenceId: string;
  comment?: string;
}

// Los cuatro desenlaces de SCREENS §2, más el duplicado del doble clic.
export type TransferOutcome =
  | {
      outcome: 'accepted'; // §2.1 — para book transfer, `signed` ya es éxito
      sequenceId: string;
      state: string;
      transactionType?: string;
      transferId?: string;
      txid?: string;
    }
  | { outcome: 'pendingApproval'; sequenceId: string; approvalId?: string } // §2.2
  | { outcome: 'duplicate'; sequenceId: string } // doble clic / reenvío
  | {
      outcome: 'failed'; // §2.3
      sequenceId: string;
      step: TransferStep;
      message: string; // mensaje original de BitGo/Express
      source?: 'bitgo' | 'express' | 'app';
    };

// Resultado de consultar el estado por sequenceId (recuperación por timeout §2.4).
export type TransferStatusResult =
  | { outcome: 'accepted'; sequenceId: string; state: string; transferId?: string }
  | { outcome: 'notProcessed'; sequenceId: string }; // no entró: se puede reintentar con el MISMO seq
