'use client';
import Link from 'next/link';
import { AppHeader } from '@/components/AppHeader';
import {
  Amount,
  Async,
  Card,
  EmptyState,
  MockBadge,
  SectionHeader,
  Skeleton,
} from '@/components/ui';
import { TransactionRow } from '@/components/TransactionList';
import { DeltaChip, SavingsGoalCard } from '@/components/mock';
import { MarketList } from '@/components/trading';
import { useApi } from '@/components/useApi';
import type { PortfolioView, TransactionsView, ProductsView } from '@/components/types';

export default function DashboardPage() {
  const portfolio = useApi<PortfolioView>('/api/trading/portfolio');
  const market = useApi<ProductsView>('/api/trading/products');
  const recent = useApi<TransactionsView>('/api/transactions?limit=4');

  return (
    <>
      <AppHeader />

      {/* ── Balance hero: demo portfolio valued at the REAL price ───────────── */}
      <Card style={{ marginTop: 8 }}>
        <div className="row-between">
          <div className="label">Valor del portafolio</div>
          <MockBadge>Demo</MockBadge>
        </div>
        <Async
          state={portfolio}
          skeleton={<Skeleton height={40} width={180} style={{ margin: '6px 0' }} />}
          isEmpty={() => false}
          empty={<div className="hero-amount mono">$0.00</div>}
        >
          {(d) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
              <span className="hero-amount">
                <Amount value={d.totalUsd.value} coin="ofctusd" />
              </span>
              <DeltaChip />
            </div>
          )}
        </Async>

        {/* Trading actions + transfer */}
        <div className="trade-actions">
          <Link href="/trade?side=buy" className="btn btn-primary">
            Comprar
          </Link>
          <Link href="/trade?side=sell" className="btn btn-secondary">
            Vender
          </Link>
          <Link href="/trade?side=swap" className="btn btn-secondary">
            Swap
          </Link>
        </div>
        <div style={{ marginTop: 10 }}>
          <Link href="/transfer" className="btn btn-secondary btn-block">
            Transferir
          </Link>
        </div>
      </Card>

      {/* ── Market: REAL live prices from BitGo ─────────────────────────────── */}
      <SectionHeader
        title="Mercado"
        action={
          <Link className="link" href="/trade">
            Operar
          </Link>
        }
      />
      <Card>
        <Async
          state={market}
          skeleton={
            <div className="stack">
              <Skeleton height={44} />
              <Skeleton height={44} />
              <Skeleton height={44} />
            </div>
          }
          isEmpty={(d) => d.assets.length === 0}
          empty={<EmptyState title="Sin mercado disponible">Reintentá en un momento.</EmptyState>}
        >
          {(d) => <MarketList assets={d.assets} />}
        </Async>
      </Card>

      {/* ── Pocket / savings goal (mock, Revolut style) ─────────────────────── */}
      <SectionHeader title="Ahorros" action={<MockBadge>Simulado</MockBadge>} />
      <SavingsGoalCard />

      {/* ── Recent (real, from BitGo) ───────────────────────────────────────── */}
      <SectionHeader
        title="Movimientos"
        action={
          <Link className="link" href="/history">
            Ver historial
          </Link>
        }
      />
      <Card>
        <Async
          state={recent}
          skeleton={
            <div className="stack">
              <Skeleton height={44} />
              <Skeleton height={44} />
              <Skeleton height={44} />
            </div>
          }
          isEmpty={(d) => d.transactions.length === 0}
          empty={
            <EmptyState title="Todavía no hay movimientos">
              Cuando transfieras o recibas, aparecen acá.
            </EmptyState>
          }
        >
          {(d) => (
            <div>
              {d.transactions.slice(0, 4).map((tx) => (
                <TransactionRow key={tx.id} tx={tx} />
              ))}
            </div>
          )}
        </Async>
      </Card>
    </>
  );
}
