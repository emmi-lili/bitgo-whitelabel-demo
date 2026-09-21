'use client';
import { useRouter } from 'next/navigation';
import { mockCategory, mockMerchant } from '@/lib/mock/categories';
import { Amount, Badge } from './ui';
import type { TransactionView } from './types';

// Fecha corta para el subtítulo.
function shortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es', { day: '2-digit', month: 'short' });
}

// Agrupador por día: TODAY / YESTERDAY / fecha (brief · SCREENS).
function dayBucket(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOf(now) - startOf(d)) / 86_400_000);
  if (days <= 0) return 'HOY';
  if (days === 1) return 'AYER';
  return d.toLocaleDateString('es', { day: '2-digit', month: 'long' }).toUpperCase();
}

export function TransactionRow({ tx }: { tx: TransactionView }) {
  const router = useRouter();
  const cat = mockCategory(tx); // 🟡 categoría/ícono-etiqueta mock; el subType es real
  const merchant = mockMerchant(tx);
  return (
    // UI.md §5: una fila es un botón, no un div con onClick.
    <button
      className="tx-row"
      aria-label={`Ver detalle: ${merchant}, ${cat.label}, ${shortDate(tx.date)}`}
      onClick={() => router.push(`/tx/${tx.id}`)}
    >
      <span
        className="tx-icon"
        style={{ background: `var(--cat-${cat.color})`, color: `var(--cat-${cat.color}-ink)` }}
        aria-hidden
      >
        {cat.icon}
      </span>
      <span className="tx-body">
        <span className="tx-title">{merchant}</span>
        <span className="tx-sub">
          {cat.label} · {shortDate(tx.date)}
          {tx.pending && (
            <>
              {' '}
              <Badge kind="pending">PENDING</Badge>
            </>
          )}
        </span>
      </span>
      <Amount
        className="tx-amount"
        value={tx.amount.value}
        coin={tx.coin}
        direction={tx.direction}
      />
    </button>
  );
}

export function TransactionGroupedList({ transactions }: { transactions: TransactionView[] }) {
  const groups: Array<{ bucket: string; items: TransactionView[] }> = [];
  for (const tx of transactions) {
    const bucket = dayBucket(tx.date);
    const last = groups[groups.length - 1];
    if (last && last.bucket === bucket) last.items.push(tx);
    else groups.push({ bucket, items: [tx] });
  }
  return (
    <div>
      {groups.map((g) => (
        <div className="day-group" key={g.bucket + (g.items[0]?.id ?? '')}>
          <div className="label" style={{ marginBottom: 4 }}>
            {g.bucket}
          </div>
          {g.items.map((tx) => (
            <TransactionRow key={tx.id} tx={tx} />
          ))}
        </div>
      ))}
    </div>
  );
}
