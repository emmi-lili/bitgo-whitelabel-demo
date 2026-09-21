'use client';
import Link from 'next/link';
import { Amount, Async, Badge, Card, Skeleton } from '@/components/ui';
import { useApi } from '@/components/useApi';
import type { TransactionView } from '@/components/types';
import { mockMerchant } from '@/lib/mock/categories';

function fmtTime(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleString('es', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: 'short',
      });
}

export default function TxDetailPage({ params }: { params: { id: string } }) {
  const state = useApi<TransactionView>(`/api/transactions/${encodeURIComponent(params.id)}`);

  return (
    <>
      <div className="header">
        <Link href="/history" className="link" aria-label="Volver">
          ← Volver
        </Link>
      </div>

      <Async state={state} skeleton={<Skeleton height={120} style={{ marginTop: 16 }} />}>
        {(tx) => (
          <>
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div className="hero-amount" style={{ fontSize: 30 }}>
                <Amount value={tx.amount.value} coin={tx.coin} direction={tx.direction} />
              </div>
              <div style={{ marginTop: 4 }}>{mockMerchant(tx)}</div>
              <div style={{ marginTop: 6 }}>
                {tx.pending ? (
                  <Badge kind="pending">PENDING</Badge>
                ) : (
                  <span className="muted">{tx.state}</span>
                )}
              </div>
            </div>

            {/* Línea de tiempo — desde history[] real (SCREENS §4) */}
            {tx.history.length > 0 && (
              <Card>
                <div className="label" style={{ marginBottom: 8 }}>
                  Línea de tiempo
                </div>
                <div className="stack">
                  {tx.history.map((h, i) => (
                    <div className="row-between" key={`${h.action}-${i}`}>
                      <span>● {h.action}</span>
                      <span className="muted mono">{fmtTime(h.date)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Detalles */}
            <Card style={{ marginTop: 16 }}>
              <div className="label" style={{ marginBottom: 8 }}>
                Detalles
              </div>
              <div className="info-table">
                <div className="info-row">
                  <span className="muted">Tipo</span>
                  <span>{tx.isBookTransfer ? 'Transferencia interna' : (tx.subType ?? '—')}</span>
                </div>
                {tx.comment && (
                  <div className="info-row">
                    <span className="muted">Nota</span>
                    <span>{tx.comment}</span>
                  </div>
                )}
                <div className="info-row">
                  <span className="muted">Referencia</span>
                  <span className="mono" style={{ fontSize: 12 }}>
                    {tx.internalRef.slice(0, 10)}…
                  </span>
                </div>
                <div className="info-row">
                  <span className="muted">Hash on-chain</span>
                  {/* Book transfer: sin registro en blockchain. Si no, guion hasta confirmar. */}
                  <span className="mono" style={{ fontSize: 12 }}>
                    {tx.isBookTransfer
                      ? 'Movimiento interno, sin blockchain'
                      : (tx.onChainTxid ?? '—')}
                  </span>
                </div>
              </div>
            </Card>
          </>
        )}
      </Async>
    </>
  );
}
