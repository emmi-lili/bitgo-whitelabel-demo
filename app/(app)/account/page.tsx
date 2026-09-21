'use client';
import Link from 'next/link';
import { AppHeader } from '@/components/AppHeader';
import {
  Amount,
  Async,
  Badge,
  Card,
  EmptyState,
  MockBadge,
  SectionHeader,
  Skeleton,
  uiSymbol,
} from '@/components/ui';
import { PortfolioList, TradeRow } from '@/components/trading';
import { KYC_MOCK } from '@/lib/mock';
import { useApi } from '@/components/useApi';
import type { AssetBalanceView, BalancesView, PortfolioView } from '@/components/types';

function BalanceRow({ b }: { b: AssetBalanceView }) {
  return (
    <div
      className="row-between"
      style={{ padding: '10px 0', borderBottom: '1px solid var(--hairline)' }}
    >
      <strong>{uiSymbol(b.coin) === '$' ? 'USD' : b.coin.replace('ofct', '').toUpperCase()}</strong>
      <Amount value={b.total.value} coin={b.coin} />
    </div>
  );
}

export default function AccountPage() {
  const portfolio = useApi<PortfolioView>('/api/trading/portfolio');
  const balances = useApi<BalancesView>('/api/balance');

  return (
    <>
      <AppHeader />
      <h1 className="screen-title">Cuenta</h1>

      {/* Account status — KYC/Active are mock (constitution) */}
      <Card>
        <div className="row-between">
          <div>
            <div style={{ fontWeight: 600 }}>{KYC_MOCK.accountName}</div>
            <div className="muted">Estado de la cuenta</div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <Badge kind="active">{KYC_MOCK.status}</Badge>
            <MockBadge>KYC</MockBadge>
          </div>
        </div>
      </Card>

      {/* DEMO portfolio (valued at BitGo's real price) */}
      <SectionHeader title="Portafolio" action={<MockBadge>Demo</MockBadge>} />
      <Card>
        <Async
          state={portfolio}
          skeleton={
            <div className="stack">
              <Skeleton height={48} />
              <Skeleton height={48} />
            </div>
          }
          isEmpty={() => false}
          empty={<EmptyState title="Sin tenencias" />}
        >
          {(d) => (
            <>
              <div className="row-between" style={{ marginBottom: 8 }}>
                <span className="label">Valor total</span>
                <span className="mono" style={{ fontWeight: 700 }}>
                  <Amount value={d.totalUsd.value} coin="ofctusd" />
                </span>
              </div>
              <PortfolioList entries={d.entries} />
              <Link href="/trade" className="btn btn-primary btn-block" style={{ marginTop: 12 }}>
                Operar
              </Link>
            </>
          )}
        </Async>
      </Card>

      {/* Latest demo trades */}
      <Async
        state={portfolio}
        skeleton={<></>}
        isEmpty={(d) => d.trades.length === 0}
        empty={<></>}
      >
        {(d) => (
          <>
            <SectionHeader title="Operaciones" action={<MockBadge>Demo</MockBadge>} />
            <Card>
              {d.trades.slice(0, 6).map((t) => (
                <TradeRow key={t.id} trade={t} />
              ))}
            </Card>
          </>
        )}
      </Async>

      {/* REAL BitGo balances (Go Account OFC, testnet) */}
      <SectionHeader
        title="Balances BitGo"
        action={<span className="badge badge-active">Real · testnet</span>}
      />
      <Card>
        <Async
          state={balances}
          skeleton={
            <div className="stack">
              <Skeleton height={48} />
              <Skeleton height={48} />
            </div>
          }
          isEmpty={(d) => d.balances.length === 0 && d.unmapped.length === 0}
          empty={
            <EmptyState title="Tu Go Account está en cero">Recibí fondos para empezar.</EmptyState>
          }
        >
          {(d) => (
            <div>
              {d.balances.map((b) => (
                <BalanceRow key={b.coin} b={b} />
              ))}
              {d.unmapped.map((u) => (
                <div key={u.currency} className="row-between" style={{ padding: '10px 0' }}>
                  <span>{u.currency}</span>
                  <span className="mono muted">{u.raw.balance}</span>
                </div>
              ))}
            </div>
          )}
        </Async>
        <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
          Saldo on-chain real de la Go Account en BitGo testnet. El portafolio de arriba usa estos
          precios reales pero liquida en un entorno de demo.
        </p>
      </Card>
    </>
  );
}
