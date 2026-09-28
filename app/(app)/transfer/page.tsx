'use client';

// Misma lógica de Fase 3 (sequenceId, doble clic, cuatro desenlaces, timeout),
// con el shell visual de Inicio: AppHeader + cards + botones del design system.
import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui';
import { fetchJson, useApi } from '@/components/useApi';
import { sanitizeDecimalInput } from '@/lib/domain/money';
import type { TransferOutcome, TransferStatusResult } from '@/lib/domain/transfer';

type Destination = { id: string; label: string };

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
  const [manual, setManual] = useState(false);
  const [amount, setAmount] = useState('');
  const [comment, setComment] = useState('');
  const [sequenceId, setSequenceId] = useState<string>(newSeq());
  const [view, setView] = useState<View>({ kind: 'form' });

  const destinations = useApi<{ destinations: Destination[] }>('/api/destinations');

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
      <div className="header">
        <Link href="/" className="link" aria-label="Volver">
          ← Volver
        </Link>
      </div>
      <h1 className="screen-title" style={{ marginBottom: 8 }}>
        Transferir
      </h1>

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

            {/* Destinatario: lista corta conocida, no campo libre (SCREENS §1.1). */}
            <div className="field">
              <span className="label">Para</span>
              <div className="recipients">
                {destinations.data?.destinations.map((d) => {
                  const active = !manual && destinationWalletId === d.id;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      className="recipient"
                      data-active={active}
                      aria-pressed={active}
                      onClick={() => {
                        setManual(false);
                        setDestination(d.id);
                      }}
                    >
                      <span className="recipient-avatar" aria-hidden>
                        {d.label.slice(0, 1)}
                      </span>
                      <span className="recipient-body">
                        <span className="recipient-name">{d.label}</span>
                        <span className="recipient-id mono">{d.id.slice(0, 12)}…</span>
                      </span>
                      {active && <span aria-hidden>✓</span>}
                    </button>
                  );
                })}
                <button
                  type="button"
                  className="recipient"
                  data-active={manual}
                  aria-pressed={manual}
                  onClick={() => {
                    setManual(true);
                    setDestination('');
                  }}
                >
                  <span className="recipient-avatar" aria-hidden>
                    +
                  </span>
                  <span className="recipient-body">
                    <span className="recipient-name">Otra cuenta</span>
                    <span className="recipient-id muted">Pegar un ID de cuenta destino</span>
                  </span>
                </button>
              </div>
              {manual && (
                <input
                  className="field-control mono"
                  style={{ marginTop: 8 }}
                  value={destinationWalletId}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="ID de la cuenta destino"
                  aria-label="Cuenta destino"
                  autoComplete="off"
                  spellCheck={false}
                />
              )}
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
        </>
      )}

      {(view.kind === 'sending' || view.kind === 'verifying') && (
        <SendProgress phase={view.kind} />
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

// Stepper de fases REALES: 'sending' (envío) → 'verifying' (confirmación tras
// timeout). No inventamos sub-pasos que no podemos observar.
function SendProgress({ phase }: { phase: 'sending' | 'verifying' }) {
  const steps = [
    { label: 'Enviando', done: phase === 'verifying', active: phase === 'sending' },
    { label: 'Confirmando', done: false, active: phase === 'verifying' },
  ];
  return (
    <Card style={{ marginTop: 8 }}>
      <div className="stepper" aria-live="polite">
        {steps.map((s) => (
          <div
            className="step"
            key={s.label}
            data-state={s.done ? 'done' : s.active ? 'active' : 'pending'}
          >
            <span className="step-dot" aria-hidden>
              {s.done ? '✓' : s.active ? <span className="spinner" /> : ''}
            </span>
            {s.label}
          </div>
        ))}
      </div>
    </Card>
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
              color: 'var(--negative)',
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
