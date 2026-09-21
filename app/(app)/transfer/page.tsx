'use client';

// Misma lógica de Fase 3 (sequenceId, doble clic, cuatro desenlaces, timeout),
// con el shell visual de Inicio: AppHeader + cards + botones del design system.
import { useState } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/components/AppHeader';
import { Card, SectionHeader } from '@/components/ui';
import { fetchJson } from '@/components/useApi';
import { sanitizeDecimalInput } from '@/lib/domain/money';
import type { TransferOutcome, TransferStatusResult } from '@/lib/domain/transfer';

type View =
  | { kind: 'form' }
  | { kind: 'sending' }
  | { kind: 'verifying' }
  | { kind: 'result'; outcome: TransferOutcome }
  | { kind: 'recovered'; status: TransferStatusResult };

function newSeq(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`;
}

export default function TransferPage() {
  const [destinationWalletId, setDestination] = useState('');
  const [amount, setAmount] = useState('');
  const [comment, setComment] = useState('');
  const [sequenceId, setSequenceId] = useState<string>(newSeq());
  const [view, setView] = useState<View>({ kind: 'form' });

  const submitting = view.kind === 'sending' || view.kind === 'verifying';

  async function submit() {
    if (submitting) return;
    const dest = destinationWalletId.trim();
    if (!amount || !dest) return;
    setView({ kind: 'sending' });
    try {
      const { body: outcome } = await fetchJson<TransferOutcome>('/api/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinationWalletId: dest,
          coin: 'ofctusd',
          amount,
          sequenceId,
          comment,
        }),
      });
      setView({ kind: 'result', outcome });
    } catch {
      setView({ kind: 'verifying' });
      try {
        const { body: status } = await fetchJson<TransferStatusResult>(
          `/api/transfer?sequenceId=${encodeURIComponent(sequenceId)}`,
        );
        setView({ kind: 'recovered', status });
      } catch {
        setView({
          kind: 'result',
          outcome: {
            outcome: 'failed',
            sequenceId,
            step: 'send',
            message: 'Sin conexión. No se pudo verificar el estado.',
            source: 'app',
          },
        });
      }
    }
  }

  function reset(fresh: boolean) {
    if (fresh) {
      setSequenceId(newSeq());
      setAmount('');
      setComment('');
    }
    setView({ kind: 'form' });
  }

  return (
    <>
      <AppHeader />
      <div className="row-between" style={{ alignItems: 'baseline' }}>
        <h1 className="screen-title" style={{ marginBottom: 8 }}>
          Transferir
        </h1>
        <Link href="/" className="link">
          Cerrar
        </Link>
      </div>

      {view.kind === 'form' && (
        <>
          <Card style={{ marginTop: 8 }}>
            <div className="field">
              <span className="label">Monto (USD)</span>
              <input
                className="field-control field-control-lg mono"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(sanitizeDecimalInput(e.target.value))}
                placeholder="0.00"
                aria-label="Monto en USD"
              />
            </div>

            <div className="field">
              <span className="label">Para</span>
              <input
                className="field-control mono"
                value={destinationWalletId}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="ID de la cuenta destino"
                aria-label="Cuenta destino"
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            <div className="field" style={{ marginBottom: 0 }}>
              <span className="label">Nota (opcional)</span>
              <input
                className="field-control"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Concepto"
              />
            </div>
          </Card>

          <div style={{ marginTop: 16 }}>
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={submit}
              disabled={!amount || !destinationWalletId.trim()}
            >
              Confirmar transferencia
            </button>
          </div>

          <p className="muted" style={{ marginTop: 12, fontSize: 11 }}>
            seq: <code className="mono">{sequenceId}</code>
          </p>
        </>
      )}

      {view.kind === 'sending' && (
        <Card style={{ marginTop: 8, textAlign: 'center' }}>
          <SectionHeader title="Enviando…" />
          <p className="muted" style={{ margin: 0 }}>
            Preparando · firmando · confirmando
          </p>
        </Card>
      )}

      {view.kind === 'verifying' && (
        <Card style={{ marginTop: 8, textAlign: 'center' }}>
          <SectionHeader title="Verificando…" />
          <p className="muted" style={{ margin: 0 }}>
            Consultando si la transferencia se procesó
          </p>
        </Card>
      )}

      {view.kind === 'result' && (
        <Result outcome={view.outcome} onRetry={() => submit()} onDone={() => reset(true)} />
      )}

      {view.kind === 'recovered' &&
        (view.status.outcome === 'accepted' ? (
          <Result
            outcome={{
              outcome: 'accepted',
              sequenceId,
              state: view.status.state,
              transferId: view.status.transferId,
            }}
            onRetry={() => submit()}
            onDone={() => reset(true)}
          />
        ) : (
          <Card style={{ marginTop: 8 }}>
            <h2 style={{ marginTop: 0, fontSize: 18 }}>La transferencia no entró</h2>
            <p className="muted">
              Podés reintentar con el mismo sequenceId (sin riesgo de doble movimiento).
            </p>
            <button type="button" className="btn btn-primary btn-block" onClick={submit}>
              Reintentar
            </button>
          </Card>
        ))}
    </>
  );
}

function Result({
  outcome,
  onRetry,
  onDone,
}: {
  outcome: TransferOutcome;
  onRetry: () => void;
  onDone: () => void;
}) {
  switch (outcome.outcome) {
    case 'accepted':
      return (
        <Card style={{ marginTop: 8 }}>
          <h2 style={{ marginTop: 0, fontSize: 18 }}>✓ Transferencia confirmada</h2>
          <p className="muted">
            Estado: {outcome.state}
            {outcome.transactionType ? ` · ${outcome.transactionType}` : ''}
          </p>
          {outcome.transferId && (
            <p className="muted" style={{ fontSize: 12 }}>
              ref: <code className="mono">{outcome.transferId}</code>
            </p>
          )}
          <button type="button" className="btn btn-primary btn-block" onClick={onDone}>
            Listo
          </button>
        </Card>
      );
    case 'pendingApproval':
      return (
        <Card style={{ marginTop: 8 }}>
          <h2 style={{ marginTop: 0, fontSize: 18 }}>⏳ Falta una aprobación</h2>
          <p className="muted">
            La transferencia quedó registrada y necesita que <strong>otro administrador</strong> de
            la cuenta la apruebe.
          </p>
          <button type="button" className="btn btn-primary btn-block" onClick={onDone}>
            Listo
          </button>
        </Card>
      );
    case 'duplicate':
      return (
        <Card style={{ marginTop: 8 }}>
          <h2 style={{ marginTop: 0, fontSize: 18 }}>Ya enviada</h2>
          <p className="muted">Ese sequenceId ya se usó. No se creó una segunda transferencia.</p>
          <button type="button" className="btn btn-primary btn-block" onClick={onDone}>
            Listo
          </button>
        </Card>
      );
    case 'failed':
      return (
        <Card style={{ marginTop: 8 }}>
          <h2 style={{ marginTop: 0, fontSize: 18 }}>✕ No se pudo completar</h2>
          <p className="muted">Falló al {outcome.step}.</p>
          <pre
            className="mono"
            style={{
              whiteSpace: 'pre-wrap',
              color: 'var(--negative, #b91c1c)',
              fontSize: 12,
              margin: '8px 0 16px',
            }}
          >
            {outcome.message}
          </pre>
          {outcome.source === 'express' && (
            <p style={{ fontWeight: 600, marginBottom: 16 }}>No se movió dinero.</p>
          )}
          <div className="action-pair" style={{ marginTop: 0 }}>
            <button type="button" className="btn btn-primary" onClick={onRetry}>
              Reintentar
            </button>
            <button type="button" className="btn btn-secondary" onClick={onDone}>
              Cerrar
            </button>
          </div>
        </Card>
      );
  }
}
