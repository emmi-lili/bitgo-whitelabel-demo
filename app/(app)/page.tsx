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
import { StakingCard } from '@/components/staking';
import { useApi } from '@/components/useApi';
import type { PortfolioView, TransactionsView, ProductsView } from '@/components/types';

const svg = (paths: string) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    dangerouslySetInnerHTML={{ __html: paths }}
  />
);

const HERO_ACTIONS: Array<{ href: string; label: string; icon: JSX.Element }> = [
  { href: '/trade?side=buy', label: 'Comprar', icon: svg('<path d="M12 5v14"/><path d="M6 13l6 6 6-6"/>') },
  { href: '/trade?side=sell', label: 'Vender', icon: svg('<path d="M12 19V5"/><path d="M6 11l6-6 6 6"/>') },
  {
    href: '/trade?side=swap',
    label: 'Swap',
    icon: svg('<path d="M7 8h13"/><path d="M17 4l4 4-4 4"/><path d="M17 16H4"/><path d="M7 12l-3 4 3 4"/>'),
  },
  {
    href: '/transfer',
    label: 'Transferir',
    icon: svg('<path d="M22 2 11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/>'),
  },
];

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

        {/* Quick actions: el balance es el héroe, las acciones son pares tranquilos */}
        <div className="hero-actions">
          {HERO_ACTIONS.map((a) => (
            <Link key={a.href} href={a.href} className="hero-action">
              <span className="ha-icon">{a.icon}</span>
              {a.label}
            </Link>
          ))}
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

      {/* ── DeFi: SOL staking (REAL APR, demo settlement) ───────────────────── */}
      <SectionHeader title="DeFi" />
      <StakingCard />

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
