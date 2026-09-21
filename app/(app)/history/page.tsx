'use client';
import { useMemo, useState } from 'react';
import { AppHeader } from '@/components/AppHeader';
import { Amount, Async, Card, EmptyState, Skeleton } from '@/components/ui';
import { TransactionGroupedList } from '@/components/TransactionList';
import { useApi } from '@/components/useApi';
import type { TransactionsView, TransactionView } from '@/components/types';
import { mockCategory, mockMerchant } from '@/lib/mock/categories';
import { baseUnits, displayFromBitGo, toBase, toDisplay } from '@/lib/domain/money';

type Segment = 'all' | 'income' | 'expense';

// SegmentedControl → filtro nativo type=send|receive (UI.md §2).
const SEGMENT_PATH: Record<Segment, string> = {
  all: '/api/transactions?limit=100',
  income: '/api/transactions?limit=100&type=receive',
  expense: '/api/transactions?limit=100&type=send',
};

// Gasto mensual (DERIVADO): suma en base units de los egresos ofctusd del mes.
// Uso bigint, no la suma de `usd` (float) — la regla de dinero manda sobre UI.md.
function monthlyOutgoing(txs: TransactionView[]): string {
  const now = new Date();
  let sum = 0n;
  for (const tx of txs) {
    if (tx.direction !== 'out' || tx.coin !== 'ofctusd') continue;
    const d = new Date(tx.date);
    if (d.getFullYear() !== now.getFullYear() || d.getMonth() !== now.getMonth()) continue;
    sum += toBase(displayFromBitGo('ofctusd', tx.amount.value)).value;
  }
  return toDisplay(baseUnits('ofctusd', sum.toString())).value;
}

export default function HistoryPage() {
  const [segment, setSegment] = useState<Segment>('all');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);

  const state = useApi<TransactionsView>(SEGMENT_PATH[segment]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    state.data?.transactions.forEach((tx) => set.add(mockCategory(tx).label));
    return Array.from(set);
  }, [state.data]);

  function filter(txs: TransactionView[]): TransactionView[] {
    return txs.filter((tx) => {
      if (category && mockCategory(tx).label !== category) return false;
      if (query) {
        const hay = `${mockMerchant(tx)} ${mockCategory(tx).label}`.toLowerCase();
        if (!hay.includes(query.toLowerCase())) return false;
      }
      return true;
    });
  }

  const filtered = state.data ? filter(state.data.transactions) : [];

  return (
    <>
      <AppHeader />
      <h1 className="screen-title">Historial</h1>

      <input
        className="search"
        placeholder="Buscar"
        aria-label="Buscar movimientos"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="segmented" style={{ marginTop: 12 }} role="tablist">
        {(['all', 'income', 'expense'] as Segment[]).map((s) => (
          <button key={s} role="tab" data-active={segment === s} onClick={() => setSegment(s)}>
            {s === 'all' ? 'Todos' : s === 'income' ? 'Ingresos' : 'Gastos'}
          </button>
        ))}
      </div>

      {/* Chips de categoría — 🟡 mock */}
      <div className="section-header" style={{ marginBottom: 4 }}>
        <span className="label">Categorías</span>
      </div>
      <div className="chips">
        <button className="chip" data-active={category === null} onClick={() => setCategory(null)}>
          Todas
        </button>
        {categories.map((c) => (
          <button
            key={c}
            className="chip"
            data-active={category === c}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Card azul: gasto mensual agregado (derivado) */}
      <Card style={{ marginTop: 16, background: 'var(--brand)', color: '#fff', border: 'none' }}>
        <div className="row-between">
          <span className="label" style={{ color: '#dbe4ff' }}>
            Gastos · este mes
          </span>
        </div>
        <div className="hero-amount" style={{ fontSize: 28 }}>
          {state.data ? (
            <Amount value={monthlyOutgoing(state.data.transactions)} coin="ofctusd" />
          ) : (
            <Skeleton height={28} width={120} />
          )}
        </div>
      </Card>

      {/* Lista agrupada por día */}
      <div style={{ marginTop: 16 }}>
        <Async
          state={state}
          skeleton={
            <Card>
              <div className="stack">
                <Skeleton height={44} />
                <Skeleton height={44} />
                <Skeleton height={44} />
              </div>
            </Card>
          }
          isEmpty={(d) => d.transactions.length === 0}
          empty={
            <EmptyState title="Todavía no hay movimientos">
              Cuando transfieras o recibas, aparecen acá.
            </EmptyState>
          }
        >
          {() =>
            filtered.length === 0 ? (
              <EmptyState
                title="Ningún movimiento con esos filtros"
                action={
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setQuery('');
                      setCategory(null);
                    }}
                  >
                    Limpiar filtros
                  </button>
                }
              />
            ) : (
              <Card>
                <TransactionGroupedList transactions={filtered} />
              </Card>
            )
          }
        </Async>
      </div>
    </>
  );
}
